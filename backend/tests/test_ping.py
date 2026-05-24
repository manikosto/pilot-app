"""Tests for GET /ping — spec KAN-35."""

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Spec-required scenarios
# ---------------------------------------------------------------------------


def test_ping_returns_http_200(client: TestClient) -> None:
    # Arrange: no auth, plain GET
    # Act
    response = client.get("/ping")
    # Assert
    assert response.status_code == 200


def test_ping_response_body_equals_status_ok(client: TestClient) -> None:
    # Arrange: no auth, plain GET
    # Act
    response = client.get("/ping")
    # Assert
    assert response.json() == {"status": "ok"}


def test_ping_requires_no_authorization_header(client: TestClient) -> None:
    # Arrange: explicitly omit Authorization
    # Act
    response = client.get("/ping", headers={})
    # Assert: must succeed without a token
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Edge / regression cases
# ---------------------------------------------------------------------------


def test_ping_content_type_is_json(client: TestClient) -> None:
    # Arrange
    # Act
    response = client.get("/ping")
    # Assert: contract pins JSON media type
    assert "application/json" in response.headers["content-type"]


def test_ping_with_invalid_bearer_token_still_returns_200(client: TestClient) -> None:
    # Arrange: simulate a client that accidentally sends a stale token
    headers = {"Authorization": "Bearer totally-invalid-token"}
    # Act
    response = client.get("/ping", headers=headers)
    # Assert: /ping is public — bad token must not block it
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ping_post_method_not_allowed(client: TestClient) -> None:
    # Arrange
    # Act
    response = client.post("/ping")
    # Assert: only GET is registered
    assert response.status_code == 405


def test_ping_response_has_exactly_one_key(client: TestClient) -> None:
    # Arrange: guard against accidentally widening the response shape
    # Act
    body = client.get("/ping").json()
    # Assert
    assert set(body.keys()) == {"status"}


def test_ping_status_value_is_string_ok(client: TestClient) -> None:
    # Arrange: pin value type — not a boolean True or integer
    # Act
    body = client.get("/ping").json()
    # Assert
    assert body["status"] == "ok"
    assert isinstance(body["status"], str)


# ---------------------------------------------------------------------------
# Regression: pre-existing /healthz must still work after adding /ping
# ---------------------------------------------------------------------------


def test_healthz_still_returns_200_after_ping_added(client: TestClient) -> None:
    # Arrange
    # Act
    response = client.get("/healthz")
    # Assert
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
