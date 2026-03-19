import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Visual Regression Tests — Screenshot comparison testing.
 *
 * WHAT THIS IS:
 * Visual testing compares a screenshot of the current page against a
 * "baseline" screenshot (stored in the repo). If they differ beyond a
 * threshold, the test fails.
 *
 * HOW IT WORKS:
 * 1. First run: Playwright takes screenshots and saves them as baselines
 *    in tests/visual.spec.ts-snapshots/
 * 2. Subsequent runs: Takes new screenshots and compares pixel-by-pixel
 * 3. If difference exceeds maxDiffPixelRatio → test FAILS
 * 4. Review the diff image to decide if the change is intentional
 *
 * WHY THIS MATTERS:
 * - CSS changes can break layouts without any functional test failing
 * - Visual tests catch: misaligned buttons, overlapping text, missing images
 * - Useful during responsive design work and theme changes
 *
 * TO GENERATE BASELINES (first run):
 *   npx playwright test visual.spec.ts --update-snapshots
 *
 * TO RUN COMPARISONS:
 *   npx playwright test visual.spec.ts
 */

test.describe('Visual Regression', () => {

    test('login page matches baseline', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await expect(page).toHaveScreenshot('login-page.png', {
            maxDiffPixelRatio: 0.01,   // Allow 1% pixel difference (anti-aliasing)
            fullPage: true,
        });
    });

    test('inventory page matches baseline', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginAs('standard_user', 'secret_sauce');

        // Wait for all product images to load before screenshot
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot('inventory-page.png', {
            maxDiffPixelRatio: 0.01,
            fullPage: true,
        });
    });
});
