import { listUsers, getSingleUser, createUser } from '../scenarios/apis/users-api.js';
import { defaultThresholds } from '../config/thresholds.js';

/**
 * SOAK TEST — Extended duration at normal load to detect gradual degradation.
 *
 * Purpose: Find problems that only appear over TIME, not under LOAD:
 * - Memory leaks (response time slowly increases as memory fills up)
 * - Connection pool exhaustion (connections aren't being returned)
 * - Database connection leaks
 * - Log file disk space issues
 * - Token/session expiry handling
 *
 * Key difference from load test:
 * - Load test: 15 minutes, checks if system handles expected traffic
 * - Soak test: 1-4 hours, checks if system SUSTAINS that traffic
 *
 * WHAT TO WATCH FOR:
 * 1. Response time trending UPWARD over time (memory leak signal)
 * 2. Error rate starting at 0% then slowly climbing (resource exhaustion)
 * 3. Sudden cliff (connection pool or file descriptor limit hit)
 *
 * TIP: Run this with Grafana dashboard to visualize trends over time.
 *   docker-compose up -d
 *   k6 run --out influxdb=http://localhost:8086/k6 tests/soak-test.js
 *
 * For this portfolio, 30 minutes is sufficient to demonstrate.
 * In production, you'd run 2-4 hours minimum.
 */
export const options = {
    stages: [
        { duration: '2m', target: 50 },     // Ramp up
        { duration: '26m', target: 50 },     // Sustain normal load for 26 minutes
        { duration: '2m', target: 0 },       // Ramp down
    ],
    thresholds: {
        ...defaultThresholds,
        // Soak-specific: check that performance doesn't DEGRADE over time
        // If the system leaks, p99 will climb above this as the test progresses
        http_req_duration: ['p(95)<500', 'p(99)<2000'],
    },
    tags: { testType: 'soak' },
};

export default function () {
    listUsers();
    getSingleUser();
    createUser();
}
