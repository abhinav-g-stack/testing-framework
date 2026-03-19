/**
 * Centralized threshold configuration tied to SLOs (Service Level Objectives).
 *
 * WHY thresholds matter for senior SDET:
 * - Thresholds turn performance tests from "informational" to "pass/fail gates"
 * - They should be derived from real SLOs, not arbitrary numbers
 * - p95/p99 percentiles are far more valuable than averages
 *   (mean latency of 200ms hides a p99 of 5000ms — that's 1% of users waiting 5 seconds)
 *
 * Interview talking point: "I define thresholds based on team SLOs,
 * not arbitrary values. A test that can't fail is just a benchmark, not a test."
 */

export const defaultThresholds = {
    // Response time SLOs
    http_req_duration: [
        'p(95)<500',     // 95% of requests must complete under 500ms
        'p(99)<1500',    // 99% must complete under 1.5s
        'avg<300',       // Average should stay under 300ms
    ],

    // Error rate SLO
    http_req_failed: [
        'rate<0.01',     // Less than 1% error rate
    ],

    // Throughput floor
    http_reqs: [
        'rate>50',       // At least 50 requests/second sustained
    ],

    // Connection time (network-level)
    http_req_connecting: [
        'p(95)<100',     // Connection establishment under 100ms
    ],
};

export const strictThresholds = {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.001'],    // 0.1% error rate
    http_reqs: ['rate>100'],
};
