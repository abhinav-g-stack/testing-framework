"""
Template Renderer — Combines Jinja2 templates with LLM-generated content.

HOW THIS FITS IN THE ARCHITECTURE:

  OpenAPI Spec
       ↓
  parser/openapi_parser.py  →  List[EndpointInfo]
       ↓
  generator/test_generator.py  →  LLM generates test methods (raw code)
       ↓
  generator/template_renderer.py  →  Wraps LLM output in template (this file)
       ↓
  Complete, compilable test file

WHY separate rendering from generation:
- test_generator.py handles LLM interaction (prompts, API calls)
- template_renderer.py handles file structure (imports, class wrapping)
- You can swap LLMs without changing templates
- You can add new output frameworks by adding templates, not code
"""

from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

from ..parser.openapi_parser import EndpointInfo

# Templates directory (relative to this file)
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def render_test_file(
    endpoints: list[EndpointInfo],
    test_methods: str,
    framework: str = "rest-assured",
    spec_name: str = "unknown",
    data_providers: str = "",
) -> str:
    """
    Render a complete test file by combining template + LLM-generated content.

    Args:
        endpoints: Parsed endpoint info (for template header comments)
        test_methods: LLM-generated test method code
        framework: Target framework (determines which template to use)
        spec_name: Name of the source spec file (for header comment)
        data_providers: LLM-generated data provider methods (Java only)

    Returns:
        Complete, ready-to-save test file content
    """
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    template_map = {
        "rest-assured": "rest_assured.java.j2",
        "pytest": "pytest_template.py.j2",
        "playwright": "playwright_template.spec.ts.j2",
    }

    template_name = template_map.get(framework)
    if not template_name:
        raise ValueError(f"No template for framework: {framework}. Available: {list(template_map.keys())}")

    template = env.get_template(template_name)

    # Derive class name from spec name
    class_name = _spec_to_class_name(spec_name)

    # Derive base URL from first endpoint's server or use placeholder
    base_url = "https://api.example.com"  # Override from spec's servers section

    return template.render(
        class_name=class_name,
        spec_name=spec_name,
        timestamp=datetime.now().isoformat(),
        endpoints=endpoints,
        test_methods=test_methods,
        data_providers=data_providers,
        base_url=base_url,
        epic_name=f"{class_name} API",
        feature_name=f"Generated from {spec_name}",
    )


def _spec_to_class_name(spec_name: str) -> str:
    """
    Convert a spec filename to a Java class name.
    'petstore-sample.yaml' → 'PetstoreSampleApiTest'
    """
    name = Path(spec_name).stem  # Remove extension
    parts = name.replace("-", " ").replace("_", " ").split()
    pascal = "".join(word.capitalize() for word in parts)
    return f"{pascal}ApiTest"
