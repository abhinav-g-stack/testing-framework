package com.sdet.api.tests;

import com.sdet.api.base.BaseTest;
import io.qameta.allure.*;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Tests for /todos and /comments endpoints — additional resource coverage.
 *
 * Demonstrates the framework handles ANY resource, not just users/posts.
 * Also tests query parameter filtering and nested resource patterns.
 */
@Epic("Resource Management")
@Feature("Todos & Comments API")
public class ResourceApiTest extends BaseTest {

    @Test(description = "GET /todos - List all todos returns 200")
    @Severity(SeverityLevel.NORMAL)
    @Story("List Todos")
    public void testListTodos() {
        given()
            .spec(requestSpec)
        .when()
            .get("/todos")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("$", hasSize(200))
            .body("[0].userId", notNullValue())
            .body("[0].title", notNullValue())
            .body("[0].completed", isA(Boolean.class));
    }

    @Test(description = "GET /todos?completed=true - Filter completed todos")
    @Severity(SeverityLevel.NORMAL)
    @Story("Filter Todos")
    public void testFilterCompletedTodos() {
        given()
            .spec(requestSpec)
            .queryParam("completed", true)
        .when()
            .get("/todos")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("completed", everyItem(equalTo(true)));
    }

    @Test(description = "GET /comments?postId=1 - Filter comments by post")
    @Severity(SeverityLevel.NORMAL)
    @Story("Filter Comments")
    public void testFilterCommentsByPost() {
        given()
            .spec(requestSpec)
            .queryParam("postId", 1)
        .when()
            .get("/comments")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("$", hasSize(5))
            .body("postId", everyItem(equalTo(1)))
            .body("[0].email", containsString("@"));
    }

    @Test(description = "GET /todos/{id} - Non-existent todo returns 404")
    @Severity(SeverityLevel.NORMAL)
    @Story("Get Todo")
    public void testGetNonExistentTodo() {
        given()
            .spec(requestSpec)
            .pathParam("id", 9999)
        .when()
            .get("/todos/{id}")
        .then()
            .statusCode(404);
    }
}
