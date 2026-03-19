import { listUsers, getSingleUser, createUser } from '../scenarios/apis/users-api.js';
import { defaultThresholds } from '../config/thresholds.js';

/**
 * SMOKE TEST — Minimal load, verifies the system is alive.
 *
 * Purpose: Run this FIRST before any heavy load tests.
 * If smoke fails, don't bother with load/stress — the system has a fundamental issue.
 *
 * Load profile: 1 virtual user, 1 minute
 * Use case: Post-deployment sanity check, CI pipeline gate
 */
export const options = {
    vus: 1,
    duration: '1m',
    thresholds: {
        // Smoke test only cares: "did requests succeed and respond fast?"
        // Throughput threshold (http_reqs rate>50) is irrelevant for 1 VU.
        http_req_duration: ['p(95)<500', 'p(99)<1500'],
        http_req_failed: ['rate<0.01'],
    },
    tags: { testType: 'smoke' },
};

export default function () {
    listUsers();
    getSingleUser();
    createUser();
}
