"""
OpenAPI/Swagger Spec Parser

Extracts endpoint information from OpenAPI 3.x specs that the LLM needs
to generate meaningful test cases.

Architecture:
  Raw Spec (JSON/YAML) → Parser → EndpointInfo objects → LLM Prompt → Test Code

Why a dedicated parser instead of sending the raw spec to the LLM?
1. Raw specs are huge — most of it is irrelevant to test generation
2. Structured extraction = consistent LLM prompts = consistent output
3. You can add validation (missing schemas, undocumented responses) before generation
"""

import json
import yaml
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class EndpointInfo:
    """Structured representation of a single API endpoint for test generation."""
    path: str
    method: str  # GET, POST, PUT, DELETE, PATCH
    operation_id: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    parameters: list[dict] = field(default_factory=list)
    request_body_schema: Optional[dict] = None
    response_schemas: dict[str, dict] = field(default_factory=dict)  # status_code → schema
    tags: list[str] = field(default_factory=list)
    security: list[dict] = field(default_factory=list)


def parse_spec(spec_path: str) -> list[EndpointInfo]:
    """
    Parse an OpenAPI spec file and extract endpoint information.

    Supports both JSON and YAML formats.
    Returns a list of EndpointInfo objects ready for test generation.
    """
    path = Path(spec_path)
    content = path.read_text()

    if path.suffix in ('.yaml', '.yml'):
        spec = yaml.safe_load(content)
    else:
        spec = json.loads(content)

    endpoints = []

    paths = spec.get('paths', {})
    for path_str, path_item in paths.items():
        for method in ('get', 'post', 'put', 'delete', 'patch'):
            operation = path_item.get(method)
            if not operation:
                continue

            endpoint = EndpointInfo(
                path=path_str,
                method=method.upper(),
                operation_id=operation.get('operationId'),
                summary=operation.get('summary'),
                description=operation.get('description'),
                parameters=_extract_parameters(operation, path_item),
                request_body_schema=_extract_request_body(operation, spec),
                response_schemas=_extract_responses(operation, spec),
                tags=operation.get('tags', []),
                security=operation.get('security', spec.get('security', [])),
            )
            endpoints.append(endpoint)

    return endpoints


def _extract_parameters(operation: dict, path_item: dict) -> list[dict]:
    """Merge path-level and operation-level parameters."""
    params = path_item.get('parameters', []) + operation.get('parameters', [])
    return [
        {
            'name': p.get('name'),
            'in': p.get('in'),  # path, query, header, cookie
            'required': p.get('required', False),
            'schema': p.get('schema', {}),
        }
        for p in params
    ]


def _extract_request_body(operation: dict, spec: dict) -> Optional[dict]:
    """Extract request body schema, resolving $ref if needed."""
    body = operation.get('requestBody', {})
    content = body.get('content', {})
    json_content = content.get('application/json', {})
    schema = json_content.get('schema', {})
    return _resolve_ref(schema, spec) if schema else None


def _extract_responses(operation: dict, spec: dict) -> dict[str, dict]:
    """Extract response schemas by status code."""
    responses = {}
    for status, response in operation.get('responses', {}).items():
        content = response.get('content', {})
        json_content = content.get('application/json', {})
        schema = json_content.get('schema', {})
        if schema:
            responses[status] = _resolve_ref(schema, spec)
    return responses


def _resolve_ref(schema: dict, spec: dict) -> dict:
    """Resolve a $ref pointer to its actual schema definition."""
    ref = schema.get('$ref')
    if not ref:
        return schema

    # $ref format: "#/components/schemas/User"
    parts = ref.lstrip('#/').split('/')
    resolved = spec
    for part in parts:
        resolved = resolved.get(part, {})
    return resolved
