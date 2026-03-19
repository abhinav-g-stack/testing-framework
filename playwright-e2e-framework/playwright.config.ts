import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration — the nerve center of your framework.
 *
 * Key decisions explained:
 * - trace: 'on-first-retry' → Only captures traces when tests fail and retry.
 *   Never use 'on' in CI — it wastes storage and slows everything down.
 * - screenshot: 'only-on-failure' → You only need screenshots for debugging failures.
 * - fullyParallel: true → Tests across AND within files run in parallel.
 *   This is the default but making it explicit shows intentional configuration.
 * - retries: 2 in CI, 0 locally → Flaky tests should fail fast locally but get
 *   a second chance in CI where environment noise is higher.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,                    // Fail CI if test.only left in code
    retries: process.env.CI ? 2 : 0,                 // Retry in CI only
    workers: process.env.CI ? 1 : undefined,          // Sequential in CI for stability
    reporter: [
        ['html', { open: 'never' }],                  // Always generate HTML report
        ['list'],                                       // Console output
        ...(process.env.CI ? [['github' as const]] : []),  // GitHub Actions annotations
    ],
    use: {
        baseURL: 'https://www.saucedemo.com',
        trace: 'on-first-retry',                       // Trace only on failed retry
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10000,                           // 10s per action
        navigationTimeout: 30000,                       // 30s for page loads
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        // Mobile viewports
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 12'] },
        },
    ],
});
