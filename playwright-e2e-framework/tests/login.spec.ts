import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Login test suite for SauceDemo.
 *
 * Test design patterns demonstrated:
 * - Each test is independent (no shared state between tests)
 * - beforeEach handles common setup (navigating to login page)
 * - Tests use page objects for interactions, assertions stay in test files
 * - Descriptive test names explain the BEHAVIOR, not the implementation
 */

test.describe('Login Functionality', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('successful login with standard user redirects to inventory', async ({ page }) => {
        const inventoryPage = await loginPage.loginAs('standard_user', 'secret_sauce');
        await expect(page).toHaveURL(/inventory/);
        expect(await inventoryPage.getProductCount()).toBeGreaterThan(0);
    });

    test('locked out user sees error message', async () => {
        await loginPage.loginAs('locked_out_user', 'secret_sauce');
        const error = await loginPage.getErrorMessage();
        expect(error).toContain('locked out');
    });

    test('invalid credentials show error message', async () => {
        await loginPage.loginAs('invalid_user', 'wrong_password');
        expect(await loginPage.isErrorVisible()).toBeTruthy();
    });

    test('empty username shows validation error', async () => {
        await loginPage.loginAs('', 'secret_sauce');
        const error = await loginPage.getErrorMessage();
        expect(error).toContain('Username is required');
    });

    test('empty password shows validation error', async () => {
        await loginPage.loginAs('standard_user', '');
        const error = await loginPage.getErrorMessage();
        expect(error).toContain('Password is required');
    });
});
