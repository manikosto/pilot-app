"""Tester-added edge-case and regression tests for /api/tasks endpoints."""

from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Spec coverage: invalid priority enum → 422
# ---------------------------------------------------------------------------


def test_create_task_invalid_priority_returns_422(client: TestClient, auth_headers: dict):
    # Arrange
    payload = {"title": "Valid title", "priority": "critical"}
    # Act
    resp = client.post("/api/tasks", json=payload, headers=auth_headers)
    # Assert
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# PATCH — partial update / field-level verification
# ---------------------------------------------------------------------------


def test_patch_task_updates_title_and_description(client: TestClient, auth_headers: dict):
    # Arrange
    created = client.post(
        "/api/tasks",
        json={"title": "Original title", "description": "Original desc"},
        headers=auth_headers,
    ).json()
    # Act
    resp = client.patch(
        f"/api/tasks/{created['id']}",
        json={"title": "Updated title", "description": "New desc"},
        headers=auth_headers,
    )
    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated title"
    assert data["description"] == "New desc"


def test_patch_task_preserves_unset_fields(client: TestClient, auth_headers: dict):
    # Arrange — create task with high priority
    created = client.post(
        "/api/tasks",
        json={"title": "Keep priority", "priority": "high"},
        headers=auth_headers,
    ).json()
    # Act — patch only status, leave priority untouched
    resp = client.patch(
        f"/api/tasks/{created['id']}",
        json={"status": "done"},
        headers=auth_headers,
    )
    # Assert — priority must remain "high"
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert data["priority"] == "high"
    assert data["title"] == "Keep priority"


def test_patch_task_title_too_long_returns_422(client: TestClient, auth_headers: dict):
    # Arrange
    created = client.post(
        "/api/tasks", json={"title": "Short title"}, headers=auth_headers
    ).json()
    long_title = "x" * 501
    # Act
    resp = client.patch(
        f"/api/tasks/{created['id']}",
        json={"title": long_title},
        headers=auth_headers,
    )
    # Assert
    assert resp.status_code == 422


def test_patch_task_invalid_priority_returns_422(client: TestClient, auth_headers: dict):
    # Arrange
    created = client.post(
        "/api/tasks", json={"title": "Priority test"}, headers=auth_headers
    ).json()
    # Act
    resp = client.patch(
        f"/api/tasks/{created['id']}",
        json={"priority": "critical"},
        headers=auth_headers,
    )
    # Assert
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Boundary values — title length (max_length=500 in TaskCreate)
# ---------------------------------------------------------------------------


def test_create_task_title_at_max_length_succeeds(client: TestClient, auth_headers: dict):
    # Arrange — exactly 500 characters
    title_500 = "a" * 500
    # Act
    resp = client.post("/api/tasks", json={"title": title_500}, headers=auth_headers)
    # Assert
    assert resp.status_code == 201
    assert resp.json()["title"] == title_500


def test_create_task_title_exceeds_max_length_returns_422(client: TestClient, auth_headers: dict):
    # Arrange — 501 characters
    title_501 = "a" * 501
    # Act
    resp = client.post("/api/tasks", json={"title": title_501}, headers=auth_headers)
    # Assert
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Filtering — invalid priority filter → 422 (spec: invalid enum → 422)
# ---------------------------------------------------------------------------


def test_list_tasks_invalid_priority_filter_returns_422(client: TestClient, auth_headers: dict):
    # Arrange — no tasks needed
    # Act
    resp = client.get("/api/tasks?priority=invalid_priority", headers=auth_headers)
    # Assert
    assert resp.status_code == 422


def test_filter_by_in_progress_status(client: TestClient, auth_headers: dict):
    # Arrange
    client.post(
        "/api/tasks",
        json={"title": "WIP task", "status": "in_progress"},
        headers=auth_headers,
    )
    client.post("/api/tasks", json={"title": "Todo task", "status": "todo"}, headers=auth_headers)
    # Act
    resp = client.get("/api/tasks?status=in_progress", headers=auth_headers)
    # Assert — only the in_progress task returned
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "in_progress"


# ---------------------------------------------------------------------------
# Pagination — page 2 offset and out-of-range page
# ---------------------------------------------------------------------------


def test_pagination_page_2_returns_remaining_items(client: TestClient, auth_headers: dict):
    # Arrange — 5 tasks, page 2 of page_size=3 → 2 items
    for i in range(5):
        client.post("/api/tasks", json={"title": f"P2 Task {i}"}, headers=auth_headers)
    # Act
    resp = client.get("/api/tasks?page=2&page_size=3", headers=auth_headers)
    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 2
    assert data["page"] == 2


def test_pagination_page_beyond_total_returns_empty_list(client: TestClient, auth_headers: dict):
    # Arrange
    client.post("/api/tasks", json={"title": "Only task"}, headers=auth_headers)
    # Act
    resp = client.get("/api/tasks?page=99&page_size=10", headers=auth_headers)
    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"] == []


def test_pagination_invalid_page_zero_returns_422(client: TestClient, auth_headers: dict):
    # Arrange — page must be >= 1 (Query(ge=1))
    # Act
    resp = client.get("/api/tasks?page=0", headers=auth_headers)
    # Assert
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Sorting — ascending priority order
# ---------------------------------------------------------------------------


def test_sort_by_priority_asc(client: TestClient, auth_headers: dict):
    # Arrange
    client.post("/api/tasks", json={"title": "High", "priority": "high"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "Low", "priority": "low"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "Med", "priority": "medium"}, headers=auth_headers)
    # Act
    resp = client.get("/api/tasks?sort_by=priority&order=asc", headers=auth_headers)
    # Assert
    assert resp.status_code == 200
    priorities = [t["priority"] for t in resp.json()["items"]]
    assert priorities == ["low", "medium", "high"]


# ---------------------------------------------------------------------------
# Idempotency — deleting the same task twice
# ---------------------------------------------------------------------------


def test_delete_same_task_twice_second_call_returns_404(client: TestClient, auth_headers: dict):
    # Arrange
    created = client.post(
        "/api/tasks", json={"title": "Double delete"}, headers=auth_headers
    ).json()
    client.delete(f"/api/tasks/{created['id']}", headers=auth_headers)
    # Act — second delete
    resp = client.delete(f"/api/tasks/{created['id']}", headers=auth_headers)
    # Assert
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Backwards-compatibility — response schema contract
# ---------------------------------------------------------------------------


def test_task_response_includes_all_spec_fields(client: TestClient, auth_headers: dict):
    # Arrange
    resp = client.post(
        "/api/tasks",
        json={
            "title": "Contract test",
            "description": "desc",
            "priority": "low",
            "status": "in_progress",
        },
        headers=auth_headers,
    )
    # Assert — every field from the spec's Task schema must be present
    assert resp.status_code == 201
    data = resp.json()
    for field in ("id", "title", "description", "status", "priority", "assignee_id",
                  "created_at", "updated_at"):
        assert field in data, f"Missing required field in Task response: {field}"
    assert data["status"] == "in_progress"
    assert data["priority"] == "low"
    assert data["description"] == "desc"
    assert data["assignee_id"] is None
