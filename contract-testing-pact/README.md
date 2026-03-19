# Consumer-Driven Contract Testing with Pact

Demonstrates **Pact** contract testing between a consumer (UserWebApp) and a provider (UserService) — the most underappreciated testing technique in microservice architectures.

## What Problem Does This Solve?

In a microservice architecture, Service A calls Service B. Testing this integration is hard:

| Approach | Problem |
|----------|---------|
| **E2E integration tests** | Slow, flaky, require all services running simultaneously |
| **Unit tests with mocks** | Mocks drift from reality. The mock passes, production breaks. |
| **Manual testing** | Doesn't scale. Can't catch every field rename or type change. |

**The mock drift problem** is the worst:

```
Consumer test (with mock):   GET /users/1 → { "name": "Alice", "email": "a@b.com" }  ✓ PASSES
Provider (reality):          GET /users/1 → { "fullName": "Alice", "mail": "a@b.com" }
Production:                  CRASH — consumer expects "name", gets "fullName"
```

The mock was wrong. The test passed. Production broke. This is what contract testing fixes.

**Pact's approach:**

```
Step 1: Consumer defines expectations → Pact generates a contract (JSON file)
Step 2: Provider verifies it can satisfy the contract → against its real code
Result: Both sides are guaranteed compatible. No shared environment needed.
```

## Why Should an SDET Learn This?

Contract testing is the **#1 differentiator** for senior SDET portfolios. The research is clear:

- Very few SDET candidates demonstrate consumer-driven contract testing
- It shows **microservice maturity** — you understand distributed systems testing
- It's the only technique that solves the "mock drift" problem
- Companies like Atlassian, GitHub, and Spotify use Pact in production

The interview soundbite: "I implement consumer-driven contract testing with Pact to ensure service compatibility without requiring shared test environments. The consumer defines what it needs, the provider verifies it can deliver."

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `brew install node` |

### Install and Run

```bash
npm install

# Step 1: Consumer tests (generates the pact contract)
npm run test:consumer
# → Creates pacts/UserWebApp-UserService.json

# Step 2: Provider verification (verifies the contract)
npm run test:provider

# Both steps
npm run test:all
```

---

## Project Structure

```
├── consumer/
│   ├── src/
│   │   └── userClient.ts           ← HTTP client that calls the User API
│   └── tests/
│       └── userClient.pact.spec.ts  ← Consumer contract tests (defines expectations)
├── provider/
│   ├── src/
│   │   └── userService.ts          ← Simple HTTP server (the User API)
│   └── tests/
│       └── userService.pact.spec.ts ← Provider verification (validates against contract)
├── pacts/                           ← Generated contract files (JSON)
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## How Contract Testing Works (Step by Step)

### Phase 1: Consumer Side

1. Consumer test defines **interactions** — expected request/response pairs
2. Pact starts a **mock server** that responds according to these interactions
3. Consumer's real client code runs against this mock server
4. If the client makes any request that wasn't defined → **test fails**
5. Pact writes a **pact file** (JSON contract) to `pacts/` directory

```typescript
// "When I GET /api/users/1, I expect a 200 with {id, name, email}"
provider.addInteraction()
    .given('a user with ID 1 exists')        // Provider state (precondition)
    .uponReceiving('a request for user 1')    // Description
    .withRequest('GET', '/api/users/1')
    .willRespondWith(200, builder => {
        builder.jsonBody(like({               // Matchers, not exact values
            id: integer(1),
            name: string('Alice'),
            email: email('alice@example.com'),
        }));
    })
```

### Phase 2: Provider Side

1. Provider verification loads the pact file
2. For each interaction, it sets up **provider state** (test data)
3. Replays the consumer's expected request against the **real provider service**
4. Compares the real response to the consumer's expectations
5. If any response doesn't match → **verification fails**

```typescript
const verifier = new Verifier({
    providerBaseUrl: serverUrl,
    pactUrls: ['pacts/UserWebApp-UserService.json'],
    stateHandlers: {
        'a user with ID 1 exists': async () => {
            // Seed test data so user 1 exists
        },
    },
});
```

### The Key Insight: Consumer-Driven

The **consumer** defines what it needs, not the provider. This means:
- Provider never builds features nobody uses
- Provider never breaks features consumers depend on
- Consumer never makes assumptions about undocumented behavior

---

## Design Principles

### 1. Pact Matchers (not exact values)

**What:** `like(1)` means "any integer", not "exactly 1". `string('Alice')` means "any string", not "exactly Alice".

**Why:** Exact value matching is too brittle. If the provider returns `{id: 2}` instead of `{id: 1}`, the contract shouldn't break — the consumer only cares that `id` is an integer. Matchers validate **structure and types**, not specific data.

### 2. Provider States

**What:** `given('a user with ID 1 exists')` tells the provider what test data to set up.

**Why:** The provider might have an empty database. Provider states are the bridge between consumer expectations ("user 1 exists") and provider reality ("let me seed user 1 into my test DB").

### 3. Consumer / Provider Separation

**What:** Consumer and provider are in separate directories (in reality, separate repos).

**Why:** The whole point of contract testing is that neither side needs the other running. Consumer tests run independently. Provider verification runs independently. They communicate through the pact file.

### 4. The Pact Broker (Production Pattern)

**What:** In production, pact files are published to a Pact Broker (not committed to git). The broker tracks versions and tells you if a provider/consumer pair is compatible.

**Why:** Git-committed pacts don't scale with many services. The broker provides:
- `can-i-deploy` check: "Is my version compatible with production?"
- Version matrix: which consumer versions work with which provider versions
- Webhook triggers: auto-verify when either side publishes

---

## How to Extend

### Add a new interaction

1. Add the method to `consumer/src/userClient.ts`
2. Add the interaction in `consumer/tests/userClient.pact.spec.ts`
3. Add the state handler in `provider/tests/userService.pact.spec.ts`
4. Implement the endpoint in `provider/src/userService.ts`
5. Run `npm run test:all`

### Break the contract intentionally (educational exercise)

1. Edit `provider/src/userService.ts` → rename `email` to `mail`
2. Run `npm run test:provider` → watch it **fail**
3. This is exactly what contract testing catches in real microservices
4. Revert the change

### Add a Pact Broker

```bash
# Run Pact Broker locally via Docker
docker run -d -p 9292:9292 pactfoundation/pact-broker
# Publish pacts
npx pact-broker publish pacts \
    --consumer-app-version=$(git rev-parse --short HEAD) \
    --broker-base-url=http://localhost:9292
```

### Add message contracts

Pact v4 supports message-based contracts (Kafka, RabbitMQ, SNS). Add a message interaction:
```typescript
provider.addInteraction()
    .uponReceiving('a user created event')
    .withPluginContents('application/json', JSON.stringify({ userId: 1, action: 'created' }))
```

---

## Learning Resources

### Pact
- [Pact Documentation](https://docs.pact.io/) — Complete reference
- [Pact JS Guide](https://docs.pact.io/implementation_guides/javascript) — JavaScript/TypeScript guide
- [Pact V4 Features](https://docs.pact.io/blog/2024/04/15/pact-open-source-update-apr-2024) — Latest capabilities
- [Pact Best Practices](https://docs.pact.io/getting_started/sharing_pacts) — Broker, CI integration, versioning

### Contract Testing Concepts
- [Martin Fowler: Contract Testing](https://martinfowler.com/bliki/ContractTest.html) — Foundational concept
- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html) — The original article
- [Pact vs Spring Cloud Contract](https://docs.pact.io/faq/comparisons) — Comparison of approaches

### Interview Prep
- "How do you test microservice integrations?" → Consumer-driven contract testing. Consumer defines expectations, provider verifies. Neither needs the other running.
- "What's the difference between integration tests and contract tests?" → Integration tests verify behavior end-to-end (slow, flaky). Contract tests verify compatibility (fast, isolated).
- "What is the mock drift problem?" → Mocks in unit tests diverge from real APIs over time. Contract tests guarantee they stay in sync.
