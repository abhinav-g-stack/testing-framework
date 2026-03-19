import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CartPage — Page object for SauceDemo shopping cart.
 *
 * This page demonstrates the "page transition" pattern:
 * - goToCheckout() returns a CheckoutPage instance
 * - This makes test code read like a user story:
 *     inventoryPage.addProduct('Backpack')
 *     inventoryPage.goToCart()
 *     cartPage.goToCheckout()
 *     checkoutPage.fillDetails(...)
 *
 * Each method returns the appropriate page object for the NEXT step.
 */
export class CartPage extends BasePage {
    private cartItems = this.page.locator('.cart_item');
    private continueShoppingButton = this.page.getByTestId('continue-shopping');
    private checkoutButton = this.page.getByTestId('checkout');
    private removeButtons = this.page.getByRole('button', { name: /remove/i });

    constructor(page: Page) {
        super(page);
    }

    async getCartItemCount(): Promise<number> {
        return await this.cartItems.count();
    }

    async getCartItemNames(): Promise<string[]> {
        return await this.page.locator('.inventory_item_name').allTextContents();
    }

    async getCartItemPrices(): Promise<number[]> {
        const priceTexts = await this.page.locator('.inventory_item_price').allTextContents();
        return priceTexts.map(text => parseFloat(text.replace('$', '')));
    }

    async removeItem(itemName: string) {
        const item = this.cartItems.filter({ hasText: itemName });
        await item.getByRole('button', { name: /remove/i }).click();
    }

    async removeAllItems() {
        const count = await this.removeButtons.count();
        // Remove from last to first (removing shifts indices)
        for (let i = count - 1; i >= 0; i--) {
            await this.removeButtons.nth(i).click();
        }
    }

    async continueShopping() {
        await this.continueShoppingButton.click();
    }

    async goToCheckout() {
        await this.checkoutButton.click();
    }
}
