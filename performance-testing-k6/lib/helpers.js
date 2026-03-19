import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Shared helper utilities for k6 test scripts.
 *
 * WHY a helpers file:
 * - Custom metrics let you track business-specific KPIs beyond HTTP latency
 * - Reusable check functions prevent inconsistent assertions across tests
 * - Centralized error counting gives you a single source of truth
 *
 * HOW k6 METRICS WORK:
 * k6 has built-in metrics (http_req_duration, http_reqs, etc.) but you can
 * create CUSTOM metrics to track things that matter to your business:
 *
 *   Counter → Tracks count of something (total errors, total created users)
 *   Rate    → Tracks a percentage (success rate, cache hit rate)
 *   Trend   → Tracks a value over time (business transaction duration)
 *   Gauge   → Tracks a current value (active sessions, queue depth)
 */

// Custom metrics — these appear in k6 output and Grafana dashboards
export const errorCount = new Counter('custom_errors');
export const successRate = new Rate('custom_success_rate');
export const apiResponseTime = new Trend('custom_api_response_time');

/**
 * Standard response check with custom metric tracking.
 * Wraps k6's check() to also update our custom metrics.
 *
 * @param {object} res - k6 HTTP response object
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} name - Human-readable name for the check
 * @returns {boolean} Whether all checks passed
 */
export function checkResponse(res, expectedStatus, name) {
    const passed = check(res, {
        [`${name} — status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
        [`${name} — response time < 2000ms`]: (r) => r.timings.duration < 2000,
    });

    // Track in custom metrics
    apiResponseTime.add(res.timings.duration);
    if (passed) {
        successRate.add(1);
    } else {
        successRate.add(0);
        errorCount.add(1);
    }

    return passed;
}

/**
 * Generate a unique string for test data (prevents collisions under load).
 * k6's __VU and __ITER are the virtual user ID and iteration count.
 */
export function uniqueId() {
    return `${__VU}-${__ITER}-${Date.now()}`;
}

/**
 * Random item from an array — useful for randomizing test data.
 */
export function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
