package com.sdet.api.base;

import com.sdet.api.utils.ConfigManager;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.builder.ResponseSpecBuilder;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import io.restassured.specification.ResponseSpecification;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Optional;
import org.testng.annotations.Parameters;

/**
 * Base test class that ALL test classes extend.
 *
 * HOW THE SETUP FLOW WORKS (step by step):
 *
 * 1. TestNG reads testng.xml → finds <parameter name="env" value="dev"/>
 * 2. @BeforeClass runs setup() with env="dev"
 * 3. System property "env" is set → ConfigManager loads config/dev.properties
 * 4. ConfigManager.get("base.url") → returns "https://reqres.in/api"
 * 5. RequestSpec is built with that URL + JSON content type + Allure logging
 * 6. Every test method in subclasses can now use requestSpec and responseSpec
 *
 * To switch environments:
 *   mvn test -Denv=staging     ← command line
 *   <parameter name="env" value="staging"/>  ← testng.xml
 *
 * Architecture pattern: Template Method
 * - This class provides the "template" (setup, specs, logging)
 * - Subclasses fill in the "steps" (actual test methods)
 */
public class BaseTest {

    protected static final Logger logger = LogManager.getLogger(BaseTest.class);

    protected RequestSpecification requestSpec;
    protected ResponseSpecification responseSpec;

    @BeforeClass
    @Parameters({"env"})
    public void setup(@Optional("dev") String env) {
        // Set system property so ConfigManager knows which file to load
        System.setProperty("env", env);
        logger.info("Setting up tests for environment: {}", env);

        String baseUrl = ConfigManager.get("base.url");
        boolean logRequest = Boolean.parseBoolean(ConfigManager.get("log.request", "true"));

        logger.info("Base URL: {}", baseUrl);

        // Build the request specification shared by all tests
        RequestSpecBuilder reqBuilder = new RequestSpecBuilder()
                .setBaseUri(baseUrl)
                .setContentType(ContentType.JSON)
                .setAccept(ContentType.JSON)
                .addFilter(new AllureRestAssured());  // Auto-attach req/res to Allure reports

        if (logRequest) {
            reqBuilder.log(LogDetail.ALL);
        }

        requestSpec = reqBuilder.build();

        // Build the response specification (default expectations)
        ResponseSpecBuilder resBuilder = new ResponseSpecBuilder();
        boolean logResponse = Boolean.parseBoolean(ConfigManager.get("log.response", "true"));
        if (logResponse) {
            resBuilder.log(LogDetail.ALL);
        }
        responseSpec = resBuilder.build();

        // Log request/response ONLY when a test fails (reduces noise for passing tests)
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }
}
