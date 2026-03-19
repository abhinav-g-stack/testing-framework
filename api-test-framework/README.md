# Multi-Layer API Test Framework

A modular REST API automation framework built with **Java 17 + Rest Assured + TestNG + Allure** — demonstrating framework design, data-driven testing, JSON Schema validation, and CI/CD integration.

## What Problem Does This Solve?

In most companies, API testing starts as scattered Postman collections or one-off scripts. As the API surface grows, this approach collapses:

- **No structure** — tests are copy-pasted, not reusable
- **No data separation** — test data is hardcoded in scripts
- **No reporting** — "did it pass?" requires reading terminal output
- **No CI** — tests only run when someone remembers to
- **No contract validation** — backend changes silently break consumers

This framework solves all five problems with a layered architecture that separates concerns:

```
┌─────────────────────────────────────────────────┐
│  testng.xml — Orchestration Layer               │
│  (Which tests run, in what order, parallel?)    │
├─────────────────────────────────────────────────┤
│  Test Classes — Execution Layer                 │
│  (UserApiTest, PostApiTest, SchemaValidationTest)│
├─────────────────────────────────────────────────┤
│  BaseTest + Utilities — Framework Layer         │
│  (Config, logging, retry, data readers)         │
├─────────────────────────────────────────────────┤
│  Models + Schemas — Data Layer                  │
│  (POJOs, JSON test data, JSON Schema files)     │
├─────────────────────────────────────────────────┤
│  Properties Files — Configuration Layer         │
│  (dev.properties, staging.properties, prod.properties) │
└─────────────────────────────────────────────────┘
```

## Why Should an SDET Learn This?

API test framework design is the **#1 interview differentiator** for senior SDET roles. Companies don't hire senior SDETs to write test scripts — they hire them to **design frameworks** that entire QA teams use. This project demonstrates:

- **Framework architecture** — layered design, separation of concerns
- **Configuration management** — environment switching without code changes
- **Data-driven testing** — test data in JSON, not hardcoded in Java
- **Contract testing** — JSON Schema validation catches structural API changes
- **Reporting** — Allure reports that stakeholders can read
- **CI/CD integration** — GitHub Actions pipeline that runs on every PR

Every interview question like "How would you design an API test framework?" maps directly to decisions made in this project.

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java | 17 LTS | `brew install openjdk@17` |
| Maven | 3.9+ | `brew install maven` |

Ensure JAVA_HOME is set (should already be in your `~/.zshrc`):
```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.18/libexec/openjdk.jdk/Contents/Home
```

### Run

```bash
mvn clean test                        # Full suite (28 tests)
mvn clean test -Denv=staging          # Switch environment
mvn clean test -Dtest=UserApiTest     # Single test class
mvn clean test -Dtest=UserApiTest#testListUsers  # Single test method
mvn allure:serve                      # Open Allure report in browser
```

---

## Project Structure

```
src/test/
├── java/com/sdet/api/
│   ├── base/
│   │   └── BaseTest.java           ← All tests extend this. Sets up RestAssured config.
│   ├── tests/
│   │   ├── UserApiTest.java        ← CRUD tests for /users (data-driven)
│   │   ├── PostApiTest.java        ← Tests for /posts + nested /posts/{id}/comments
│   │   ├── ResourceApiTest.java    ← Tests for /todos, /comments (query filtering)
│   │   └── SchemaValidationTest.java ← JSON Schema contract validation
│   ├── models/
│   │   ├── User.java               ← POJO with Lombok @Builder
│   │   └── Post.java               ← POJO for posts
│   ├── utils/
│   │   ├── ConfigManager.java      ← Loads env-specific .properties files
│   │   └── JsonDataReader.java     ← Loads JSON test data → @DataProvider format
│   └── listeners/
│       ├── RetryAnalyzer.java      ← Retries failed tests (max 2 retries)
│       └── TestRetryListener.java  ← Attaches retry globally (no per-test annotation)
├── resources/
│   ├── testng.xml                  ← Suite definition: Smoke, Regression, Schema
│   ├── config/
│   │   ├── dev.properties          ← base.url, timeouts, logging flags
│   │   ├── staging.properties
│   │   └── prod.properties
│   ├── testdata/
│   │   └── users.json              ← Test data for @DataProvider
│   ├── schemas/
│   │   ├── user-response.json      ← JSON Schema for GET /users/{id}
│   │   └── users-list-response.json ← JSON Schema for GET /users
│   └── log4j2.xml                  ← Logging config (console + file)
└── .github/workflows/
    └── api-tests.yml               ← GitHub Actions CI pipeline
```

---

## Design Principles and Patterns

### 1. Template Method Pattern (BaseTest)

**What:** BaseTest provides the setup "template" — all test classes inherit shared configuration.

**Why:** Changing the base URL, adding a header, or switching auth affects ALL tests by editing ONE file. Without this, you'd change 50 test files for every config change.

**Where:** `BaseTest.java` → `setup()` method builds `requestSpec` and `responseSpec`.

### 2. Builder Pattern (Lombok @Builder)

**What:** `User.builder().name("X").email("Y").build()` creates objects fluently.

**Why:** In testing, you constantly create variations of the same object (valid user, user with missing email, user with long name). Builder is cleaner than constructors with many parameters.

**Where:** `User.java`, `Post.java` — Lombok generates the builder at compile time.

### 3. Data Provider Pattern (JSON → @DataProvider)

**What:** Test data lives in JSON files. `JsonDataReader` converts them to TestNG `@DataProvider` format.

**Why:** Adding a new test case = adding a JSON object. No Java code changes. QA team members who don't write Java can add test data. Git diffs on JSON are clean and reviewable.

**Where:** `JsonDataReader.java` → `getTestData()` method. Called from `@DataProvider` methods in test classes.

### 4. Specification Pattern (Request/Response Specs)

**What:** `RequestSpecBuilder` creates a reusable spec (base URL, content type, logging, Allure filter).

**Why:** Every test uses `given().spec(requestSpec)` instead of repeating `.baseUri().contentType().filter()`. One change to the spec flows to all tests.

**Where:** `BaseTest.java` → `requestSpec` and `responseSpec` fields.

### 5. Singleton Pattern (ConfigManager)

**What:** Config is loaded once from properties file, cached in a static field.

**Why:** Properties files don't change during a test run. Reading the file once prevents I/O overhead on every config access.

**Where:** `ConfigManager.java` → `loadProperties()` with double-check locking.

### 6. Convention over Configuration (TestRetryListener)

**What:** Retry logic is attached globally via a TestNG listener, not annotated on each test.

**Why:** Framework-wide behaviors shouldn't require individual test authors to remember annotations. New tests automatically get retry without the author doing anything.

**Where:** `TestRetryListener.java` registered in `testng.xml` `<listeners>` block.

---

## How to Extend

### Add a new API resource

1. **Model:** Create `src/test/.../models/Album.java` with `@Data @Builder`
2. **Test data:** Create `src/test/resources/testdata/albums.json`
3. **Test class:** Create `src/test/.../tests/AlbumApiTest.java` extending `BaseTest`
4. **Schema:** Create `src/test/resources/schemas/album-response.json`
5. **Register:** Add the class to `testng.xml`

### Add a new environment

1. Create `src/test/resources/config/qa.properties` with `base.url=...`
2. Run: `mvn test -Denv=qa`

### Add authentication

Edit `BaseTest.java` → add `.header("Authorization", "Bearer " + ConfigManager.get("auth.token"))` to the `RequestSpecBuilder`. Store tokens in properties files (per environment).

### Add parallel execution

Already configured in `testng.xml`: `parallel="classes" thread-count="3"`. Increase `thread-count` for more parallelism. Ensure tests are independent (no shared mutable state).

---

## Best Practices Demonstrated

| Practice | Implementation | Why It Matters |
|----------|---------------|----------------|
| Separate test data from test logic | JSON files + JsonDataReader | Non-devs can add test cases |
| Environment-agnostic tests | ConfigManager + .properties | Same tests run anywhere |
| Contract validation | JSON Schema files | Catches structural API changes |
| Automatic retry | Global TestNG listener | Handles transient failures in CI |
| Request/response logging | Allure filter + Log4j2 | Debug failures without re-running |
| Parallel execution | TestNG `parallel="classes"` | Faster feedback loops |

---

## Learning Resources

### Rest Assured
- [Rest Assured Official Docs](https://rest-assured.io/) — API reference and examples
- [Rest Assured Usage Guide](https://github.com/rest-assured/rest-assured/wiki/Usage) — Complete feature walkthrough
- [Baeldung: REST Assured Tutorial](https://www.baeldung.com/rest-assured-tutorial) — Step-by-step Java examples

### TestNG
- [TestNG Documentation](https://testng.org/doc/documentation-main.html) — Official guide
- [TestNG @DataProvider Deep Dive](https://testng.org/doc/documentation-main.html#parameters-dataproviders) — Data-driven testing patterns

### Allure Reporting
- [Allure TestNG Integration](https://allurereport.org/docs/testng/) — Setup and annotations
- [Allure Report Features](https://allurereport.org/docs/) — History, trends, categories

### JSON Schema Validation
- [JSON Schema Specification](https://json-schema.org/understanding-json-schema/) — Schema language reference
- [Rest Assured Schema Validation](https://github.com/rest-assured/rest-assured/wiki/Usage#json-schema-validation) — Integration guide

### Design Patterns for Test Frameworks
- [xUnit Test Patterns](http://xunitpatterns.com/) — The definitive reference for test architecture
- [Martin Fowler: Page Object](https://martinfowler.com/bliki/PageObject.html) — Foundational pattern (applies to API too)

### Interview Prep
- "How would you design an API test framework from scratch?" → Walk through this project's architecture diagram
- "How do you handle test data?" → Explain JSON + DataProvider separation
- "How do you handle environment switching?" → Explain ConfigManager + properties files
- "How do you handle flaky tests?" → Explain RetryAnalyzer + global listener pattern
