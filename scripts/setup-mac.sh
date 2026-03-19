#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Senior SDET Portfolio — macOS Setup Script
# ═══════════════════════════════════════════════════════════════════════
#
# PURPOSE: Installs all prerequisites for the 6 portfolio projects.
# RUN:     chmod +x scripts/setup-mac.sh && ./scripts/setup-mac.sh
#
# WHAT IT INSTALLS:
#   - Homebrew        — macOS package manager (if not present)
#   - Java 17 (LTS)   — API test framework (Rest Assured + TestNG)
#   - Maven 3.9+      — Java build tool
#   - Node.js 20+     — Playwright, Pact, k6 HTML reports
#   - Python 3.11+    — AI test generator
#   - k6              — Performance/load testing
#   - Docker Desktop   — WireMock, Grafana, containerized Playwright
# ═══════════════════════════════════════════════════════════════════════

set -e

# ─── Colors ─────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

step()  { echo -e "\n${CYAN}>>> $1${NC}"; }
ok()    { echo -e "  ${GREEN}OK:${NC} $1"; }
skip()  { echo -e "  ${YELLOW}SKIP:${NC} $1 (already installed)"; }
fail()  { echo -e "  ${RED}FAIL:${NC} $1"; }

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Senior SDET Portfolio — macOS Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ─── 1. Homebrew ────────────────────────────────────────────────────

step "Checking Homebrew..."

if command -v brew &>/dev/null; then
    skip "Homebrew → $(brew --version | head -1)"
else
    echo "  Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ -f /opt/homebrew/bin/brew ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    ok "Homebrew installed"
fi

# ─── 2. Java 17 ────────────────────────────────────────────────────

step "Checking Java 17..."

JAVA17_INSTALLED=false

if command -v java &>/dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -1)
    if echo "$JAVA_VER" | grep -q '"17\.'; then
        skip "Java 17 → $JAVA_VER"
        JAVA17_INSTALLED=true
    else
        echo "  Found Java but not 17: $JAVA_VER"
    fi
fi

# Also check if openjdk@17 is installed via Homebrew but not linked
if ! $JAVA17_INSTALLED && brew list --versions openjdk@17 &>/dev/null; then
    skip "openjdk@17 installed via Homebrew ($(brew list --versions openjdk@17))"
    JAVA17_INSTALLED=true
fi

if ! $JAVA17_INSTALLED; then
    echo "  Installing OpenJDK 17..."
    brew install openjdk@17
    ok "OpenJDK 17 installed"
fi

# Resolve JAVA_HOME path (handles different Homebrew install locations)
if [[ -d "/opt/homebrew/opt/openjdk@17" ]]; then
    JAVA_HOME_PATH="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
elif [[ -d "/usr/local/opt/openjdk@17" ]]; then
    JAVA_HOME_PATH="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
fi

if [[ -n "$JAVA_HOME_PATH" && -d "$JAVA_HOME_PATH" ]]; then
    export JAVA_HOME="$JAVA_HOME_PATH"
    ok "JAVA_HOME=$JAVA_HOME"
else
    fail "Could not determine JAVA_HOME path. Set it manually."
fi

# ─── 3. Maven ───────────────────────────────────────────────────────

step "Checking Maven..."

if command -v mvn &>/dev/null; then
    skip "Maven → $(mvn -version 2>&1 | head -1)"
else
    echo "  Installing Maven..."
    brew install maven
    ok "Maven installed → $(mvn -version 2>&1 | head -1)"
fi

# ─── 4. Node.js ─────────────────────────────────────────────────────

step "Checking Node.js..."

if command -v node &>/dev/null; then
    NODE_VER=$(node -v)
    NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
    if [[ "$NODE_MAJOR" -ge 20 ]]; then
        skip "Node.js → $NODE_VER"
    else
        echo "  Found Node $NODE_VER but need 20+. Installing..."
        brew install node
        ok "Node.js updated → $(node -v)"
    fi
else
    echo "  Installing Node.js..."
    brew install node
    ok "Node.js installed → $(node -v)"
fi

# ─── 5. Python 3.11+ ────────────────────────────────────────────────

step "Checking Python 3.11+..."

PYTHON_OK=false

# Check python3.11, python3.12, python3.13, etc.
for cmd in python3.13 python3.12 python3.11; do
    if command -v "$cmd" &>/dev/null; then
        skip "Python → $($cmd --version)"
        PYTHON_OK=true
        break
    fi
done

# Check if default python3 is 3.11+
if ! $PYTHON_OK && command -v python3 &>/dev/null; then
    PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
    if [[ "$PY_MINOR" -ge 11 ]]; then
        skip "Python → python3 ($PY_VER)"
        PYTHON_OK=true
    fi
fi

if ! $PYTHON_OK; then
    echo "  Installing Python 3.11..."
    brew install python@3.11
    ok "Python 3.11 installed → $(python3.11 --version)"
    echo ""
    echo -e "  ${YELLOW}NOTE:${NC} Use 'python3.11' instead of 'python3' for the AI generator:"
    echo "    python3.11 -m venv .venv"
fi

# ─── 6. k6 ──────────────────────────────────────────────────────────

step "Checking k6..."

if command -v k6 &>/dev/null; then
    skip "k6 → $(k6 version 2>&1 | head -1)"
else
    echo "  Installing k6..."
    brew install k6
    ok "k6 installed → $(k6 version 2>&1 | head -1)"
fi

# ─── 7. Docker ──────────────────────────────────────────────────────

step "Checking Docker..."

if command -v docker &>/dev/null; then
    skip "Docker → $(docker --version)"
else
    echo -e "  ${YELLOW}Docker Desktop is not installed.${NC}"
    echo ""
    echo "  Install options:"
    echo "    Option A (Homebrew Cask):"
    echo "      brew install --cask docker"
    echo ""
    echo "    Option B (Download):"
    echo "      https://www.docker.com/products/docker-desktop/"
    echo ""
    read -p "  Install Docker via Homebrew now? [y/N]: " INSTALL_DOCKER
    if [[ "$INSTALL_DOCKER" =~ ^[Yy]$ ]]; then
        brew install --cask docker
        ok "Docker Desktop installed. Open it from Applications to complete setup."
    else
        echo -e "  ${YELLOW}Skipping Docker. Install it manually before using Projects 2 and 6.${NC}"
    fi
fi

# ─── Set JAVA_HOME in shell config ──────────────────────────────────

step "Checking JAVA_HOME in shell config..."

SHELL_RC="$HOME/.zshrc"
if [[ "$SHELL" == */bash ]]; then
    SHELL_RC="$HOME/.bashrc"
fi

if grep -q "JAVA_HOME.*openjdk@17" "$SHELL_RC" 2>/dev/null; then
    skip "JAVA_HOME already configured in $SHELL_RC"
else
    if [[ -n "$JAVA_HOME_PATH" ]]; then
        echo "" >> "$SHELL_RC"
        echo "# Java 17 LTS — required for API test framework" >> "$SHELL_RC"
        echo "export JAVA_HOME=$JAVA_HOME_PATH" >> "$SHELL_RC"
        echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> "$SHELL_RC"
        ok "Added JAVA_HOME to $SHELL_RC"
        echo -e "  ${YELLOW}Run 'source $SHELL_RC' or open a new terminal for changes to take effect.${NC}"
    fi
fi

# ─── Verification ───────────────────────────────────────────────────

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

ALL_GOOD=true

check_tool() {
    local name=$1
    local cmd=$2
    local args=$3

    if command -v "$cmd" &>/dev/null; then
        local ver=$($cmd $args 2>&1 | head -1)
        printf "  ${GREEN}%-12s${NC} %s\n" "$name" "$ver"
    else
        printf "  ${RED}%-12s${NC} %s\n" "$name" "NOT FOUND"
        ALL_GOOD=false
    fi
}

check_tool "Java"    "java"    "-version"
check_tool "Maven"   "mvn"     "-version"
check_tool "Node"    "node"    "--version"
check_tool "npm"     "npm"     "--version"
check_tool "k6"      "k6"      "version"
check_tool "Docker"  "docker"  "--version"
check_tool "Git"     "git"     "--version"

# Python — check multiple possible commands
PYTHON_FOUND=false
for cmd in python3.11 python3.12 python3.13 python3; do
    if command -v "$cmd" &>/dev/null; then
        ver=$($cmd --version 2>&1)
        printf "  ${GREEN}%-12s${NC} %s\n" "Python" "$ver (via $cmd)"
        PYTHON_FOUND=true
        break
    fi
done
if ! $PYTHON_FOUND; then
    printf "  ${RED}%-12s${NC} %s\n" "Python" "NOT FOUND"
    ALL_GOOD=false
fi

echo ""

if $ALL_GOOD; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  All tools installed successfully!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
else
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Some tools are missing. See notes above.${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
fi

# ─── Next steps ──────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Next Steps — Run Each Project${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  1. API Framework:     cd api-test-framework && mvn clean test"
echo "  2. k6 Performance:    cd performance-testing-k6 && k6 run tests/smoke-test.js"
echo "  3. Playwright E2E:    cd playwright-e2e-framework && npm install && npx playwright install --with-deps && npx playwright test"
echo "  4. AI Generator:      cd ai-test-generator && python3.11 -m venv .venv && source .venv/bin/activate && pip install -e '.[dev]' && pytest tests/ -v"
echo "  5. Pact Contracts:    cd contract-testing-pact && npm install && npm run test:consumer"
echo "  6. WireMock Mocks:    cd api-mock-service && docker-compose up -d && bash tests/mock-verification.sh"
echo ""
