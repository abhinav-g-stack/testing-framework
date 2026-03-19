import { PactV4 } from '@pact-foundation/pact';
import path from 'path';
import { createServer } from '../src/userService';

/**
 * PROVIDER VERIFICATION TEST
 *
 * This is the other half of contract testing.
 *
 * Flow:
 * 1. Pact loads the consumer-generated pact file from /pacts
 * 2. For each interaction, it sets up the "provider state" (test data)
 * 3. Replays the consumer's expected request against our real service
 * 4. Compares our real response to the consumer's expectations
 *
 * Key concept: "Provider States"
 * - Consumer tests say things like: given('a user with ID 1 exists')
 * - The provider must handle these states by setting up appropriate test data
 * - This is the bridge between consumer expectations and provider reality
 *
 * In CI/CD:
 * - Consumer publishes pact to a Pact Broker after PR merge
 * - Provider runs verification on every build
 * - Pact Broker tracks which versions are compatible (the "can-i-deploy" check)
 */

describe('User Service Provider Verification', () => {
    const server = createServer(0);  // Port 0 = OS assigns random port
    let serverUrl: string;

    beforeAll((done) => {
        server.listen(0, () => {
            const address = server.address();
            if (address && typeof address !== 'string') {
                serverUrl = `http://localhost:${address.port}`;
            }
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    it('validates the expectations of UserWebApp', async () => {
        const verifier = new (await import('@pact-foundation/pact')).Verifier({
            providerBaseUrl: serverUrl,
            pactUrls: [
                path.resolve(process.cwd(), 'pacts', 'UserWebApp-UserService.json'),
            ],
            stateHandlers: {
                'a user with ID 1 exists': async () => {
                    // User with ID 1 already exists in our in-memory store
                    // In a real service, you'd seed the database here
                },
                'no user with ID 999 exists': async () => {
                    // No setup needed — ID 999 doesn't exist in our store
                },
                'users exist': async () => {
                    // Users already exist in our in-memory store
                },
            },
        });

        await verifier.verifyProvider();
    });
});
