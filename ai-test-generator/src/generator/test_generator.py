"""
AI-Powered Test Generator using Claude API.

This is the core of the project — takes parsed endpoint info and uses
Claude to generate framework-specific test code.

Architecture decision: Template + LLM hybrid approach
- Templates provide the boilerplate structure (imports, class setup)
- LLM generates the INTERESTING parts (test scenarios, assertions, edge cases)
- This gives you consistent formatting + creative test coverage

TODO: This is where YOUR design decisions matter most.
Think about:
1. How specific should the prompt be? Too vague = inconsistent output. Too rigid = no creativity.
2. Should the LLM generate one test at a time or a full suite?
3. How do you validate the generated code actually compiles/runs?
"""

import anthropic
from ..parser.openapi_parser import EndpointInfo


def generate_tests(
    endpoints: list[EndpointInfo],
    framework: str = "rest-assured",
    model: str = "claude-sonnet-4-20250514",
) -> str:
    """
    Generate test code for the given endpoints using Claude API.

    Args:
        endpoints: Parsed endpoint information from OpenAPI spec
        framework: Target test framework (rest-assured, pytest, playwright)
        model: Claude model to use

    Returns:
        Generated test code as a string
    """
    client = anthropic.Anthropic()  # Uses ANTHROPIC_API_KEY env var

    prompt = _build_prompt(endpoints, framework)

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        system=_get_system_prompt(framework),
    )

    return message.content[0].text


def _get_system_prompt(framework: str) -> str:
    """System prompt that defines the LLM's role and output format."""
    framework_details = {
        "rest-assured": {
            "language": "Java 17",
            "imports": "io.restassured, org.testng, io.qameta.allure",
            "patterns": "Builder pattern for requests, @DataProvider for data-driven tests",
        },
        "pytest": {
            "language": "Python 3.11+",
            "imports": "requests, pytest",
            "patterns": "pytest fixtures, parametrize decorator",
        },
        "playwright": {
            "language": "TypeScript",
            "imports": "@playwright/test",
            "patterns": "Page Object Model, test.describe blocks",
        },
    }

    details = framework_details.get(framework, framework_details["rest-assured"])

    return f"""You are a senior SDET generating production-quality API test code.

Framework: {framework} ({details['language']})
Key imports: {details['imports']}
Patterns to use: {details['patterns']}

Rules:
1. Generate COMPILABLE code — no pseudocode, no placeholders
2. Include positive tests, negative tests, and edge cases
3. Use descriptive test method names that explain the scenario
4. Add Allure annotations for reporting (if framework supports it)
5. Include JSON Schema validation where applicable
6. Add comments explaining WHY each test exists, not WHAT it does
7. Use data-driven patterns for parameterized scenarios

Output ONLY the code. No explanations before or after."""


def _build_prompt(endpoints: list[EndpointInfo], framework: str) -> str:
    """Build the prompt with endpoint details for the LLM."""
    endpoint_descriptions = []

    for ep in endpoints:
        desc = f"""
Endpoint: {ep.method} {ep.path}
Summary: {ep.summary or 'N/A'}
Parameters: {ep.parameters}
Request Body Schema: {ep.request_body_schema or 'None'}
Response Schemas: {ep.response_schemas}
Authentication: {ep.security or 'None'}
"""
        endpoint_descriptions.append(desc)

    return f"""Generate {framework} test code for the following API endpoints:

{''.join(endpoint_descriptions)}

Generate a complete test class/file with:
1. All necessary imports
2. Base setup (base URL, auth if needed)
3. Positive tests for each endpoint (happy path)
4. Negative tests (invalid input, missing required fields, wrong auth)
5. Edge cases (boundary values, empty strings, special characters)
6. Response schema validation
"""
