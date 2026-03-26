# Testing Framework

Six projects demonstrating test framework design, performance engineering, modern tooling, and AI-assisted testing — built for senior SDET interview readiness.

```
├── api-test-framework/          Java 17 · Rest Assured · TestNG · Allure
├── performance-testing-k6/      k6 · InfluxDB · Grafana · Docker
├── playwright-e2e-framework/    Playwright · TypeScript · POM · Docker
├── ai-test-generator/           Python · Claude API · OpenAPI parser
├── contract-testing-pact/       Pact · TypeScript · Consumer-driven contracts
└── api-mock-service/            WireMock · Docker · Stateful stubs
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java (JDK 17) | 17.x LTS | `brew install openjdk@17` |
| Maven | 3.9+ | `brew install maven` |
| Node.js | 20+ | `brew install node` |
| Python | 3.11+ | `brew install python@3.11` |
| k6 | 1.6+ | `brew install k6` |
| Docker | 29+ | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |

**Critical: Set JAVA_HOME to JDK 17**. Add to `~/.zshrc`:

```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.18/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
```

Then run `source ~/.zshrc`.

---

## Quick Start — Run Every Project

### 1. API Test Framework

```bash
cd api-test-framework
mvn clean test                    # Run all 28 tests against JSONPlaceholder
mvn clean test -Denv=staging      # Switch environment
mvn allure:serve                  # Open Allure report in browser
```

### 2. Performance Testing (k6)

```bash
cd performance-testing-k6
k6 run tests/smoke-test.js        # Quick health check (1 VU, 1 min)
k6 run tests/load-test.js         # Ramp to 100 VUs over 16 min
k6 run tests/stress-test.js       # Push to 500 VUs to find breaking point
k6 run tests/spike-test.js        # Sudden traffic surge simulation
k6 run tests/soak-test.js         # 30-min endurance run
k6 run tests/e2e-load-test.js     # Full user journey under load

# Generate HTML report
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/report.html \
  k6 run tests/load-test.js

# Real-time Grafana dashboard
docker-compose up -d
k6 run --out influxdb=http://localhost:8086/k6 tests/load-test.js
# → Open http://localhost:3000 (admin/admin), import dashboard ID 2587
docker-compose down
```

### 3. Playwright E2E

```bash
cd playwright-e2e-framework
npm install
npx playwright install --with-deps

npx playwright test                   # Run all tests (headless)
npx playwright test --headed          # Watch tests execute in browser
npx playwright test --ui              # Interactive test runner
npx playwright test --project=chromium  # Chrome only
npx playwright test --debug           # Step-through debugger
npx playwright show-report            # Open HTML report

# Docker execution
docker build -t playwright-tests -f docker/Dockerfile .
docker run --rm playwright-tests
```

### 4. AI Test Generator

```bash
cd ai-test-generator
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Run parser tests (no API key needed)
pytest tests/ -v

# Preview parsed endpoints
testgen parse --spec specs/petstore-sample.yaml

# Generate tests (requires API key)
export ANTHROPIC_API_KEY="your-key-here"
testgen generate --spec specs/petstore-sample.yaml --framework rest-assured
```

### 5. Contract Testing (Pact)

```bash
cd contract-testing-pact
npm install

npm run test:consumer     # Step 1: Generate pact contract
npm run test:provider     # Step 2: Verify provider satisfies contract
npm run test:all          # Both steps
```

### 6. API Mock Service (WireMock)

```bash
cd api-mock-service
docker-compose up -d                  # Start WireMock
bash tests/mock-verification.sh       # Run verification suite

# Try endpoints manually
curl http://localhost:8080/api/users/1
curl http://localhost:8080/api/protected                            # 401
curl -H "Authorization: Bearer valid-token-123" \
     http://localhost:8080/api/protected                            # 200
curl http://localhost:8080/api/rate-limited                         # 200 (first)
curl http://localhost:8080/api/rate-limited                         # 429 (second)

docker-compose down
```

---

## Debugging Guide

### Project 1: API Test Framework (Java)

**Test fails with unexpected status code:**
```bash
mvn test -Dtest=UserApiTest#testGetSingleUser -pl .
cat target/surefire-reports/com.sdet.api.tests.UserApiTest.txt
```

**Compilation error — "cannot find symbol: builder()":**
Lombok annotation processing is missing. Verify `pom.xml` has `maven-compiler-plugin` with `annotationProcessorPaths` for Lombok.

**ExceptionInInitializerError / TypeTag :: UNKNOWN:**
Wrong JDK version. Must be JDK 17: `java -version`

**Schema validation fails:**
API response structure changed. Compare actual vs schema:
```bash
curl -s https://jsonplaceholder.typicode.com/users/1 | python3 -m json.tool
```

### Project 2: k6 Performance Testing

**"thresholds on metrics have been crossed":**
Not a bug — the system didn't meet your SLO. Adjust thresholds in `config/thresholds.js`.

**Grafana dashboard shows no data:**
```bash
docker-compose ps                  # Check InfluxDB is running
curl http://localhost:8086/ping     # Should return 204
```

### Project 3: Playwright

**Test fails — element not found:**
```bash
npx playwright test tests/login.spec.ts --debug
npx playwright test --trace on
npx playwright show-trace test-results/<test-folder>/trace.zip
```

**Browsers not installed:**
```bash
npx playwright install --with-deps
```

### Project 4: AI Test Generator

**`ModuleNotFoundError: No module named 'src'`:**
```bash
pip install -e ".[dev]"
```

**`anthropic.AuthenticationError`:**
Parser tests don't need an API key. Only `testgen generate` does.

### Project 5: Pact Contract Testing

**Provider verification fails:**
This is contract testing working correctly — the provider broke the consumer's expectations. Read the diff in the output.

### Project 6: WireMock

**Rate limiting stub always returns 200:**
```bash
curl -X POST http://localhost:8080/__admin/scenarios/reset
```

---

## How to Extend Each Project

Each project's own README has detailed extension guides. Quick summary:

| Project | To Add | Do This |
|---------|--------|---------|
| API Framework | New endpoint | Model → Test data JSON → Test class → testng.xml → Schema |
| k6 | New scenario | `scenarios/apis/new.js` → import in test file |
| Playwright | New page | `pages/NewPage.ts` extends BasePage → test file imports it |
| AI Generator | New framework | Jinja2 template → register in renderer → add system prompt |
| Pact | New interaction | Client method → consumer test → provider state handler |
| WireMock | New stub | JSON file in `mappings/` → restart or hot-reload |

---

## Architecture Overview

```
                    ┌──────────────────────────────────────────────┐
                    │              Test Strategy                    │
                    └──────────────────────────────────────────────┘
                                        │
          ┌─────────────┬───────────────┼───────────────┬──────────────┐
          ▼             ▼               ▼               ▼              ▼
   ┌─────────────┐ ┌─────────┐ ┌──────────────┐ ┌───────────┐ ┌────────────┐
   │ API Tests   │ │ E2E UI  │ │ Performance  │ │ Contract  │ │ Mock       │
   │ (Project 1) │ │ (Proj 3)│ │ (Project 2)  │ │ (Proj 5)  │ │ (Proj 6)  │
   │             │ │         │ │              │ │           │ │            │
   │ Rest Assured│ │Playwright│ │ k6 + Grafana│ │ Pact      │ │ WireMock   │
   │ + TestNG    │ │ + TS    │ │              │ │           │ │            │
   └──────┬──────┘ └────┬────┘ └──────┬───────┘ └─────┬─────┘ └─────┬──────┘
          │              │             │               │             │
          └──────────────┴──────┬──────┴───────────────┘             │
                                │                                    │
                    ┌───────────▼───────────┐          ┌─────────────▼──────┐
                    │  JSONPlaceholder API   │          │  Simulated APIs    │
                    │  (Live test target)    │          │  (Local Docker)    │
                    └───────────────────────┘          └────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  AI Test Generator    │
                    │  (Project 4)          │
                    │  Parses specs →       │
                    │  Generates tests      │
                    └───────────────────────┘
```

## Key Design Patterns

| Project | Pattern | Why |
|---------|---------|-----|
| API Framework | Template Method, Builder, Data Provider | Framework-level config, clean test data separation |
| k6 | Scenario/Test separation, Threshold-based SLOs | Reusable scenarios across test types |
| Playwright | Page Object Model, Custom Fixtures | Maintainable selectors, reusable auth state |
| AI Generator | Parser → LLM → Template pipeline | Consistent output + creative test coverage |
| Pact | Consumer-driven contracts | Decoupled microservice testing |
| WireMock | Stateful scenarios, Response templating | Simulate real API behaviors locally |
