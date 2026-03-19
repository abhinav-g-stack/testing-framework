import { Page, Locator } from '@playwright/test';

/**
 * BasePage — Foundation class for all page objects.
 *
 * WHY a BasePage matters:
 * - Shared navigation, waiting, and interaction methods live here
 * - Subclasses inherit these — no duplication across page objects
 * - If Playwright changes an API, you fix it in ONE place
 *
 * Design principle: Page objects encapsulate page INTERACTIONS, not ASSERTIONS.
 * Keep assertions in test files. This separation means page objects are reusable
 * across different test scenarios.
 *
 * Anti-pattern to avoid: Don't put expect() calls in page objects.
 * Test: "Login with valid credentials should redirect to inventory"
 * Page object: provides login() method, returns InventoryPage
 * Test file: asserts that we're on the inventory page
 */
export class BasePage {
    constructor(protected page: Page) {}

    async navigate(path: string = '/') {
        await this.page.goto(path);
    }

    async getTitle(): Promise<string> {
        return this.page.title();
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    async takeScreenshot(name: string) {
        await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
    }

    /**
     * Fluent wait utility — waits for an element to be visible with a custom timeout.
     * More readable than raw Playwright waits in tests.
     */
    async waitForElement(locator: Locator, timeout: number = 5000) {
        await locator.waitFor({ state: 'visible', timeout });
    }
}
