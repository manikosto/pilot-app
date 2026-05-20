# Agent Notes — KAN-15

## Skipped test scenario: unauthenticated → 401

The spec lists "unauthenticated GET /api/users/me → 401" as a test scenario, but the current backend has no authentication mechanism — `GET /api/users/me` returns `SEED_USERS[0]` unconditionally without inspecting any token or session. The spec explicitly states "authentication behavior remains unchanged," so no auth was added. This test scenario requires a follow-on ticket to implement token validation before it can be written.

## Frontend: no changes required

The frontend (`frontend/src/app/login/page.tsx`) calls `/api/auth/login` only; it never calls `/api/users/me` and does not read `name` or `email` from a `/me` response. No frontend files were modified.
