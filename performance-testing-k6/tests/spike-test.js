import { listUsers, getSingleUser } from '../scenarios/apis/users-api.js';
import { defaultThresholds } from '../config/thresholds.js';

/**
 * SPIKE TEST — Sudden dramatic increase in load.
 *
 * Purpose: How does the system handle flash traffic?
 * Real-world examples: Product launch, viral social media post, Black Friday.
 *
 * Key difference from stress test:
 * - Stress = gradual increase to find limits
 * - Spike = sudden jump to test auto-scaling and circuit breakers
 *
 * What to observe:
 * - Does auto-scaling kick in fast enough?
 * - Do circuit breakers activate? (Good — means the system protects itself)
 * - How long until recovery after the spike subsides?
 */
export const options = {
    stages: [
        { duration: '1m', target: 10 },    // Warm up
        { duration: '30s', target: 500 },   // SPIKE — sudden jump
        { duration: '3m', target: 500 },    // Hold spike
        { duration: '30s', target: 10 },    // Drop back down
        { duration: '3m', target: 10 },     // Recovery observation
        { duration: '30s', target: 0 },     // Cooldown
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'],  // Generous during spike
        http_req_failed: ['rate<0.10'],      // Up to 10% acceptable in spike
    },
    tags: { testType: 'spike' },
};

export default function () {
    listUsers();
    getSingleUser();
}
