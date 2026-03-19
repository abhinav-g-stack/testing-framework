import http from 'k6/http';
import { check, sleep } from 'k6';
import { getConfig } from '../../config/environments.js';

const config = getConfig();

/**
 * Reusable API scenarios for JSONPlaceholder /users endpoint.
 *
 * Scenarios define WHAT to test (the API calls).
 * Test files define HOW to test (VU count, ramp-up, thresholds).
 */

export function listUsers() {
    const res = http.get(`${config.baseUrl}/users`);

    check(res, {
        'GET /users returns 200': (r) => r.status === 200,
        'GET /users response time < 500ms': (r) => r.timings.duration < 500,
        'GET /users returns array': (r) => JSON.parse(r.body).length > 0,
    });

    sleep(config.thinkTime);
}

export function getSingleUser(userId = 1) {
    const res = http.get(`${config.baseUrl}/users/${userId}`);

    check(res, {
        'GET /users/{id} returns 200': (r) => r.status === 200,
        'GET /users/{id} has correct id': (r) => JSON.parse(r.body).id === userId,
    });

    sleep(config.thinkTime);
}

export function createUser() {
    const payload = JSON.stringify({
        name: `LoadTestUser_${Date.now()}`,
        email: `loadtest_${Date.now()}@example.com`,
    });

    const params = {
        headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${config.baseUrl}/users`, payload, params);

    check(res, {
        'POST /users returns 201': (r) => r.status === 201,
        'POST /users has id': (r) => JSON.parse(r.body).id !== undefined,
    });

    sleep(config.thinkTime);
}
