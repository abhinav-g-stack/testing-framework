import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * InventoryPage — Page object for SauceDemo product listing page.
 *
 * This page demonstrates:
 * - Working with dynamic lists of elements (products)
 * - Sorting/filtering interactions
 * - Cart operations that span multiple page objects
 */
export class InventoryPage extends BasePage {
    private inventoryItems = this.page.locator('.inventory_item');
    private sortDropdown = this.page.getByTestId('product-sort-container');
    private cartBadge = this.page.locator('.shopping_cart_badge');
    private cartLink = this.page.locator('.shopping_cart_link');

    constructor(page: Page) {
        super(page);
    }

    async getProductCount(): Promise<number> {
        return await this.inventoryItems.count();
    }

    async getProductNames(): Promise<string[]> {
        return await this.page.locator('.inventory_item_name').allTextContents();
    }

    async addProductToCart(productName: string) {
        const product = this.inventoryItems.filter({ hasText: productName });
        await product.getByRole('button', { name: /add to cart/i }).click();
    }

    async removeProductFromCart(productName: string) {
        const product = this.inventoryItems.filter({ hasText: productName });
        await product.getByRole('button', { name: /remove/i }).click();
    }

    async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo') {
        await this.sortDropdown.selectOption(option);
    }

    async getCartItemCount(): Promise<number> {
        const isVisible = await this.cartBadge.isVisible();
        if (!isVisible) return 0;
        const text = await this.cartBadge.textContent();
        return parseInt(text ?? '0');
    }

    async goToCart() {
        await this.cartLink.click();
    }
}
