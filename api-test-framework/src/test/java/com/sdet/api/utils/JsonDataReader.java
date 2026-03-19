package com.sdet.api.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Reads test data from JSON files and converts it to TestNG @DataProvider format.
 *
 * HOW THIS WORKS:
 *
 * 1. JSON files live in src/test/resources/testdata/ (e.g., users.json)
 * 2. Each file contains named datasets:
 *    {
 *      "createUser": [ {name, job, expectedStatus}, ... ],
 *      "updateUser": [ {id, name, job, expectedStatus}, ... ]
 *    }
 * 3. A @DataProvider calls: JsonDataReader.getTestData("users.json", "createUser")
 * 4. Returns Object[][] where each row = one test execution
 *
 * WHY this design:
 * - QA team members add test cases by editing JSON, not Java code
 * - Same test method runs N times with N data rows (data-driven)
 * - Git diffs on JSON are clean and reviewable
 * - You can have environment-specific data files (users-dev.json, users-staging.json)
 *
 * DESIGN CHOICE: We return List<Map<String, Object>> instead of deserializing
 * to specific POJOs. Why? Because different endpoints have different shapes.
 * A Map is flexible — the test method extracts what it needs.
 * Trade-off: No compile-time type safety on data fields. But the flexibility
 * of not needing a new POJO per test data shape wins for framework design.
 */
public class JsonDataReader {

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Load a named dataset from a JSON test data file.
     *
     * @param fileName  JSON file in src/test/resources/testdata/ (e.g., "users.json")
     * @param dataSetName  Key in the JSON object (e.g., "createUser")
     * @return Object[][] for TestNG @DataProvider — each row is one Map of test data
     */
    public static Object[][] getTestData(String fileName, String dataSetName) {
        try {
            // Load from classpath (works in both IDE and Maven)
            InputStream stream = JsonDataReader.class
                    .getClassLoader()
                    .getResourceAsStream("testdata/" + fileName);

            if (stream == null) {
                throw new RuntimeException("Test data file not found: testdata/" + fileName);
            }

            // Parse the entire JSON file as a Map of datasets
            Map<String, List<Map<String, Object>>> allData = mapper.readValue(
                    stream,
                    new TypeReference<>() {}
            );

            List<Map<String, Object>> dataSet = allData.get(dataSetName);
            if (dataSet == null) {
                throw new RuntimeException(
                        "Dataset '" + dataSetName + "' not found in " + fileName
                        + ". Available: " + allData.keySet()
                );
            }

            // Convert List<Map> → Object[][] (TestNG @DataProvider format)
            // Each row is a single Map containing all fields for that test case
            Object[][] result = new Object[dataSet.size()][1];
            for (int i = 0; i < dataSet.size(); i++) {
                result[i][0] = dataSet.get(i);
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Failed to read test data: " + fileName, e);
        }
    }

    /**
     * Load a specific field from a config JSON file.
     * Useful for loading auth tokens, base URLs, etc.
     */
    public static String getConfigValue(String fileName, String key) {
        try {
            InputStream stream = JsonDataReader.class
                    .getClassLoader()
                    .getResourceAsStream("config/" + fileName);

            if (stream == null) {
                throw new RuntimeException("Config file not found: config/" + fileName);
            }

            Map<String, Object> config = mapper.readValue(
                    stream,
                    new TypeReference<>() {}
            );

            Object value = config.get(key);
            return value != null ? value.toString() : null;

        } catch (Exception e) {
            throw new RuntimeException("Failed to read config: " + fileName, e);
        }
    }
}
