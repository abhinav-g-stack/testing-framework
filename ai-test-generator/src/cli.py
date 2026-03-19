"""
CLI interface for the AI Test Generator.

Usage:
    testgen generate --spec petstore.yaml --framework rest-assured --output tests/
    testgen parse --spec petstore.yaml  (preview parsed endpoints)

Built with Typer for rich CLI experience (auto-help, autocompletion, colors).
"""

import typer
from rich.console import Console
from rich.table import Table
from pathlib import Path

from .parser.openapi_parser import parse_spec
from .generator.test_generator import generate_tests

app = typer.Typer(
    name="testgen",
    help="AI-powered test case generator from OpenAPI/Swagger specs",
)
console = Console()


@app.command()
def generate(
    spec: str = typer.Option(..., help="Path to OpenAPI spec file (JSON or YAML)"),
    framework: str = typer.Option("rest-assured", help="Target framework: rest-assured, pytest, playwright"),
    output: str = typer.Option("output/", help="Output directory for generated tests"),
    model: str = typer.Option("claude-sonnet-4-20250514", help="Claude model to use"),
):
    """Generate test code from an OpenAPI spec using Claude AI."""
    console.print(f"[bold blue]Parsing spec:[/] {spec}")
    endpoints = parse_spec(spec)
    console.print(f"[green]Found {len(endpoints)} endpoints[/]")

    console.print(f"[bold blue]Generating {framework} tests using {model}...[/]")
    test_code = generate_tests(endpoints, framework, model)

    output_path = Path(output)
    output_path.mkdir(parents=True, exist_ok=True)

    ext = {"rest-assured": ".java", "pytest": ".py", "playwright": ".spec.ts"}
    filename = f"GeneratedApiTests{ext.get(framework, '.txt')}"
    file_path = output_path / filename

    file_path.write_text(test_code)
    console.print(f"[bold green]Tests written to:[/] {file_path}")


@app.command()
def parse(
    spec: str = typer.Option(..., help="Path to OpenAPI spec file"),
):
    """Preview parsed endpoints from an OpenAPI spec (no generation)."""
    endpoints = parse_spec(spec)

    table = Table(title=f"Endpoints from {spec}")
    table.add_column("Method", style="cyan")
    table.add_column("Path", style="green")
    table.add_column("Summary")
    table.add_column("Params", justify="right")
    table.add_column("Has Body", justify="center")

    for ep in endpoints:
        table.add_row(
            ep.method,
            ep.path,
            ep.summary or "—",
            str(len(ep.parameters)),
            "Yes" if ep.request_body_schema else "No",
        )

    console.print(table)


if __name__ == "__main__":
    app()
