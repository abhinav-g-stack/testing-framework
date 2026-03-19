import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CheckoutPage — Handles the multi-step checkout flow in SauceDemo.
 *
 * SauceDemo checkout has 3 steps:
 * 1. Checkout: Your Information (first name, last name, postal code)
 * 2. Checkout: Overview (review items, see total)
 * 3. Checkout: Complete (confirmation message)
 *
 * This page object handles ALL three steps.
 *
 * Design choice: One page object for all checkout steps vs. separate page objects.
 * We use ONE because:
 * - The steps are sequential and tightly coupled
 * - Splitting would create 3 tiny classes with 1-2 methods each
 * - The mental model is "checkout flow" not "three separate pages"
 *
 * Counter-argument for splitting: If steps had complex independent behavior
 * (like a payment form with validation), separate objects would be better.
 */
export class CheckoutPage extends BasePage {
    // Step 1: Your Information
    private firstNameInput = this.page.getByTestId('firstName');
    private lastNameInput = this.page.getByTestId('lastName');
    private postalCodeInput = this.page.getByTestId('postalCode');
    private continueButton = this.page.getByTestId('continue');
    private cancelButton = this.page.getByTestId('cancel');
    private errorMessage = this.page.getByTestId('error');

    // Step 2: Overview
    private summaryInfo = this.page.locator('.summary_info');
    private subtotalLabel = this.page.locator('.summary_subtotal_label');
    private taxLabel = this.page.locator('.summary_tax_label');
    private totalLabel = this.page.locator('.summary_total_label');
    private finishButton = this.page.getByTestId('finish');

    // Step 3: Complete
    private completeHeader = this.page.locator('.complete-header');
    private completeText = this.page.locator('.complete-text');
    private backHomeButton = this.page.getByTestId('back-to-products');

    constructor(page: Page) {
        super(page);
    }

    // ─── Step 1: Fill Information ───────────────────────────────────────

    async fillInformation(firstName: string, lastName: string, postalCode: string) {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
    }

    async clickContinue() {
        await this.continueButton.click();
    }

    async fillAndContinue(firstName: string, lastName: string, postalCode: string) {
        await this.fillInformation(firstName, lastName, postalCode);
        await this.clickContinue();
    }

    async getErrorMessage(): Promise<string> {
        return await this.errorMessage.textContent() ?? '';
    }

    async isErrorVisible(): Promise<boolean> {
        return await this.errorMessage.isVisible();
    }

    // ─── Step 2: Review Overview ────────────────────────────────────────

    async getSubtotal(): Promise<string> {
        return await this.subtotalLabel.textContent() ?? '';
    }

    async getTax(): Promise<string> {
        return await this.taxLabel.textContent() ?? '';
    }

    async getTotal(): Promise<string> {
        return await this.totalLabel.textContent() ?? '';
    }

    async clickFinish() {
        await this.finishButton.click();
    }

    // ─── Step 3: Confirmation ───────────────────────────────────────────

    async getConfirmationHeader(): Promise<string> {
        return await this.completeHeader.textContent() ?? '';
    }

    async getConfirmationText(): Promise<string> {
        return await this.completeText.textContent() ?? '';
    }

    async clickBackHome() {
        await this.backHomeButton.click();
    }
}
