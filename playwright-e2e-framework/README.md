# Playwright E2E Automation Framework

A **Playwright + TypeScript** E2E testing framework using Page Object Model, custom fixtures for authentication, visual regression testing, Docker containerization, and GitHub Actions CI.

## What Problem Does This Solve?

E2E tests are the most fragile layer of the testing pyramid. They break constantly because:

- **Brittle selectors** — CSS classes change, XPath breaks on DOM restructure
- **Slow execution** — every test logs in from scratch
- **Flaky in CI** — different browser versions, timing issues, resource constraints
- **Hard to debug** — "it failed in CI" with no artifacts to investigate
- **Not maintainable** — selectors duplicated across test files, one page change breaks 20 tests

This framework solves each problem:

| Problem | Solution |
|---------|----------|
| Brittle selectors | `getByTestId()`, `getByRole()` — resilient to CSS changes |
| Slow execution | Auth fixtures reuse login state, parallel execution |
| Flaky in CI | Trace capture on retry, screenshot on failure, video retention |
| Hard to debug | Trace Viewer provides DOM snapshots + network + timeline |
| Not maintainable | Page Object Model — one page change, one file to update |

## Why Should an SDET Learn Playwright?

Playwright is replacing Selenium as the industry standard for E2E testing. Here's why it matters for your career:

- **Job demand:** Playwright roles pay 5-15% more than Selenium equivalents (2025 market data)
- **TypeScript:** Companies expect Playwright in TypeScript — it's the primary supported language
- **Modern architecture:** Auto-waits, network interception, multi-browser from one API
- **What interviewers look for:** POM pattern, fixture design, CI pipeline, Docker containerization

Selenium tests existing code. Playwright tests modern applications.

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `brew install node` |
| Docker | 29+ | [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for containerized runs) |

### Install and Run

```bash
npm install
npx playwright install --with-deps    # Downloads Chromium, Firefox, WebKit

npx playwright test                    # Run all tests headless
npx playwright test --headed           # Watch in browser
npx playwright test --ui               # Interactive test runner (best for learning)
npx playwright test --debug            # Step-through debugger
npx playwright show-report             # View HTML report
```

---

## Project Structure

```
├── pages/                          ← Page Object Model classes
│   ├── BasePage.ts                 ← Shared navigation, waits, screenshot utilities
│   ├── LoginPage.ts                ← Login interactions, returns InventoryPage on success
│   ├── InventoryPage.ts            ← Product listing, cart operations, sorting
│   ├── CartPage.ts                 ← Cart review, item removal, checkout navigation
│   └── CheckoutPage.ts             ← 3-step checkout: info → overview → confirmation
├── tests/
│   ├── login.spec.ts               ← Login happy path + validation errors
│   ├── inventory.spec.ts           ← Product listing, sorting, cart operations
│   ├── checkout.spec.ts            ← Full E2E purchase flow + form validation
│   └── visual.spec.ts              ← Visual regression (screenshot comparison)
├── fixtures/
│   └── auth.fixture.ts             ← Custom fixture: pre-authenticated page/inventoryPage
├── utils/
│   └── test-data.ts                ← Centralized test users, products, checkout info
├── docker/
│   └── Dockerfile                  ← Containerized execution (mcr.microsoft.com/playwright)
├── playwright.config.ts            ← Multi-browser, trace/screenshot/video config
├── tsconfig.json                   ← TypeScript configuration
└── .github/workflows/
    └── e2e-tests.yml               ← GitHub Actions CI pipeline
```

---

## Design Principles

### 1. Page Object Model (POM)

**What:** Each page/component gets its own class. Locators are defined once. Methods represent user actions.

**Why:** When SauceDemo changes a button's `data-test` attribute, you update ONE line in ONE file — not 15 test files.

**Rules:**
- Locators are private properties (encapsulation)
- Methods return `this` or another page object (fluent chaining)
- **NO assertions in page objects** — assertions belong in test files
- Page objects describe WHAT users can do, not WHAT should happen

```typescript
// GOOD — page object provides actions
class LoginPage {
    async loginAs(user, pass): Promise<InventoryPage> { ... }
}

// Test file owns assertions
test('login redirects to inventory', async () => {
    const inventoryPage = await loginPage.loginAs('user', 'pass');
    await expect(page).toHaveURL(/inventory/);
});

// BAD — assertions in page object
class LoginPage {
    async loginAndVerify(user, pass) {
        // Don't do this — mixes concerns
        expect(await this.page.url()).toContain('inventory');
    }
}
```

### 2. Custom Fixtures (Dependency Injection)

**What:** `auth.fixture.ts` creates a pre-authenticated `inventoryPage` that tests receive as a parameter.

**Why:** Without fixtures, every test repeats: navigate → fill username → fill password → click login. That's 2+ seconds of waste per test. With 50 tests = 100 seconds just logging in.

**How tests use it:**
```typescript
// Import from fixture (NOT from @playwright/test)
import { test, expect } from '../fixtures/auth.fixture';

test('add to cart', async ({ inventoryPage }) => {
    // Already logged in! No login steps needed.
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
});
```

### 3. Locator Strategy Priority

Playwright recommends this order (most resilient → least):

1. **`getByRole()`** — Accessibility-driven. If the role breaks, the app has a real accessibility bug.
2. **`getByTestId()`** — `data-test` attributes survive CSS refactors. Recommend to devs.
3. **`getByText()`** — Good for unique visible text.
4. **CSS selectors** — Fragile but sometimes necessary.
5. **XPath** — Last resort. Avoid in new code.

### 4. Trace on First Retry

```typescript
// playwright.config.ts
use: {
    trace: 'on-first-retry',        // Only captures trace when test fails and retries
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
}
```

**Why not `trace: 'on'`?** Traces capture DOM snapshots, network requests, and action logs. For passing tests, this is pure waste — slows execution and fills disk. `on-first-retry` gives you full debugging data exactly when you need it.

### 5. Visual Regression Testing

**What:** `visual.spec.ts` compares screenshots pixel-by-pixel against committed baselines.

**Why:** CSS changes can break layouts without any functional test failing. A button moved 50px left? All functional tests pass. Visual tests catch it.

**Workflow:**
```bash
npx playwright test visual.spec.ts --update-snapshots  # Create baselines (first time)
npx playwright test visual.spec.ts                     # Compare against baselines
# On intentional CSS change: re-run with --update-snapshots and commit new baselines
```

---

## How to Extend

### Add a new page

1. Create `pages/ProductDetailPage.ts` extending `BasePage`
2. Define locators as private properties
3. Add user action methods (no assertions)
4. Import in test files

### Add authentication reuse via storageState (advanced)

Instead of logging in per-test via the fixture, save browser state once and reuse:

```typescript
// global-setup.ts — runs once before all tests
async function globalSetup() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.saucedemo.com');
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    await page.context().storageState({ path: '.auth/user.json' });
    await browser.close();
}

// playwright.config.ts
use: { storageState: '.auth/user.json' }
```

Now ALL tests start already authenticated — zero login overhead.

### Add API testing with Playwright

Playwright isn't just for UI. It has a built-in API testing client:

```typescript
test('API: create user', async ({ request }) => {
    const response = await request.post('/api/users', {
        data: { name: 'Test', email: 'test@test.com' }
    });
    expect(response.ok()).toBeTruthy();
});
```

### Add mobile viewport tests

Already configured in `playwright.config.ts` — `mobile-chrome` and `mobile-safari` projects. Run with:
```bash
npx playwright test --project=mobile-chrome
```

---

## Learning Resources

### Playwright
- [Playwright Official Docs](https://playwright.dev/docs/intro) — Getting started and API reference
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — Official recommendations
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer-intro) — Debugging tool walkthrough
- [Playwright Locators Guide](https://playwright.dev/docs/locators) — Selector strategies

### Page Object Model
- [Martin Fowler: PageObject](https://martinfowler.com/bliki/PageObject.html) — The original pattern description
- [Playwright POM Guide](https://playwright.dev/docs/pom) — Playwright-specific POM examples

### TypeScript for Testers
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — Language reference
- [TypeScript in 5 Minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) — Quick start

### Docker for Testing
- [Playwright Docker Guide](https://playwright.dev/docs/docker) — Official container images
- [Docker for Test Automation](https://testautomationu.applitools.com/scaling-tests-with-docker/) — TAU course

### Interview Prep
- "Why Playwright over Selenium?" → Auto-waits (no explicit waits), multi-browser from one API, trace viewer for debugging, built-in API testing, faster execution
- "How do you handle authentication in E2E tests?" → Explain fixtures → storageState progression
- "How do you debug a flaky test?" → Trace viewer: DOM snapshots, network timeline, action log
- "How do you make E2E tests maintainable?" → POM pattern, centralized test data, resilient locators
