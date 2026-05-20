"""Edge-case and regression tests for /api/tasks (KAN-18, added by Tester)."""

from fastapi.testclient import TestClient


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Auth / access control
# ---------------------------------------------------------------------------


def test_create_task_unauthenticated_returns_401(client: TestClient) -> None:
    # Arrange — no auth header
    # Act
    resp = client.post("/api/tasks", json={"title": "Secret"})
    # Assert
    assert resp.status_code in (401, 403)


def test_list_tasks_unauthenticated_returns_401(client: TestClient) -> None:
    # Arrange — no auth header
    # Act
    resp = client.get("/api/tasks")
    # Assert
    assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Validation — title boundary values
# ---------------------------------------------------------------------------


def test_create_task_empty_title_returns_422(client: TestClient, token: str) -> None:
    # Arrange — empty string violates min_length=1
    # Act
    resp = client.post(
        "/api/tasks",
        json={"title": ""},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 422


def test_create_task_title_too_long_returns_422(client: TestClient, token: str) -> None:
    # Arrange — 201 chars exceeds max_length=200
    long_title = "x" * 201
    # Act
    resp = client.post(
        "/api/tasks",
        json={"title": long_title},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 422


def test_create_task_title_at_max_length_succeeds(client: TestClient, token: str) -> None:
    # Arrange — exactly 200 chars is the boundary that must succeed
    boundary_title = "a" * 200
    # Act
    resp = client.post(
        "/api/tasks",
        json={"title": boundary_title},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 201
    assert resp.json()["title"] == boundary_title


# ---------------------------------------------------------------------------
# Description edge cases
# ---------------------------------------------------------------------------


def test_create_task_with_explicit_null_description(client: TestClient, token: str) -> None:
    # Arrange — passing null explicitly is equivalent to omitting the field
    # Act
    resp = client.post(
        "/api/tasks",
        json={"title": "Null Explicit", "description": None},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 201
    assert resp.json()["description"] is None


def test_create_task_with_unicode_description(client: TestClient, token: str) -> None:
    # Arrange — description contains multi-byte Unicode and newlines
    emoji_desc = "Buy groceries 🛒\nMilk, eggs & Ünïcödé cheese"
    # Act
    resp = client.post(
        "/api/tasks",
        json={"title": "Unicode Task", "description": emoji_desc},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 201
    assert resp.json()["description"] == emoji_desc


def test_create_task_with_very_long_description(client: TestClient, token: str) -> None:
    # Arrange — spec says no max length at domain level; 10k chars must be accepted
    long_desc = "x" * 10_000
    # Act
    resp = client.post(
        "/api/tasks",
        json={"title": "Long Desc", "description": long_desc},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 201
    assert resp.json()["description"] == long_desc


def test_list_tasks_includes_description_field(client: TestClient, token: str) -> None:
    # Arrange — create one task with a description
    client.post(
        "/api/tasks",
        json={"title": "Listed Task", "description": "desc in list"},
        headers=auth(token),
    )
    # Act
    resp = client.get("/api/tasks", headers=auth(token))
    # Assert — list response must include description even when populated
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["description"] == "desc in list"


# ---------------------------------------------------------------------------
# PATCH semantics
# ---------------------------------------------------------------------------


def test_patch_empty_body_preserves_all_fields(client: TestClient, token: str) -> None:
    # Arrange — create a task with title and description
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Stable Task", "description": "stable"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    # Act — empty PATCH body should not mutate any field
    patch_resp = client.patch(
        f"/api/tasks/{task_id}",
        json={},
        headers=auth(token),
    )
    # Assert
    assert patch_resp.status_code == 200
    body = patch_resp.json()
    assert body["title"] == "Stable Task"
    assert body["description"] == "stable"


def test_patch_null_title_preserves_existing_title(client: TestClient, token: str) -> None:
    # Arrange — title cannot be cleared; null title must be dropped silently
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Original Title"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    # Act
    patch_resp = client.patch(
        f"/api/tasks/{task_id}",
        json={"title": None},
        headers=auth(token),
    )
    # Assert
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Original Title"


def test_patch_nonexistent_task_returns_404(client: TestClient, token: str) -> None:
    # Arrange — no task with this ID exists
    # Act
    resp = client.patch(
        "/api/tasks/9999",
        json={"description": "ghost"},
        headers=auth(token),
    )
    # Assert
    assert resp.status_code == 404


def test_patch_same_description_twice_is_idempotent(client: TestClient, token: str) -> None:
    # Arrange
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Idem Task"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    payload = {"description": "stable value"}
    # Act — same PATCH applied twice
    first = client.patch(f"/api/tasks/{task_id}", json=payload, headers=auth(token))
    second = client.patch(f"/api/tasks/{task_id}", json=payload, headers=auth(token))
    # Assert — both succeed and the field value is unchanged
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["description"] == second.json()["description"] == "stable value"


# ---------------------------------------------------------------------------
# DELETE endpoint
# ---------------------------------------------------------------------------


def test_delete_task_returns_204(client: TestClient, token: str) -> None:
    # Arrange
    create_resp = client.post(
        "/api/tasks",
        json={"title": "To Delete"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    # Act
    delete_resp = client.delete(f"/api/tasks/{task_id}", headers=auth(token))
    # Assert
    assert delete_resp.status_code == 204


def test_delete_task_then_get_returns_404(client: TestClient, token: str) -> None:
    # Arrange — create and delete a task
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Gone"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    client.delete(f"/api/tasks/{task_id}", headers=auth(token))
    # Act — subsequent GET must 404
    get_resp = client.get(f"/api/tasks/{task_id}", headers=auth(token))
    # Assert
    assert get_resp.status_code == 404


def test_delete_nonexistent_task_returns_404(client: TestClient, token: str) -> None:
    # Arrange — no task with this ID
    # Act
    resp = client.delete("/api/tasks/9999", headers=auth(token))
    # Assert
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Response shape — backwards-compatibility pin
# ---------------------------------------------------------------------------


def test_create_task_response_shape_includes_all_spec_fields(
    client: TestClient, token: str
) -> None:
    # Arrange & Act
    resp = client.post(
        "/api/tasks",
        json={"title": "Shape Check", "description": "check me"},
        headers=auth(token),
    )
    # Assert — every field the spec requires in the response must be present
    body = resp.json()
    assert resp.status_code == 201
    for required_key in ("id", "title", "description", "created_at", "updated_at"):
        assert required_key in body, f"Missing field: {required_key}"
