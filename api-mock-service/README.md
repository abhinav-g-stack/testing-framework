# API Mock Service (WireMock)

A **WireMock**-based service virtualization project with dynamic response templating, stateful scenarios, auth header routing, and rate limiting simulation — all running in Docker.

## What Problem Does This Solve?

When your tests depend on external APIs, you inherit their problems:

| External API Problem | Impact on Your Tests |
|---------------------|---------------------|
| Rate limits | Tests fail after running too many times |
| Downtime / maintenance | Tests fail for reasons outside your control |
| Slow responses | Test suite takes 10x longer |
| No error simulation | Can't test how your code handles 500s, timeouts, 429s |
| Cost per call | Payment APIs charge real money per test |
| Non-deterministic data | Tests break when external data changes |
| No state control | Can't test "first call succeeds, second fails" patterns |

WireMock creates a **fake version** of any API that you fully control:

```
Your Code → WireMock (local, fast, predictable) → Simulated Responses
    instead of
Your Code → Real API (remote, slow, unpredictable) → Real Responses
```

## Why Should an SDET Learn This?

Service virtualization shows you understand **testing in isolation** — a critical skill for microservice architectures:

- **Test without dependencies** — your tests never fail because Stripe's API is down
- **Test the untestable** — simulate 500 errors, timeouts, rate limits, slow responses
- **Speed** — local responses in <1ms vs network round-trips of 200ms+
- **Determinism** — same input, same output, every time

Interview talking point: "I use WireMock to virtualize external services during integration testing. This lets me simulate error conditions like rate limiting and timeouts that are impossible to trigger reliably on real APIs."

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | 29+ | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |

### Run

```bash
docker-compose up -d                   # Start WireMock
bash tests/mock-verification.sh        # Run all verification checks
docker-compose down                    # Stop when done
```

---

## Project Structure

```
├── mappings/                           ← Stub definitions (auto-loaded by WireMock)
│   ├── get-user-by-id.json            ← Dynamic: returns user with requested ID
│   ├── get-users-list.json            ← Static: returns user list from __files/
│   ├── create-user.json               ← Echoes request body with generated UUID
│   ├── header-based-auth.json         ← Routes by Authorization header (401/403/200)
│   ├── rate-limited-endpoint.json     ← Stateful: first request succeeds
│   ├── rate-limited-endpoint-blocked.json ← Stateful: subsequent requests get 429
│   ├── simulate-500-error.json        ← 500 with 3-second delay
│   └── simulate-slow-response.json    ← 200 with 10-second delay (timeout testing)
├── __files/
│   └── users-list.json                ← Static response body (large/complex responses)
├── tests/
│   └── mock-verification.sh           ← Automated smoke tests for all stubs
├── docker-compose.yml                 ← WireMock container config
└── README.md
```

---

## The Stubs Explained

### 1. Dynamic Response Templating (`get-user-by-id.json`)

```json
"jsonBody": {
    "id": "{{request.pathSegments.[2]}}",
    "name": "Mock User {{request.pathSegments.[2]}}"
}
```

**What:** GET /api/users/5 → returns `{id: "5", name: "Mock User 5"}`. The response dynamically includes the requested ID.

**Why:** Without templating, you'd need a separate stub file for each user ID. Templating makes one stub handle all IDs.

**Available template variables:** `{{request.path}}`, `{{request.body}}`, `{{request.headers.X-Custom}}`, `{{now}}`, `{{randomValue type='UUID'}}`, `{{jsonPath request.body '$.name'}}`

### 2. Static File Response (`get-users-list.json`)

```json
"response": {
    "bodyFileName": "users-list.json"    ← Loaded from __files/ directory
}
```

**Why:** Inline `jsonBody` works for small responses. For large/complex JSON (50+ fields, nested arrays), use `bodyFileName` to keep mappings readable.

### 3. Auth Header Routing (`header-based-auth.json`)

Three stubs with different **priorities** for the same URL:

| Priority | Condition | Response |
|----------|-----------|----------|
| 1 (highest) | `Authorization: Bearer valid-token-123` | 200 + user data |
| 2 | `Authorization: Bearer *` (any other token) | 403 Forbidden |
| 3 (lowest) | No Authorization header | 401 Unauthorized |

**Why:** Tests your code's auth error handling: Does it redirect to login on 401? Does it show "access denied" on 403? Does it work with a valid token?

### 4. Stateful Rate Limiting (`rate-limited-endpoint.json` + `rate-limited-endpoint-blocked.json`)

WireMock **scenarios** implement a state machine:

```
State: "Started"  ──GET──→  200 + data  ──transition──→  State: "Rate Limited"
State: "Rate Limited"  ──GET──→  429 + Retry-After header
```

**What:** First request succeeds. All subsequent requests get 429 (Too Many Requests). Reset with `POST /__admin/scenarios/reset`.

**Why:** Tests your retry logic, exponential backoff, and Retry-After header handling — scenarios that are **impossible to trigger reliably** on real APIs.

### 5. Error Simulation (`simulate-500-error.json`)

```json
"response": {
    "status": 500,
    "fixedDelayMilliseconds": 3000
}
```

**What:** Returns 500 after a 3-second delay.

**Why:** Tests two things simultaneously: (1) Does your code handle 500 errors gracefully? (2) Does it handle slow responses + errors? The delay simulates a database timeout scenario.

### 6. Slow Response (`simulate-slow-response.json`)

```json
"fixedDelayMilliseconds": 10000    ← 10-second delay
```

**Why:** If your HTTP client has a 5-second timeout, this stub will trigger it. Tests that your code shows a proper timeout error instead of hanging forever.

---

## Design Principles

### 1. Declarative Configuration (JSON Stubs)

**What:** Stubs are JSON files, not code. WireMock auto-loads everything in `mappings/`.

**Why:** Adding a new mock = adding a JSON file. No compilation, no code review complexity. Non-developers can contribute mock definitions.

### 2. Priority-Based Routing

**What:** When multiple stubs match a request, the one with the lowest priority number wins.

**Why:** Lets you create cascading rules: "if header X exists and equals Y, return A. If header X exists but is wrong, return B. Otherwise, return C." This is how real API auth works.

### 3. Stateful Scenarios

**What:** WireMock scenarios are finite state machines. Each request can transition the scenario to a new state, and different states return different responses.

**Why:** Real APIs are stateful. Rate limits, pagination cursors, "create then retrieve" flows, and retry behaviors all depend on previous requests. Stateless mocks can't simulate these.

### 4. Response Templating

**What:** `{{request.pathSegments.[2]}}` extracts the user ID from the URL. `{{jsonPath request.body '$.name'}}` extracts a field from the request body.

**Why:** One stub handles infinite variations. Without templating: 100 user IDs = 100 stub files. With templating: 1 stub file handles all IDs dynamically.

---

## How to Extend

### Add a new basic stub

Create `mappings/get-albums.json`:
```json
{
  "request": { "method": "GET", "url": "/api/albums" },
  "response": {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": [{ "id": 1, "title": "Album 1" }]
  }
}
```
Restart WireMock or hot-reload via API:
```bash
curl -X POST http://localhost:8080/__admin/mappings --data @mappings/get-albums.json
```

### Add fault simulation

WireMock can simulate network faults:
```json
{
  "request": { "method": "GET", "url": "/api/flaky" },
  "response": {
    "fault": "CONNECTION_RESET_BY_PEER"
  }
}
```
Available faults: `EMPTY_RESPONSE`, `MALFORMED_RESPONSE_CHUNK`, `RANDOM_DATA_THEN_CLOSE`, `CONNECTION_RESET_BY_PEER`.

### Add request verification

After running your tests, ask WireMock if the expected requests were made:
```bash
# "Was GET /api/users/1 called exactly 3 times?"
curl -X POST http://localhost:8080/__admin/requests/count \
  -d '{"method": "GET", "url": "/api/users/1"}'
```

### Integrate with your API test framework

Point your Rest Assured tests at WireMock instead of the real API:
```java
// In BaseTest.java or dev.properties:
base.url=http://localhost:8080
```
Now your API tests run against fully controlled mock responses — fast, deterministic, offline-capable.

---

## Learning Resources

### WireMock
- [WireMock Documentation](https://wiremock.org/docs/) — Complete reference
- [WireMock Stubbing](https://wiremock.org/docs/stubbing/) — Request matching and response building
- [WireMock Stateful Behaviour](https://wiremock.org/docs/stateful-behaviour/) — Scenarios and state machines
- [WireMock Response Templating](https://wiremock.org/docs/response-templating/) — Dynamic responses
- [WireMock Docker](https://wiremock.org/docs/docker/) — Container setup

### Service Virtualization Concepts
- [Martin Fowler: Test Double](https://martinfowler.com/bliki/TestDouble.html) — Mocks, stubs, fakes explained
- [Service Virtualization Explained](https://www.infoq.com/articles/service-virtualization-testing/) — When and why to use mocks

### Interview Prep
- "How do you test against external APIs?" → Service virtualization with WireMock. Mock the external API locally for deterministic, fast, isolated tests.
- "How do you test error handling?" → WireMock stubs for 500, 429, timeouts, connection resets. These are impossible to trigger reliably on real APIs.
- "What's the difference between a mock and a stub?" → Stubs return canned responses. Mocks also verify interactions (was this endpoint called?). WireMock does both.
