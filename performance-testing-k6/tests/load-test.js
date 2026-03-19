import { listUsers, getSingleUser, createUser } from '../scenarios/apis/users-api.js';
import { defaultThresholds } from '../config/thresholds.js';

/**
 * LOAD TEST — Normal expected traffic pattern.
 *
 * Purpose: Verify the system handles expected daily traffic within SLOs.
 *
 * Ramp-up pattern explained:
 *   1. Ramp up gradually (don't spike — gives the system time to warm up)
 *   2. Hold at target load (this is where you measure steady-state performance)
 *   3. Ramp down (verifies graceful connection cleanup)
 *
 * Why ramping-vus over constant-vus:
 *   Constant load doesn't reveal how the system behaves during scaling events.
 *   Ramping shows you the inflection point where latency starts degrading.
 */
export const options = {
    stages: [
        { duration: '2m', target: 50 },    // Ramp up to 50 VUs over 2 minutes
        { duration: '5m', target: 50 },    // Hold at 50 VUs for 5 minutes (steady state)
        { duration: '2m', target: 100 },   // Ramp up to 100 VUs
        { duration: '5m', target: 100 },   // Hold at 100 VUs
        { duration: '2m', target: 0 },     // Ramp down to 0
    ],
    thresholds: defaultThresholds,
    tags: { testType: 'load' },
};

export default function () {
    // Simulate a realistic user flow: browse → view → create
    listUsers();
    getSingleUser();
    createUser();
}
