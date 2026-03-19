package com.sdet.api.tests;

import com.sdet.api.base.BaseTest;
import com.sdet.api.models.User;
import com.sdet.api.utils.JsonDataReader;
import io.qameta.allure.*;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Tests for the /users endpoint of JSONPlaceholder API.
 *
 * JSONPlaceholder key behaviors:
 * - GET /users      → returns all 10 users (no pagination)
 * - GET /users/{id} → returns single user or empty {} with 404
 * - POST /users     → "creates" user, returns it with id: 11
 * - PUT /users/{id} → "updates" user, returns the sent body + id
 * - DELETE /users/{id} → returns 200 (not 204 like Reqres)
 *
 * Note: JSONPlaceholder is a FAKE API — POST/PUT/DELETE don't actually
 * persist. It returns the response as if it worked. This is fine for
 * framework demonstration — real frameworks would hit a staging environment.
 */
@Epic("User Management")
@Feature("Users API")
public class UserApiTest extends BaseTest {

    // ─── GET Tests ──────────────────────────────────────────────────────

    @Test(description = "GET /users - List all users returns 200")
    @Severity(SeverityLevel.CRITICAL)
    @Story("List Users")
    public void testListUsers() {
        given()
            .spec(requestSpec)
        .when()
            .get("/users")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("$", hasSize(10))
            .body("[0].id", notNullValue())
            .body("[0].name", notNullValue())
            .body("[0].email", containsString("@"));
    }

    @Test(description = "GET /users/{id} - Get single user by ID")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Get User")
    public void testGetSingleUser() {
        given()
            .spec(requestSpec)
            .pathParam("id", 1)
        .when()
            .get("/users/{id}")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("id", equalTo(1))
            .body("name", equalTo("Leanne Graham"))
            .body("email", notNullValue())
            .body("username", notNullValue())
            .body("phone", notNullValue());
    }

    @Test(description = "GET /users/{id} - Non-existent user returns 404")
    @Severity(SeverityLevel.NORMAL)
    @Story("Get User")
    public void testGetNonExistentUser() {
        given()
            .spec(requestSpec)
            .pathParam("id", 999)
        .when()
            .get("/users/{id}")
        .then()
            .statusCode(404);
    }

    // ─── POST Tests (Data-Driven) ───────────────────────────────────────

    @Test(description = "POST /users - Create user with data from JSON file",
          dataProvider = "createUserData")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Create User")
    public void testCreateUser(Map<String, Object> data) {
        String name = (String) data.get("name");
        String email = (String) data.get("email");
        int expectedStatus = ((Number) data.get("expectedStatus")).intValue();

        User user = User.builder()
                .name(name)
                .email(email)
                .build();

        given()
            .spec(requestSpec)
            .body(user)
        .when()
            .post("/users")
        .then()
            .spec(responseSpec)
            .statusCode(expectedStatus)
            .body("name", equalTo(name))
            .body("email", equalTo(email))
            .body("id", notNullValue());
    }

    // ─── PUT Tests (Data-Driven) ────────────────────────────────────────

    @Test(description = "PUT /users/{id} - Update user with data from JSON file",
          dataProvider = "updateUserData")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Update User")
    public void testUpdateUser(Map<String, Object> data) {
        int userId = ((Number) data.get("id")).intValue();
        String name = (String) data.get("name");
        String email = (String) data.get("email");
        int expectedStatus = ((Number) data.get("expectedStatus")).intValue();

        User updatedUser = User.builder()
                .name(name)
                .email(email)
                .build();

        given()
            .spec(requestSpec)
            .pathParam("id", userId)
            .body(updatedUser)
        .when()
            .put("/users/{id}")
        .then()
            .spec(responseSpec)
            .statusCode(expectedStatus)
            .body("name", equalTo(name))
            .body("email", equalTo(email));
    }

    // ─── DELETE Tests ───────────────────────────────────────────────────

    @Test(description = "DELETE /users/{id} - Delete user returns 200")
    @Severity(SeverityLevel.NORMAL)
    @Story("Delete User")
    public void testDeleteUser() {
        given()
            .spec(requestSpec)
            .pathParam("id", 1)
        .when()
            .delete("/users/{id}")
        .then()
            .statusCode(200);  // JSONPlaceholder returns 200 for DELETE
    }

    // ─── PATCH Tests ────────────────────────────────────────────────────

    @Test(description = "PATCH /users/{id} - Partial update user")
    @Severity(SeverityLevel.NORMAL)
    @Story("Update User")
    public void testPatchUser() {
        given()
            .spec(requestSpec)
            .pathParam("id", 1)
            .body("{\"name\": \"Patched Name\"}")
        .when()
            .patch("/users/{id}")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("name", equalTo("Patched Name"));
    }

    // ─── Data Providers ─────────────────────────────────────────────────

    @DataProvider(name = "createUserData")
    public Object[][] createUserData() {
        return JsonDataReader.getTestData("users.json", "createUser");
    }

    @DataProvider(name = "updateUserData")
    public Object[][] updateUserData() {
        return JsonDataReader.getTestData("users.json", "updateUser");
    }
}
