package com.sdet.api.listeners;

import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * Retry logic for flaky tests.
 *
 * Why this exists:
 * - API tests hit real endpoints that can have transient failures (timeouts, rate limits)
 * - Retrying 1-2 times prevents false negatives in CI without masking real bugs
 * - The key insight: retry is a LAST RESORT. First, fix the root cause (add waits, handle rate limits)
 *
 * Usage: @Test(retryAnalyzer = RetryAnalyzer.class)
 * Or attach globally via TestNG listener (see TestRetryListener)
 *
 * Interview talking point: "I implement retry at the framework level, not the test level,
 * so individual test authors don't need to think about it."
 */
public class RetryAnalyzer implements IRetryAnalyzer {

    private int retryCount = 0;
    private static final int MAX_RETRY_COUNT = 2;

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            return true;
        }
        return false;
    }
}
