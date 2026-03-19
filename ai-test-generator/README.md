# AI-Powered Test Generator

A CLI tool that parses **OpenAPI/Swagger specs** and uses the **Claude API** to generate framework-specific test code (Rest Assured, pytest, Playwright). Demonstrates the parser → LLM → template hybrid pipeline.

## What Problem Does This Solve?

When a team adds a new API endpoint, someone must manually write tests for it. This is slow and inconsistent:

- **Slow authoring** — writing tests for 20 endpoints takes hours of boilerplate
- **Inconsistent coverage** — some endpoints get thorough tests, others get a single happy-path check
- **Missing edge cases** — humans forget boundary values, empty strings, special characters
- **Onboarding friction** — new team members don't know the framework's patterns

This tool automates the tedious parts while keeping humans in control of the creative parts:

```
OpenAPI Spec (input)
    ↓
Parser (extracts endpoints, schemas, parameters)
    ↓
LLM (generates test scenarios, assertions, edge cases)
    ↓
Template (wraps in framework-specific boilerplate)
    ↓
Compilable Test File (output)
```

The generated code is a **starting point** — you review, adjust, and extend it. The tool handles the 80% boilerplate so you can focus on the 20% that requires domain knowledge.

## Why Should an SDET Learn This?

AI-assisted testing is the fastest-growing area in QA (2025-2026). Senior SDET candidates who demonstrate LLM integration have a significant edge:

- **Future-readiness** — every QA team is evaluating AI tools. Being the person who builds them puts you in a leadership position.
- **Practical AI** — not "ChatGPT can write tests" but "I built a pipeline that reliably generates tests from specs"
- **Architecture thinking** — the parser → LLM → template pattern applies to any AI-assisted tool
- **Shows depth** — most candidates list "AI/ML" as a buzzword. You have a working prototype.

The interview soundbite: "I built a tool that takes a Swagger spec and generates framework-specific API tests using Claude's API. It reduced test authoring time for new endpoints by 70%."

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | `brew install python@3.11` |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com/) |

### Install and Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Parser tests (no API key needed — pure logic)
pytest tests/ -v

# Preview parsed endpoints (no API call)
testgen parse --spec specs/petstore-sample.yaml

# Generate tests (requires API key)
export ANTHROPIC_API_KEY="sk-ant-..."
testgen generate --spec specs/petstore-sample.yaml --framework rest-assured
testgen generate --spec specs/petstore-sample.yaml --framework pytest
testgen generate --spec specs/petstore-sample.yaml --framework playwright
```

---

## Project Structure

```
├── src/
│   ├── parser/
│   │   └── openapi_parser.py    ← Extracts endpoints, params, schemas from OpenAPI specs
│   ├── generator/
│   │   ├── test_generator.py    ← Builds LLM prompts, calls Claude API, returns test code
│   │   └── template_renderer.py ← Jinja2 templates wrap LLM output in framework boilerplate
│   ├── templates/
│   │   ├── rest_assured.java.j2     ← Java/Rest Assured class template
│   │   ├── pytest_template.py.j2    ← Python/pytest file template
│   │   └── playwright_template.spec.ts.j2 ← TypeScript/Playwright template
│   └── cli.py                   ← Typer-based CLI interface (testgen command)
├── tests/
│   └── test_openapi_parser.py   ← 12 tests validating parser correctness
├── specs/
│   └── petstore-sample.yaml     ← Sample OpenAPI 3.0 spec for testing
├── output/                      ← Generated test files land here
└── pyproject.toml               ← Project config, dependencies, CLI entry point
```

---

## Design Principles

### 1. Parser → LLM → Template Hybrid Pipeline

**What:** Instead of sending the raw spec to the LLM, we parse it first, then use templates to structure the output.

**Why:**
- **Raw spec to LLM** → inconsistent output, wasted tokens on irrelevant spec sections, different format every run
- **Parser + LLM + Template** → clean input, focused generation, consistent output structure

The parser is the unsung hero. It determines test quality more than the model choice.

### 2. Structured Extraction (EndpointInfo Dataclass)

**What:** The parser converts each endpoint to an `EndpointInfo` dataclass with typed fields.

**Why:** Structured data = structured prompts = structured output. If you send a blob of YAML to an LLM, you get a blob back. If you send "method: GET, path: /users/{id}, parameters: [{name: id, in: path, required: true}]", you get targeted test code.

### 3. $ref Resolution

**What:** OpenAPI specs use `$ref` pointers (`$ref: '#/components/schemas/Pet'`) to avoid repetition. The parser resolves these to actual schemas.

**Why:** LLMs can't follow `$ref` links. If you pass `request_body: {$ref: '#/components/schemas/Pet'}` to Claude, it doesn't know what Pet looks like. The parser inlines the actual schema.

### 4. Framework-Specific System Prompts

**What:** Each target framework (Rest Assured, pytest, Playwright) has a tailored system prompt that specifies language, imports, and patterns.

**Why:** A generic "write tests" prompt produces generic output. A prompt that says "Use Java 17, Rest Assured, @DataProvider for parametrized tests, Allure annotations" produces code that matches your actual framework.

### 5. Template + LLM Separation

**What:** Templates handle imports, class structure, and boilerplate. LLM handles test scenarios, assertions, and edge cases.

**Why:** LLMs are creative but inconsistent. Templates are consistent but not creative. Combining them gives you both: the same import block every time (template) + unique edge cases each generation (LLM).

---

## How to Extend

### Support a new output framework

1. Create `src/templates/karate_template.feature.j2`
2. Add to `template_map` in `template_renderer.py`
3. Add framework details to `_get_system_prompt()` in `test_generator.py`
4. Run: `testgen generate --spec spec.yaml --framework karate`

### Parse a real-world spec

Download any OpenAPI spec (most APIs publish them) and point the tool at it:
```bash
testgen parse --spec path/to/real-api-spec.yaml
testgen generate --spec path/to/real-api-spec.yaml --framework pytest
```

### Add test quality validation

After generation, run the output through a linter or compiler to verify it's valid:
- Java: `javac` compilation check
- Python: `py_compile` module
- TypeScript: `tsc --noEmit`

### Add batch generation

Process multiple specs in a directory:
```bash
for spec in specs/*.yaml; do
    testgen generate --spec "$spec" --framework rest-assured
done
```

---

## Learning Resources

### OpenAPI / Swagger
- [OpenAPI 3.0 Specification](https://swagger.io/specification/) — The spec that specs describe
- [Swagger Editor](https://editor.swagger.io/) — Visual spec editing and validation
- [OpenAPI Guide](https://learn.openapis.org/) — Comprehensive learning path

### Claude API / Anthropic SDK
- [Anthropic Python SDK](https://docs.anthropic.com/en/docs/initial-setup) — Getting started
- [Claude API Messages](https://docs.anthropic.com/en/api/messages) — API reference
- [Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — Writing effective prompts

### Python CLI Tools
- [Typer Documentation](https://typer.tiangolo.com/) — CLI framework used in this project
- [Rich Library](https://rich.readthedocs.io/) — Beautiful terminal output (tables, colors)

### Jinja2 Templating
- [Jinja2 Documentation](https://jinja.palletsprojects.com/) — Template syntax reference
- [Jinja2 Template Designer](https://jinja.palletsprojects.com/en/3.1.x/templates/) — Variables, filters, control flow

### Interview Prep
- "How would you use AI in test automation?" → Describe this pipeline: parse spec → extract structure → prompt LLM with context → template output → human review
- "What are the limitations?" → LLM output needs review (may not compile), doesn't understand business logic, costs money per API call, works best for boilerplate not complex scenarios
- "Why not just use ChatGPT directly?" → No consistency, no integration with CI, no structured input, no version control of prompts
