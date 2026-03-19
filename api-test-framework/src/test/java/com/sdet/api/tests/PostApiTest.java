package com.sdet.api.tests;

import com.sdet.api.base.BaseTest;
import com.sdet.api.models.Post;
import io.qameta.allure.*;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Tests for the /posts endpoint — demonstrates testing a SECOND resource.
 *
 * WHY this matters: A framework that only tests one endpoint (/users) looks
 * like a tutorial project. Adding /posts shows the framework is GENERIC —
 * it works for any resource, not just the one you demo'd.
 *
 * JSONPlaceholder has 100 posts, each with userId, title, and body.
 * Also demonstrates nested resource queries: /posts?userId=1
 */
@Epic("Content Management")
@Feature("Posts API")
public class PostApiTest extends BaseTest {

    @Test(description = "GET /posts - List all posts returns 100 items")
    @Severity(SeverityLevel.CRITICAL)
    @Story("List Posts")
    public void testListPosts() {
        given()
            .spec(requestSpec)
        .when()
            .get("/posts")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("$", hasSize(100))
            .body("[0].userId", notNullValue())
            .body("[0].title", notNullValue());
    }

    @Test(description = "GET /posts/{id} - Get single post")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Get Post")
    public void testGetSinglePost() {
        given()
            .spec(requestSpec)
            .pathParam("id", 1)
        .when()
            .get("/posts/{id}")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("id", equalTo(1))
            .body("userId", equalTo(1))
            .body("title", notNullValue())
            .body("body", notNullValue());
    }

    @Test(description = "GET /posts?userId=1 - Filter posts by user")
    @Severity(SeverityLevel.NORMAL)
    @Story("Filter Posts")
    public void testFilterPostsByUser() {
        given()
            .spec(requestSpec)
            .queryParam("userId", 1)
        .when()
            .get("/posts")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("$", hasSize(10))
            .body("userId", everyItem(equalTo(1)));
    }

    @Test(description = "POST /posts - Create a new post")
    @Severity(SeverityLevel.CRITICAL)
    @Story("Create Post")
    public void testCreatePost() {
        Post newPost = Post.builder()
                .userId(1)
                .title("Framework Test Post")
                .body("This post was created by the API test framework")
                .build();

        given()
            .spec(requestSpec)
            .body(newPost)
        .when()
            .post("/posts")
        .then()
            .spec(responseSpec)
            .statusCode(201)
            .body("title", equalTo("Framework Test Post"))
            .body("userId", equalTo(1))
            .body("id", notNullValue());
    }

    @Test(description = "GET /posts/{id}/comments - Nested resource")
    @Severity(SeverityLevel.NORMAL)
    @Story("Post Comments")
    public void testGetPostComments() {
        given()
            .spec(requestSpec)
            .pathParam("id", 1)
        .when()
            .get("/posts/{id}/comments")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("$", hasSize(5))
            .body("[0].postId", equalTo(1))
            .body("[0].email", containsString("@"));
    }
}
