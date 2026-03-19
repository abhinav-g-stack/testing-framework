#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# WireMock Stub Verification Script
# ═══════════════════════════════════════════════════════════════════════
#
# HOW TO USE:
#   1. Start WireMock:  docker-compose up -d
#   2. Run this script:  bash tests/mock-verification.sh
#   3. Review results
#
# WHAT THIS TESTS:
# - All stub mappings respond with expected status codes
# - Response bodies contain expected fields
# - Rate limiting state machine works (first request succeeds, second gets 429)
# - Auth header routing works (valid token → 200, invalid → 403, none → 401)
# - Error simulation stubs work (500, slow responses)
#
# In a production project, you'd write these as proper test cases in your
# framework (Rest Assured, Playwright, etc.). This shell script is for
# quick validation during development.

BASE_URL="http://localhost:8080"
PASS=0
FAIL=0
TOTAL=0

# ─── Helper Functions ───────────────────────────────────────────────

check_status() {
    local description=$1
    local expected_status=$2
    local actual_status=$3
    ((TOTAL++))

    if [ "$actual_status" -eq "$expected_status" ]; then
        echo "  ✓ PASS: $description (status: $actual_status)"
        ((PASS++))
    else
        echo "  ✗ FAIL: $description (expected $expected_status, got $actual_status)"
        ((FAIL++))
    fi
}

check_body_contains() {
    local description=$1
    local expected_text=$2
    local actual_body=$3
    ((TOTAL++))

    if echo "$actual_body" | grep -q "$expected_text"; then
        echo "  ✓ PASS: $description (body contains '$expected_text')"
        ((PASS++))
    else
        echo "  ✗ FAIL: $description (body missing '$expected_text')"
        ((FAIL++))
    fi
}

# ─── Pre-flight Check ──────────────────────────────────────────────

echo "═══ WireMock Stub Verification ═══"
echo ""
echo "Checking WireMock is running..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/__admin/mappings" 2>/dev/null)
if [ "$status" != "200" ]; then
    echo "  ERROR: WireMock is not running at $BASE_URL"
    echo "  Run: docker-compose up -d"
    exit 1
fi
echo "  WireMock is running."
echo ""

# ─── Basic CRUD Stubs ──────────────────────────────────────────────

echo "── Basic CRUD Endpoints ──"

# GET user by ID
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/1")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -1)
check_status "GET /api/users/1 returns 200" 200 "$status"
check_body_contains "GET /api/users/1 has ID" "1" "$body"

# GET user by different ID (dynamic response)
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/42")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -1)
check_status "GET /api/users/42 returns 200 (dynamic)" 200 "$status"

# GET users list
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -1)
check_status "GET /api/users returns 200" 200 "$status"
check_body_contains "GET /api/users has Alice" "Alice" "$body"

# POST create user
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/users" \
    -H "Content-Type: application/json" \
    -d '{"name":"TestUser","email":"test@example.com"}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -1)
check_status "POST /api/users returns 201" 201 "$status"
check_body_contains "POST /api/users echoes name" "TestUser" "$body"

echo ""

# ─── Error Simulation ──────────────────────────────────────────────

echo "── Error Simulation Endpoints ──"

# 500 error with delay
status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/api/unstable-endpoint")
check_status "GET /api/unstable-endpoint returns 500 (with delay)" 500 "$status"

echo ""

# ─── Auth Header Routing ──────────────────────────────────────────

echo "── Auth Header Routing ──"

# No auth header → 401
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/protected")
check_status "GET /api/protected (no auth) returns 401" 401 "$status"

# Invalid token → 403
status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer invalid-token" "$BASE_URL/api/protected")
check_status "GET /api/protected (invalid token) returns 403" 403 "$status"

# Valid token → 200
response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer valid-token-123" "$BASE_URL/api/protected")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -1)
check_status "GET /api/protected (valid token) returns 200" 200 "$status"
check_body_contains "GET /api/protected returns user data" "admin" "$body"

echo ""

# ─── Rate Limiting State Machine ──────────────────────────────────

echo "── Rate Limiting State Machine ──"

# Reset scenarios first
curl -s -X POST "$BASE_URL/__admin/scenarios/reset" > /dev/null

# First request → 200 (changes state to "Rate Limited")
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/rate-limited")
check_status "GET /api/rate-limited (1st request) returns 200" 200 "$status"

# Second request → 429 (state is now "Rate Limited")
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/rate-limited")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -1)
check_status "GET /api/rate-limited (2nd request) returns 429" 429 "$status"
check_body_contains "429 response has retry info" "retryAfter" "$body"

# Reset for next test run
curl -s -X POST "$BASE_URL/__admin/scenarios/reset" > /dev/null

echo ""

# ─── Summary ──────────────────────────────────────────────────────

echo "═══════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed out of $TOTAL checks"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
