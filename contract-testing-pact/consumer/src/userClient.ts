import axios from 'axios';

/**
 * User API Client — the CONSUMER side of the contract.
 *
 * WHY CONTRACT TESTING matters for senior SDET:
 *
 * Problem: In microservice architecture, Service A calls Service B.
 * - Integration tests are slow, flaky, and require both services running
 * - Unit tests with mocks can drift from reality (the mock passes, prod fails)
 *
 * Solution: Contract testing
 * - Consumer (this client) defines what it EXPECTS from the provider
 * - Provider verifies it can fulfill those expectations
 * - Neither service needs the other running during tests
 * - If the provider makes a breaking change, the Pact verification catches it
 *
 * This is THE differentiator for senior SDET portfolios. Very few candidates
 * demonstrate consumer-driven contract testing.
 */

export interface User {
    id: number;
    name: string;
    email: string;
}

export class UserApiClient {
    constructor(private baseUrl: string) {}

    async getUser(id: number): Promise<User> {
        const response = await axios.get(`${this.baseUrl}/api/users/${id}`);
        return response.data;
    }

    async getUsers(): Promise<User[]> {
        const response = await axios.get(`${this.baseUrl}/api/users`);
        return response.data;
    }

    async createUser(name: string, email: string): Promise<User> {
        const response = await axios.post(`${this.baseUrl}/api/users`, { name, email });
        return response.data;
    }
}
