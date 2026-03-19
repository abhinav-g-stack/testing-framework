import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Custom Playwright Fixture for authenticated sessions.
 *
 * WHAT FIXTURES ARE:
 * Fixtures are Playwright's dependency injection system. They set up
 * preconditions that tests need, and automatically clean up afterward.
 *
 * WHY THIS EXISTS:
 * Without this fixture, EVERY test that needs a logged-in user does:
 *   1. Navigate to login page
 *   2. Fill username
 *   3. Fill password
 *   4. Click login
 *   5. Wait for redirect
 *
 * That's ~2 seconds wasted PER TEST. With 100 tests = 200 seconds of just logging in.
 *
 * HOW IT WORKS:
 * 1. This fixture creates a custom "test" object with extra properties
 * 2. "authenticatedPage" → a page that's already logged in
 * 3. "inventoryPage" → an InventoryPage object that's ready to use
 * 4. Tests import { test } from this file instead of '@playwright/test'
 *
 * USAGE IN TESTS:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *
 *   test('add to cart', async ({ inventoryPage }) => {
 *       // Already logged in! No login step needed.
 *       await inventoryPage.addProductToCart('Sauce Labs Backpack');
 *   });
 *
 * ADVANCED OPTION (storageState):
 * For even better performance, you can save the browser state (cookies, localStorage)
 * to a file ONCE, then reuse it for all tests:
 *
 *   // In global setup:
 *   await page.context().storageState({ path: '.auth/user.json' });
 *
 *   // In playwright.config.ts:
 *   use: { storageState: '.auth/user.json' }
 *
 * This skips login entirely — the browser starts already authenticated.
 * We'll implement this approach in the global-setup.ts file below.
 */

// Define the custom fixture types
type AuthFixtures = {
    authenticatedPage: Page;
    inventoryPage: InventoryPage;
};

// Extend Playwright's base test with our custom fixtures
export const test = base.extend<AuthFixtures>({
    // Fixture: a page that's already logged in
    authenticatedPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginAs('standard_user', 'secret_sauce');
        // Hand the authenticated page to the test
        await use(page);
    },

    // Fixture: an InventoryPage that's ready to use (logged in + on inventory page)
    inventoryPage: async ({ authenticatedPage }, use) => {
        const inventoryPage = new InventoryPage(authenticatedPage);
        await use(inventoryPage);
    },
});

// Re-export expect so tests don't need to import from two places
export { expect } from '@playwright/test';
