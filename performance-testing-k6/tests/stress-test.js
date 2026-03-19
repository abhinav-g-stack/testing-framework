import { listUsers, getSingleUser, createUser } from '../scenarios/apis/users-api.js';
import { defaultThresholds } from '../config/thresholds.js';

/**
 * STRESS TEST — Push beyond normal capacity to find breaking points.
 *
 * Purpose: Discover the system's limits.
 * Key question: At what load does the system start degrading?
 *
 * Unlike load tests (which verify SLOs), stress tests intentionally
 * push past expected capacity. You EXPECT some thresholds to fail.
 *
 * What to look for:
 * - At which VU count does p95 latency exceed SLO?
 * - Does error rate spike suddenly (cliff) or gradually (degradation)?
 * - Does the system recover after load drops?
 *
 * TODO: After running this, analyze the report and note your findings.
 * The analysis matters more than the script — interviewers will ask
 * "what did you learn?" not "what did you run?"
 */
export const options = {
    stages: [
        { duration: '2m', target: 50 },    // Below normal load
        { duration: '5m', target: 50 },
        { duration: '2m', target: 200 },   // Normal load
        { duration: '5m', target: 200 },
        { duration: '2m', target: 500 },   // Beyond capacity
        { duration: '5m', target: 500 },
        { duration: '2m', target: 0 },     // Recovery
    ],
    thresholds: {
        ...defaultThresholds,
        // Relax thresholds for stress — we expect some degradation
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.05'],    // Allow up to 5% errors
    },
    tags: { testType: 'stress' },
};

export default function () {
    listUsers();
    getSingleUser();
    createUser();
}
