import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { InventoryPage } from './InventoryPage';

/**
 * LoginPage — Page object for SauceDemo login page.
 *
 * POM Pattern in action:
 * - Locators are defined ONCE as properties (single source of truth)
 * - Methods represent user ACTIONS, not DOM interactions
 * - loginAs() returns InventoryPage — this is method chaining / page transition pattern
 *
 * Why getByTestId/getByRole over CSS selectors:
 * - data-test attributes survive CSS refactors
 * - getByRole is accessibility-driven — if the role breaks, the app has a real bug
 * - Playwright docs explicitly recommend this order: role > testid > css > xpath
 */
export class LoginPage extends BasePage {
    // Locators — defined once, used in multiple methods
    private usernameInput = this.page.getByTestId('username');      // data-test="username"
    private passwordInput = this.page.getByTestId('password');      // data-test="password"
    private loginButton = this.page.getByTestId('login-button');
    private errorMessage = this.page.getByTestId('error');

    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await this.navigate('/');
        return this;
    }

    async loginAs(username: string, password: string): Promise<InventoryPage> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        return new InventoryPage(this.page);
    }

    async getErrorMessage(): Promise<string> {
        return await this.errorMessage.textContent() ?? '';
    }

    async isErrorVisible(): Promise<boolean> {
        return await this.errorMessage.isVisible();
    }
}
