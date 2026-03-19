package com.sdet.api.listeners;

import org.testng.IAnnotationTransformer;
import org.testng.annotations.ITestAnnotation;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/**
 * Globally attaches RetryAnalyzer to ALL tests without annotating each one.
 *
 * This is the "framework-level" approach vs "test-level" approach.
 * Register this listener in testng.xml and every test automatically gets retry behavior.
 *
 * Senior SDET pattern: framework-wide behaviors should not require test authors
 * to remember annotations. Convention over configuration.
 */
public class TestRetryListener implements IAnnotationTransformer {

    @Override
    public void transform(ITestAnnotation annotation, Class testClass,
                          Constructor testConstructor, Method testMethod) {
        annotation.setRetryAnalyzer(RetryAnalyzer.class);
    }
}
