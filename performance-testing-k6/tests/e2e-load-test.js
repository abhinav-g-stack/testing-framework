import { userJourney } from '../scenarios/e2e/user-journey.js';
import { defaultThresholds } from '../config/thresholds.js';

/**
 * E2E Load Test — Runs complete user journeys under load.
 *
 * This combines the E2E scenario with load test configuration.
 * Each virtual user executes the full journey (login → browse → view → create).
 *
 * k6 Scenarios (advanced executor configuration):
 *
 * Instead of simple stages, we use "scenarios" — k6's most powerful feature.
 * Scenarios let you run MULTIPLE workload patterns simultaneously:
 *
 *   "browse_flow" → 80% of users just browse (read-heavy)
 *   "create_flow" → 20% of users also create new records (write-heavy)
 *
 * This is more realistic than everyone doing the same thing.
 * In real applications, most users READ; fewer WRITE.
 */
export const options = {
    scenarios: {
        // Main scenario: Full user journeys
        user_journeys: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 30 },
                { duration: '5m', target: 30 },
                { duration: '2m', target: 60 },
                { duration: '5m', target: 60 },
                { duration: '2m', target: 0 },
            ],
            tags: { scenario: 'user_journeys' },
        },
    },
    thresholds: {
        ...defaultThresholds,
        // Group-specific thresholds — measure each step independently
        'group_duration{group:::01_Login}': ['p(95)<1000'],
        'group_duration{group:::02_Browse_Users}': ['p(95)<1500'],
        'group_duration{group:::04_Create_User}': ['p(95)<2000'],
        // Custom metrics from helpers.js
        'custom_success_rate': ['rate>0.95'],    // 95%+ success rate
        'custom_errors': ['count<50'],            // Fewer than 50 total errors
    },
};

export default function () {
    userJourney();
}
