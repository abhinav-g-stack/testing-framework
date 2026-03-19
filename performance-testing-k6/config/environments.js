/**
 * Environment-specific configuration.
 * Usage: k6 run -e ENV=staging tests/load-test.js
 */

const environments = {
    dev: {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        thinkTime: 1,    // seconds between requests (simulates real user)
    },
    staging: {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        thinkTime: 1,
    },
    prod: {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        thinkTime: 2,    // Be gentler with production
    },
};

export function getConfig() {
    const env = __ENV.ENV || 'dev';
    const config = environments[env];
    if (!config) {
        throw new Error(`Unknown environment: ${env}. Available: ${Object.keys(environments).join(', ')}`);
    }
    return config;
}
