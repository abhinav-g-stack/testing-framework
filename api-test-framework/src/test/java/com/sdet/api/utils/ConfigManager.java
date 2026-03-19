package com.sdet.api.utils;

import java.io.InputStream;
import java.util.Properties;

/**
 * Loads environment-specific configuration from .properties files.
 *
 * HOW IT WORKS:
 *
 * 1. Properties files live in src/test/resources/config/:
 *    - dev.properties   → base.url=https://reqres.in/api
 *    - staging.properties → base.url=https://staging.reqres.in/api
 *    - prod.properties  → base.url=https://reqres.in/api
 *
 * 2. Environment is set via:
 *    - System property: -Denv=staging (Maven/command line)
 *    - TestNG parameter: <parameter name="env" value="staging"/>
 *    - Default: "dev"
 *
 * 3. Usage in BaseTest:
 *    String baseUrl = ConfigManager.get("base.url");
 *
 * WHY properties files instead of hardcoded switches:
 * - Adding a new environment = adding a new file (no Java changes)
 * - Each environment can have different timeouts, auth tokens, retry counts
 * - CI/CD can switch environments with a single -Denv=X flag
 * - Properties files are the Java standard — interviewers expect this pattern
 *
 * SINGLETON PATTERN: We load the file once and cache it.
 * Properties don't change during a test run, so why read the file repeatedly?
 */
public class ConfigManager {

    private static Properties properties;
    private static final String DEFAULT_ENV = "dev";

    private ConfigManager() {
        // Prevent instantiation — all methods are static
    }

    /**
     * Get a configuration value for the current environment.
     * Loads the properties file on first access (lazy initialization).
     */
    public static String get(String key) {
        if (properties == null) {
            loadProperties();
        }
        String value = properties.getProperty(key);
        if (value == null) {
            throw new RuntimeException("Config key not found: " + key
                    + " in " + getEnvironment() + ".properties");
        }
        return value;
    }

    /**
     * Get a config value with a fallback default.
     */
    public static String get(String key, String defaultValue) {
        if (properties == null) {
            loadProperties();
        }
        return properties.getProperty(key, defaultValue);
    }

    /**
     * Get the current environment name.
     * Priority: System property > default
     */
    public static String getEnvironment() {
        return System.getProperty("env", DEFAULT_ENV);
    }

    private static synchronized void loadProperties() {
        if (properties != null) return; // Double-check locking

        String env = getEnvironment();
        String fileName = "config/" + env + ".properties";

        properties = new Properties();

        try (InputStream stream = ConfigManager.class
                .getClassLoader()
                .getResourceAsStream(fileName)) {

            if (stream == null) {
                throw new RuntimeException(
                        "Config file not found: " + fileName
                        + ". Available environments: dev, staging, prod"
                );
            }

            properties.load(stream);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load config: " + fileName, e);
        }
    }

    /**
     * Force reload — useful if tests need to switch environments mid-run.
     * Generally not recommended, but available for edge cases.
     */
    public static void reload() {
        properties = null;
    }
}
