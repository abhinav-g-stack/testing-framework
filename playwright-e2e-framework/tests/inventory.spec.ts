import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Inventory/Shopping tests — demonstrates more complex E2E flows.
 *
 * Pattern: Login is a prerequisite, not the thing under test.
 * Use beforeEach to handle authentication, keep tests focused on their actual scope.
 */

test.describe('Inventory & Shopping', () => {
    let inventoryPage: InventoryPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        inventoryPage = await loginPage.loginAs('standard_user', 'secret_sauce');
    });

    test('inventory page displays 6 products', async () => {
        const count = await inventoryPage.getProductCount();
        expect(count).toBe(6);
    });

    test('products can be sorted by name A-Z', async () => {
        await inventoryPage.sortBy('az');
        const names = await inventoryPage.getProductNames();
        const sorted = [...names].sort();
        expect(names).toEqual(sorted);
    });

    test('products can be sorted by name Z-A', async () => {
        await inventoryPage.sortBy('za');
        const names = await inventoryPage.getProductNames();
        const sorted = [...names].sort().reverse();
        expect(names).toEqual(sorted);
    });

    test('adding product to cart updates cart badge', async () => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        expect(await inventoryPage.getCartItemCount()).toBe(1);
    });

    test('removing product from cart updates cart badge', async () => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.removeProductFromCart('Sauce Labs Backpack');
        expect(await inventoryPage.getCartItemCount()).toBe(0);
    });

    test('multiple products can be added to cart', async () => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.addProductToCart('Sauce Labs Bike Light');
        expect(await inventoryPage.getCartItemCount()).toBe(2);
    });
});
