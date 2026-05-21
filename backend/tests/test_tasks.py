"""Happy-path and edge-case tests for the /api/tasks endpoints."""

from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Happy Path
# ---------------------------------------------------------------------------


def test_list_tasks_returns_paginated_structure(client: TestClient, auth_headers: dict):
    resp = client.get("/api/tasks", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)
    assert data["total"] == 0  # store was cleared by fixture


def test_create_task_valid_title(client: TestClient, auth_headers: dict):
    resp = client.post("/api/tasks", json={"title": "My first task"}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My first task"
    assert data["status"] == "todo"
    assert data["priority"] == "medium"
    assert data["description"] is None
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_get_task_existing_id(client: TestClient, auth_headers: dict):
    created = client.post(
        "/api/tasks", json={"title": "Get me"}, headers=auth_headers
    ).json()
    resp = client.get(f"/api/tasks/{created['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]
    assert resp.json()["title"] == "Get me"


def test_update_task_status_to_done(client: TestClient, auth_headers: dict):
    created = client.post(
        "/api/tasks", json={"title": "Update me"}, headers=auth_headers
    ).json()
    resp = client.patch(
        f"/api/tasks/{created['id']}", json={"status": "done"}, headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert data["updated_at"] >= created["updated_at"]


def test_delete_task_and_subsequent_get_returns_404(client: TestClient, auth_headers: dict):
    created = client.post(
        "/api/tasks", json={"title": "Delete me"}, headers=auth_headers
    ).json()
    del_resp = client.delete(f"/api/tasks/{created['id']}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = client.get(f"/api/tasks/{created['id']}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_list_tasks_total_reflects_created_count(client: TestClient, auth_headers: dict):
    client.post("/api/tasks", json={"title": "T1"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "T2"}, headers=auth_headers)
    resp = client.get("/api/tasks", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


# ---------------------------------------------------------------------------
# Edge Cases
# ---------------------------------------------------------------------------


def test_create_task_missing_title_returns_422(client: TestClient, auth_headers: dict):
    resp = client.post("/api/tasks", json={}, headers=auth_headers)
    assert resp.status_code == 422


def test_create_task_empty_title_returns_422(client: TestClient, auth_headers: dict):
    resp = client.post("/api/tasks", json={"title": ""}, headers=auth_headers)
    assert resp.status_code == 422


def test_get_nonexistent_task_returns_404(client: TestClient, auth_headers: dict):
    resp = client.get("/api/tasks/nonexistent-id-xyz", headers=auth_headers)
    assert resp.status_code == 404


def test_update_task_invalid_status_returns_422(client: TestClient, auth_headers: dict):
    created = client.post(
        "/api/tasks", json={"title": "Invalid status test"}, headers=auth_headers
    ).json()
    resp = client.patch(
        f"/api/tasks/{created['id']}", json={"status": "invalid_status"}, headers=auth_headers
    )
    assert resp.status_code == 422


def test_delete_nonexistent_task_returns_404(client: TestClient, auth_headers: dict):
    resp = client.delete("/api/tasks/nonexistent-id-xyz", headers=auth_headers)
    assert resp.status_code == 404


def test_list_tasks_invalid_status_filter_returns_422(client: TestClient, auth_headers: dict):
    resp = client.get("/api/tasks?status=invalid_value", headers=auth_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Filtering and Sorting
# ---------------------------------------------------------------------------


def test_filter_by_status_todo(client: TestClient, auth_headers: dict):
    client.post("/api/tasks", json={"title": "Todo task", "status": "todo"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "Done task", "status": "done"}, headers=auth_headers)
    resp = client.get("/api/tasks?status=todo", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert all(t["status"] == "todo" for t in items)


def test_filter_by_priority_high_sort_created_at_asc(client: TestClient, auth_headers: dict):
    client.post("/api/tasks", json={"title": "High 1", "priority": "high"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "High 2", "priority": "high"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "Low task", "priority": "low"}, headers=auth_headers)
    resp = client.get(
        "/api/tasks?priority=high&sort_by=created_at&order=asc", headers=auth_headers
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 2
    assert all(t["priority"] == "high" for t in items)
    assert items[0]["created_at"] <= items[1]["created_at"]


def test_sort_by_priority_desc(client: TestClient, auth_headers: dict):
    client.post("/api/tasks", json={"title": "Low", "priority": "low"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "High", "priority": "high"}, headers=auth_headers)
    client.post("/api/tasks", json={"title": "Med", "priority": "medium"}, headers=auth_headers)
    resp = client.get("/api/tasks?sort_by=priority&order=desc", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    priorities = [t["priority"] for t in items]
    assert priorities == ["high", "medium", "low"]


def test_pagination(client: TestClient, auth_headers: dict):
    for i in range(5):
        client.post("/api/tasks", json={"title": f"Task {i}"}, headers=auth_headers)
    resp = client.get("/api/tasks?page=1&page_size=3", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["page_size"] == 3


def test_unauthenticated_request_returns_401(client: TestClient):
    resp = client.get("/api/tasks")
    assert resp.status_code == 401
