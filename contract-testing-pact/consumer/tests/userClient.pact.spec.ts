import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { UserApiClient, User } from '../src/userClient';

const { like, eachLike, integer, string, regex } = MatchersV3;

// Pact doesn't have a built-in email() matcher — use regex instead
const email = (example: string) => regex(/^[\w.+-]+@[\w-]+\.[\w.]+$/, example);

/**
 * CONSUMER PACT TEST — defines what this service EXPECTS from the User API.
 *
 * How it works:
 * 1. We define "interactions" — expected request/response pairs
 * 2. Pact spins up a mock server that responds according to these interactions
 * 3. Our client code runs against this mock server
 * 4. If our client makes unexpected requests, the test FAILS
 * 5. Pact generates a "pact file" (JSON contract) in the /pacts directory
 * 6. The PROVIDER then verifies it can honor this contract
 *
 * Key concept: We use Pact MATCHERS, not exact values.
 * - like(1) means "any integer" — not specifically 1
 * - string("alice") means "any string" — not specifically "alice"
 * This makes contracts flexible but still type-safe.
 */

const provider = new PactV4({
    consumer: 'UserWebApp',
    provider: 'UserService',
    dir: path.resolve(process.cwd(), 'pacts'),
});

describe('User API Consumer Contract Tests', () => {

    describe('GET /api/users/:id', () => {
        it('returns a user when one exists', async () => {
            await provider
                .addInteraction()
                .given('a user with ID 1 exists')           // Provider state
                .uponReceiving('a request for user 1')      // Description
                .withRequest('GET', '/api/users/1')
                .willRespondWith(200, (_builder) => {
                    _builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody(
                            like({
                                id: integer(1),
                                name: string('Alice'),
                                email: email('alice@example.com'),
                            })
                        );
                })
                .executeTest(async (mockServer) => {
                    const client = new UserApiClient(mockServer.url);
                    const user = await client.getUser(1);

                    expect(user.id).toBe(1);
                    expect(user.name).toBeDefined();
                    expect(user.email).toBeDefined();
                });
        });

        it('returns 404 when user does not exist', async () => {
            await provider
                .addInteraction()
                .given('no user with ID 999 exists')
                .uponReceiving('a request for non-existent user')
                .withRequest('GET', '/api/users/999')
                .willRespondWith(404)
                .executeTest(async (mockServer) => {
                    const client = new UserApiClient(mockServer.url);
                    await expect(client.getUser(999)).rejects.toThrow();
                });
        });
    });

    describe('GET /api/users', () => {
        it('returns a list of users', async () => {
            await provider
                .addInteraction()
                .given('users exist')
                .uponReceiving('a request for all users')
                .withRequest('GET', '/api/users')
                .willRespondWith(200, (_builder) => {
                    _builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody(
                            eachLike({
                                id: integer(1),
                                name: string('Alice'),
                                email: email('alice@example.com'),
                            })
                        );
                })
                .executeTest(async (mockServer) => {
                    const client = new UserApiClient(mockServer.url);
                    const users = await client.getUsers();

                    expect(users.length).toBeGreaterThan(0);
                    expect(users[0].id).toBeDefined();
                });
        });
    });

    describe('POST /api/users', () => {
        it('creates a new user', async () => {
            await provider
                .addInteraction()
                .uponReceiving('a request to create a user')
                .withRequest('POST', '/api/users', (_builder) => {
                    _builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody({
                            name: string('Bob'),
                            email: email('bob@example.com'),
                        });
                })
                .willRespondWith(201, (_builder) => {
                    _builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody(
                            like({
                                id: integer(1),
                                name: string('Bob'),
                                email: email('bob@example.com'),
                            })
                        );
                })
                .executeTest(async (mockServer) => {
                    const client = new UserApiClient(mockServer.url);
                    const user = await client.createUser('Bob', 'bob@example.com');

                    expect(user.id).toBeDefined();
                    expect(user.name).toBe('Bob');
                });
        });
    });
});
