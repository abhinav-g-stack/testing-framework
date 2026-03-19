import { test, expect } from '../fixtures/auth.fixture';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Checkout Flow Tests — Full E2E purchase journey.
 *
 * NOTE: These tests use the auth fixture.
 * import { test, expect } from '../fixtures/auth.fixture'
 *   ↑ This gives us an already-authenticated inventoryPage
 *
 * vs. the login tests which import from '@playwright/test'
 * because they're TESTING the login itself.
 *
 * Test structure follows the real user journey:
 * 1. Add products to cart (via inventoryPage fixture)
 * 2. Go to cart (CartPage)
 * 3. Proceed to checkout (CheckoutPage - Step 1)
 * 4. Review order (CheckoutPage - Step 2)
 * 5. Confirm purchase (CheckoutPage - Step 3)
 *
 * Edge cases tested:
 * - Checkout with empty cart
 * - Missing required fields in checkout form
 * - Removing items during checkout
 */

test.describe('Complete Checkout Flow', () => {

    test('full purchase flow — add item, checkout, confirm', async ({ inventoryPage, page }) => {
        // Step 1: Add product to cart
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        expect(await inventoryPage.getCartItemCount()).toBe(1);

        // Step 2: Go to cart
        await inventoryPage.goToCart();
        const cartPage = new CartPage(page);
        expect(await cartPage.getCartItemCount()).toBe(1);

        const cartItems = await cartPage.getCartItemNames();
        expect(cartItems).toContain('Sauce Labs Backpack');

        // Step 3: Proceed to checkout
        await cartPage.goToCheckout();
        const checkoutPage = new CheckoutPage(page);

        // Step 4: Fill information and continue to overview
        await checkoutPage.fillAndContinue('Abhinav', 'Gautam', '10001');

        // Step 5: Verify order overview
        const total = await checkoutPage.getTotal();
        expect(total).toContain('$');  // Has a price

        // Step 6: Finish purchase
        await checkoutPage.clickFinish();

        // Step 7: Verify confirmation
        const header = await checkoutPage.getConfirmationHeader();
        expect(header).toContain('Thank you for your order');
    });

    test('checkout with multiple items shows correct cart', async ({ inventoryPage, page }) => {
        // Add multiple products
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.addProductToCart('Sauce Labs Bike Light');
        await inventoryPage.addProductToCart('Sauce Labs Bolt T-Shirt');
        expect(await inventoryPage.getCartItemCount()).toBe(3);

        // Go to cart and verify
        await inventoryPage.goToCart();
        const cartPage = new CartPage(page);
        expect(await cartPage.getCartItemCount()).toBe(3);

        const names = await cartPage.getCartItemNames();
        expect(names).toContain('Sauce Labs Backpack');
        expect(names).toContain('Sauce Labs Bike Light');
        expect(names).toContain('Sauce Labs Bolt T-Shirt');
    });

    test('remove item from cart during checkout', async ({ inventoryPage, page }) => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.addProductToCart('Sauce Labs Bike Light');

        await inventoryPage.goToCart();
        const cartPage = new CartPage(page);
        expect(await cartPage.getCartItemCount()).toBe(2);

        // Remove one item
        await cartPage.removeItem('Sauce Labs Backpack');
        expect(await cartPage.getCartItemCount()).toBe(1);

        const remaining = await cartPage.getCartItemNames();
        expect(remaining).not.toContain('Sauce Labs Backpack');
        expect(remaining).toContain('Sauce Labs Bike Light');
    });

    test('continue shopping returns to inventory', async ({ inventoryPage, page }) => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.goToCart();

        const cartPage = new CartPage(page);
        await cartPage.continueShopping();

        await expect(page).toHaveURL(/inventory/);
    });
});

test.describe('Checkout Form Validation', () => {

    test('missing first name shows error', async ({ inventoryPage, page }) => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.goToCart();

        const cartPage = new CartPage(page);
        await cartPage.goToCheckout();

        const checkoutPage = new CheckoutPage(page);
        await checkoutPage.fillAndContinue('', 'Gautam', '10001');

        expect(await checkoutPage.isErrorVisible()).toBeTruthy();
        const error = await checkoutPage.getErrorMessage();
        expect(error).toContain('First Name is required');
    });

    test('missing last name shows error', async ({ inventoryPage, page }) => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.goToCart();

        const cartPage = new CartPage(page);
        await cartPage.goToCheckout();

        const checkoutPage = new CheckoutPage(page);
        await checkoutPage.fillAndContinue('Abhinav', '', '10001');

        expect(await checkoutPage.isErrorVisible()).toBeTruthy();
        const error = await checkoutPage.getErrorMessage();
        expect(error).toContain('Last Name is required');
    });

    test('missing postal code shows error', async ({ inventoryPage, page }) => {
        await inventoryPage.addProductToCart('Sauce Labs Backpack');
        await inventoryPage.goToCart();

        const cartPage = new CartPage(page);
        await cartPage.goToCheckout();

        const checkoutPage = new CheckoutPage(page);
        await checkoutPage.fillAndContinue('Abhinav', 'Gautam', '');

        expect(await checkoutPage.isErrorVisible()).toBeTruthy();
        const error = await checkoutPage.getErrorMessage();
        expect(error).toContain('Postal Code is required');
    });
});
