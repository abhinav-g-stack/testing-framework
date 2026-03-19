# Performance / Load Testing Suite

A comprehensive load testing project using **k6** with configurable ramp-up scenarios, SLO-based thresholds, real-time Grafana dashboards, and Docker-compose infrastructure.

## What Problem Does This Solve?

Most teams don't performance test until something breaks in production. When they finally do, it's ad-hoc: someone runs JMeter on their laptop, eyeballs the numbers, and says "looks fine." This approach fails because:

- **No defined thresholds** — "looks fine" isn't a measurable criterion
- **No baseline** — you can't detect degradation without historical data
- **No automation** — manual runs mean performance regressions slip through
- **Wrong test type** — running a load test when you need a stress test
- **No visualization** — raw numbers don't communicate to stakeholders

This project solves these with:

| Problem | Solution |
|---------|----------|
| No thresholds | SLO-based thresholds in `config/thresholds.js` (p95 < 500ms, error rate < 1%) |
| No baseline | Grafana + InfluxDB store historical results for comparison |
| No automation | Scripts are code → run in CI, version in git |
| Wrong test type | 6 distinct test types, each with a clear purpose |
| No visualization | Native HTML reports + real-time Grafana dashboards |

## Why Should an SDET Learn This?

Performance testing is the **biggest gap** in most SDET resumes. Functional testing (API, UI) is table stakes — everyone has it. But performance testing shows you understand:

- **Non-functional requirements** — SLOs, SLAs, latency budgets
- **System behavior under load** — concurrency, resource contention, connection pools
- **Capacity planning** — "How many users can this handle before degrading?"
- **Production readiness** — the difference between "it works" and "it works at scale"

Senior SDET interviews often ask: "The API works in testing but is slow in production. How do you investigate?" Everything in this project equips you to answer that.

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| k6 | 1.6+ | `brew install k6` |
| Docker | 29+ | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |

### Run

```bash
# Quick validation (start here)
k6 run tests/smoke-test.js

# Load test with HTML report
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/report.html \
  k6 run tests/load-test.js

# Real-time Grafana dashboard
docker-compose up -d
k6 run --out influxdb=http://localhost:8086/k6 tests/load-test.js
# → Open http://localhost:3000 (admin/admin), import dashboard ID 2587
docker-compose down
```

---

## Project Structure

```
├── config/
│   ├── thresholds.js        ← SLO-based pass/fail criteria (p95, error rate, throughput)
│   └── environments.js      ← Per-environment base URLs and think times
├── scenarios/
│   ├── apis/
│   │   └── users-api.js     ← Reusable API call functions (listUsers, createUser, etc.)
│   └── e2e/
│       └── user-journey.js  ← Full user flow: browse → view → create → browse todos
├── tests/
│   ├── smoke-test.js        ← 1 VU, 1 min — "Is the system alive?"
│   ├── load-test.js         ← Ramp to 100 VUs — "Does it handle expected traffic?"
│   ├── stress-test.js       ← Ramp to 500 VUs — "Where does it break?"
│   ├── spike-test.js        ← Sudden jump to 500 VUs — "Can it handle flash traffic?"
│   ├── soak-test.js         ← 50 VUs for 30 min — "Does it leak memory?"
│   └── e2e-load-test.js     ← Full user journeys under load with per-step thresholds
├── lib/
│   └── helpers.js           ← Custom metrics (error count, success rate), utility functions
├── docker-compose.yml       ← k6 + InfluxDB + Grafana observability stack
└── package.json             ← npm scripts for convenient test execution
```

---

## The 6 Test Types Explained

Understanding WHEN to use each test type is more important than knowing how to write them.

### 1. Smoke Test (`smoke-test.js`)
- **Load:** 1 VU, 1 minute
- **Purpose:** "Is the system alive and responding?"
- **When:** After every deployment, as a CI gate
- **If it fails:** Don't run any other tests — there's a fundamental problem

### 2. Load Test (`load-test.js`)
- **Load:** Ramp to 100 VUs over 16 minutes
- **Purpose:** "Does the system handle normal daily traffic within SLOs?"
- **When:** Nightly, before releases
- **What to watch:** p95 latency staying below threshold during steady state

### 3. Stress Test (`stress-test.js`)
- **Load:** Ramp to 500 VUs
- **Purpose:** "Where is the breaking point?"
- **When:** Before capacity planning, after infrastructure changes
- **What to watch:** The VU count where p95 latency suddenly spikes (the inflection point)

### 4. Spike Test (`spike-test.js`)
- **Load:** Sudden jump from 10 → 500 VUs in 30 seconds
- **Purpose:** "Can auto-scaling handle a viral moment?"
- **When:** Before marketing campaigns, product launches
- **What to watch:** Recovery time after the spike subsides

### 5. Soak Test (`soak-test.js`)
- **Load:** 50 VUs for 30 minutes (extend to 2-4 hours for real usage)
- **Purpose:** "Does the system degrade over time? Memory leaks? Connection pool exhaustion?"
- **When:** Weekly, after major refactors
- **What to watch:** Response time TRENDING UPWARD over time (memory leak signal)

### 6. E2E Load Test (`e2e-load-test.js`)
- **Load:** 60 VUs executing full user journeys
- **Purpose:** "Does the complete user flow work under load?"
- **When:** Before releases
- **What to watch:** Per-step group durations (login fast but checkout slow?)

---

## Design Principles

### 1. Scenario / Test Separation

**What:** `scenarios/` defines WHAT to test (API calls). `tests/` defines HOW to test (VU count, ramp pattern, thresholds).

**Why:** The same `listUsers()` function is used in smoke, load, stress, and soak tests. Without separation, you'd copy-paste API calls into every test file.

### 2. Threshold-Driven Testing

**What:** Every test has explicit pass/fail thresholds tied to SLOs:
```javascript
http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
http_req_failed: ['rate<0.01'],    // Less than 1% error rate
```

**Why:** A test without thresholds is a benchmark, not a test. It generates numbers but never fails. Thresholds turn "informational" into "actionable." If p95 exceeds 500ms, the test exits with code 99 — CI fails — someone investigates.

### 3. Percentiles over Averages

**What:** Thresholds use p95/p99, not averages.

**Why:** An average of 200ms hides a p99 of 5000ms. That means 1% of your users wait 5 seconds. Percentiles expose tail latency that averages obscure.

### 4. Think Time

**What:** `sleep(config.thinkTime)` between requests simulates real user behavior.

**Why:** Real users don't fire requests as fast as possible. Without think time, you're testing "can the server handle 100 simultaneous hammers?" instead of "can it handle 100 users browsing?"

### 5. Custom Metrics

**What:** `lib/helpers.js` defines business-level metrics (success rate, error count, API response time).

**Why:** Built-in k6 metrics are technical (HTTP duration, connection time). Custom metrics answer business questions: "What percentage of user journeys succeeded?"

---

## How to Extend

### Add a new API scenario

1. Create `scenarios/apis/posts-api.js`:
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   import { getConfig } from '../../config/environments.js';
   const config = getConfig();

   export function listPosts() {
       const res = http.get(`${config.baseUrl}/posts`);
       check(res, { 'GET /posts returns 200': (r) => r.status === 200 });
       sleep(config.thinkTime);
   }
   ```

2. Import in any test file:
   ```javascript
   import { listPosts } from '../scenarios/apis/posts-api.js';
   ```

### Add a new test type

Create `tests/breakpoint-test.js` with k6's `ramping-arrival-rate` executor — it increases request rate regardless of response time, finding the exact RPS where the system breaks.

### Add a new environment

Edit `config/environments.js` → add a new entry. Run with: `k6 run -e ENV=qa tests/smoke-test.js`

### Add Grafana alerts

In Grafana, create an alert rule on the k6 dashboard: "Alert if p95 > 1000ms for 5 minutes." This turns your dashboard into a monitoring system.

---

## How to Read k6 Output

```
http_req_duration..: avg=157ms  min=98ms  med=128ms  max=223ms  p(90)=222ms  p(95)=223ms
```

| Metric | Meaning | What to Watch |
|--------|---------|---------------|
| **avg** | Mean latency across all requests | Misleading — skewed by outliers |
| **min** | Fastest request | Theoretical best case |
| **med** (p50) | Middle value | "Typical" user experience |
| **p(90)** | 90% of requests were faster | Good SLO target for internal tools |
| **p(95)** | 95% of requests were faster | Standard SLO target for customer-facing APIs |
| **p(99)** | 99% of requests were faster | Catches tail latency |
| **max** | Slowest request | Worst case — if 10x the p95, investigate |

**Key ratio:** If `p(95) / p(50)` > 3, you have a tail latency problem. Investigate caching, DB queries, or GC pauses.

---

## Learning Resources

### k6
- [k6 Official Documentation](https://grafana.com/docs/k6/latest/) — Complete reference
- [k6 Test Types Guide](https://grafana.com/docs/k6/latest/testing-guides/test-types/) — Smoke/load/stress/spike/soak explained
- [k6 Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) — SLO-based pass/fail
- [k6 Scenarios & Executors](https://grafana.com/docs/k6/latest/using-k6/scenarios/) — Advanced load profiles

### Performance Testing Concepts
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) — Why SLOs matter
- [Latency Tip of the Day](https://latencytipoftheday.blogspot.com/) — Understanding percentile distributions
- [Gil Tene: How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU) — Classic talk on why averages lie

### Grafana + InfluxDB
- [k6 + InfluxDB + Grafana Setup](https://grafana.com/docs/k6/latest/results-output/real-time/influxdb/) — Official integration guide
- [k6 Grafana Dashboard](https://grafana.com/grafana/dashboards/2587-k6-load-testing-results/) — Pre-built dashboard (ID: 2587)

### Interview Prep
- "The API is slow in production. How do you investigate?" → Run smoke test (is it alive?), then load test (is it load-related?), then stress test (what's the breaking point?), then check Grafana for the inflection point
- "How do you define performance requirements?" → SLOs: p95 latency, error rate, throughput floor. Derived from business requirements ("checkout must complete in 2 seconds")
- "What's the difference between load and stress testing?" → Load validates SLOs at expected traffic. Stress finds the breaking point beyond expected traffic.
