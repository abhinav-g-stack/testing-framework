"""
Tests for the OpenAPI parser.

RUN: pytest tests/ -v

These tests verify that the parser correctly extracts endpoint information
from OpenAPI specs. We test against the sample petstore spec included in
the project.

WHY test the parser separately from the generator:
- Parser bugs = wrong data sent to LLM = wrong generated tests
- Parser is pure logic (no API calls) → fast, deterministic tests
- Generator depends on LLM API (slow, costs money) → test separately
"""

import pytest
from pathlib import Path
from src.parser.openapi_parser import parse_spec, EndpointInfo


SAMPLE_SPEC = str(Path(__file__).parent.parent / "specs" / "petstore-sample.yaml")


class TestParseSpec:
    """Tests for the main parse_spec function."""

    def test_parses_correct_number_of_endpoints(self):
        """Petstore sample has 5 endpoint-method combinations."""
        endpoints = parse_spec(SAMPLE_SPEC)
        assert len(endpoints) == 5

    def test_extracts_http_methods(self):
        """Should find POST, GET, DELETE methods."""
        endpoints = parse_spec(SAMPLE_SPEC)
        methods = {ep.method for ep in endpoints}
        assert "GET" in methods
        assert "POST" in methods
        assert "DELETE" in methods

    def test_extracts_paths(self):
        """Should find all paths from the spec."""
        endpoints = parse_spec(SAMPLE_SPEC)
        paths = {ep.path for ep in endpoints}
        assert "/pet" in paths
        assert "/pet/{petId}" in paths
        assert "/pet/findByStatus" in paths
        assert "/user" in paths
        assert "/user/{username}" in paths

    def test_extracts_operation_ids(self):
        """Each endpoint should have an operationId."""
        endpoints = parse_spec(SAMPLE_SPEC)
        operation_ids = {ep.operation_id for ep in endpoints}
        assert "addPet" in operation_ids
        assert "getPetById" in operation_ids
        assert "deletePet" in operation_ids

    def test_extracts_path_parameters(self):
        """GET /pet/{petId} should have a petId path parameter."""
        endpoints = parse_spec(SAMPLE_SPEC)
        get_pet = next(ep for ep in endpoints if ep.path == "/pet/{petId}" and ep.method == "GET")

        assert len(get_pet.parameters) == 1
        assert get_pet.parameters[0]["name"] == "petId"
        assert get_pet.parameters[0]["in"] == "path"
        assert get_pet.parameters[0]["required"] is True

    def test_extracts_query_parameters(self):
        """GET /pet/findByStatus should have a status query parameter."""
        endpoints = parse_spec(SAMPLE_SPEC)
        find_by_status = next(ep for ep in endpoints if ep.path == "/pet/findByStatus")

        assert len(find_by_status.parameters) == 1
        assert find_by_status.parameters[0]["name"] == "status"
        assert find_by_status.parameters[0]["in"] == "query"

    def test_extracts_request_body_schema(self):
        """POST /pet should have a request body schema with required fields."""
        endpoints = parse_spec(SAMPLE_SPEC)
        add_pet = next(ep for ep in endpoints if ep.path == "/pet" and ep.method == "POST")

        assert add_pet.request_body_schema is not None
        assert "properties" in add_pet.request_body_schema
        assert "name" in add_pet.request_body_schema["properties"]
        assert "required" in add_pet.request_body_schema
        assert "name" in add_pet.request_body_schema["required"]

    def test_extracts_response_schemas(self):
        """GET /pet/{petId} should have 200 and 404 response schemas."""
        endpoints = parse_spec(SAMPLE_SPEC)
        get_pet = next(ep for ep in endpoints if ep.path == "/pet/{petId}" and ep.method == "GET")

        assert "200" in get_pet.response_schemas
        assert get_pet.response_schemas["200"]["type"] == "object"

    def test_resolves_refs(self):
        """$ref references should be resolved to actual schemas."""
        endpoints = parse_spec(SAMPLE_SPEC)
        add_pet = next(ep for ep in endpoints if ep.path == "/pet" and ep.method == "POST")

        # The request body references #/components/schemas/Pet via $ref
        # Parser should resolve it to the actual Pet schema
        schema = add_pet.request_body_schema
        assert "properties" in schema
        assert "id" in schema["properties"]
        assert "name" in schema["properties"]
        assert "status" in schema["properties"]

    def test_extracts_tags(self):
        """Endpoints should have their tags extracted."""
        endpoints = parse_spec(SAMPLE_SPEC)
        pet_endpoints = [ep for ep in endpoints if "pet" in ep.tags]
        user_endpoints = [ep for ep in endpoints if "user" in ep.tags]

        assert len(pet_endpoints) == 4   # addPet, getPetById, deletePet, findByStatus
        assert len(user_endpoints) == 2  # createUser, getUserByName

    def test_endpoint_without_body_has_none(self):
        """GET endpoints should have request_body_schema = None."""
        endpoints = parse_spec(SAMPLE_SPEC)
        get_pet = next(ep for ep in endpoints if ep.path == "/pet/{petId}" and ep.method == "GET")
        assert get_pet.request_body_schema is None


class TestEdgeCases:
    """Tests for parser edge cases and error handling."""

    def test_nonexistent_file_raises_error(self):
        """Should raise an error for a file that doesn't exist."""
        with pytest.raises(Exception):
            parse_spec("/nonexistent/path/spec.yaml")

    def test_endpoints_are_correct_type(self):
        """All returned items should be EndpointInfo dataclass instances."""
        endpoints = parse_spec(SAMPLE_SPEC)
        for ep in endpoints:
            assert isinstance(ep, EndpointInfo)
            assert isinstance(ep.path, str)
            assert isinstance(ep.method, str)
            assert isinstance(ep.parameters, list)
