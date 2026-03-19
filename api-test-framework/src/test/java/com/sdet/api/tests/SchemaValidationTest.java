package com.sdet.api.tests;

import com.sdet.api.base.BaseTest;
import io.qameta.allure.*;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.given;
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;

/**
 * JSON Schema Validation Tests for JSONPlaceholder API.
 *
 * Validates that API response STRUCTURES match our expected schemas.
 * This catches breaking changes that functional tests miss:
 * - Field renamed (name → fullName)
 * - Field type changed (id: int → id: string)
 * - Required field removed
 */
@Epic("User Management")
@Feature("Contract Validation")
public class SchemaValidationTest extends BaseTest {

    @Test(description = "GET /users/{id} - Response matches JSON schema")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Schema Validation")
    public void testSingleUserResponseSchema() {
        given()
            .spec(requestSpec)
            .pathParam("id", 1)
        .when()
            .get("/users/{id}")
        .then()
            .statusCode(200)
            .body(matchesJsonSchemaInClasspath("schemas/user-response.json"));
    }

    @Test(description = "GET /users - List response matches JSON schema")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Schema Validation")
    public void testUserListResponseSchema() {
        given()
            .spec(requestSpec)
        .when()
            .get("/users")
        .then()
            .statusCode(200)
            .body(matchesJsonSchemaInClasspath("schemas/users-list-response.json"));
    }
}
