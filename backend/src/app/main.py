"""FastAPI app for pilot-app — login + notes CRUD."""

from __future__ import annotations

import importlib.metadata
import secrets
import tomllib
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    LoginRequest,
    LoginResponse,
    Note,
    NoteCreate,
    NoteUpdate,
    SEED_NOTES,
    SEED_USERS,
    User,
)

def _resolve_version() -> str:
    try:
        return importlib.metadata.version("pilot-app")
    except importlib.metadata.PackageNotFoundError:
        pass

    toml_path = Path(__file__).parent.parent.parent / "pyproject.toml"
    with open(toml_path, "rb") as f:
        data = tomllib.load(f)

    version = data.get("project", {}).get("version") or data.get("tool", {}).get(
        "poetry", {}
    ).get("version")
    if not version:
        raise RuntimeError(
            "Could not resolve application version from pyproject.toml — "
            "ensure [project].version or [tool.poetry].version is set."
        )
    return version


APP_VERSION = _resolve_version()

app = FastAPI(title="pilot-app", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3010"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

_NOTES: dict[int, Note] = {n.id: n.model_copy() for n in SEED_NOTES}
_NEXT_NOTE_ID = max(_NOTES.keys(), default=0) + 1
_TOKENS: dict[str, int] = {}  # token → user_id


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _issue_token(user_id: int) -> str:
    token = f"demo-{user_id}-{secrets.token_hex(8)}"
    _TOKENS[token] = user_id
    return token


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------


def require_user(
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Extract the bearer token from the Authorization header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )
    token = authorization.split(" ", 1)[1].strip()
    user_id = _TOKENS.get(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    user = next((u for u in SEED_USERS if u.id == user_id), None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown user"
        )
    return user


CurrentUser = Annotated[User, Depends(require_user)]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/version")
async def get_version() -> dict[str, str]:
    return {"version": APP_VERSION, "name": "pilot-app"}


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    # Demo only: passwords aren't checked. Any user from SEED_USERS gets a
    # fresh session token.
    user = next((u for u in SEED_USERS if u.email == payload.email), None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    return LoginResponse(token=_issue_token(user.id), user=user)


@app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        _TOKENS.pop(token, None)


@app.get("/api/users/me", response_model=User)
async def me(user: CurrentUser) -> User:
    return user


@app.get("/api/notes", response_model=list[Note])
async def list_notes(user: CurrentUser) -> list[Note]:
    notes = [n for n in _NOTES.values() if n.user_id == user.id]
    notes.sort(key=lambda n: (not n.pinned, -n.updated_at.timestamp()))
    return notes


@app.post(
    "/api/notes",
    response_model=Note,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(payload: NoteCreate, user: CurrentUser) -> Note:
    global _NEXT_NOTE_ID
    note = Note(
        id=_NEXT_NOTE_ID,
        user_id=user.id,
        title=payload.title,
        body=payload.body,
        pinned=payload.pinned,
    )
    _NOTES[note.id] = note
    _NEXT_NOTE_ID += 1
    return note


@app.get("/api/notes/{note_id}", response_model=Note)
async def get_note(note_id: int, user: CurrentUser) -> Note:
    note = _NOTES.get(note_id)
    if note is None or note.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    return note


@app.put("/api/notes/{note_id}", response_model=Note)
async def update_note(
    note_id: int, payload: NoteUpdate, user: CurrentUser
) -> Note:
    note = _NOTES.get(note_id)
    if note is None or note.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    data = note.model_dump()
    for field in ("title", "body", "pinned"):
        value = getattr(payload, field)
        if value is not None:
            data[field] = value
    data["updated_at"] = _utcnow()
    updated = Note.model_validate(data)
    _NOTES[note_id] = updated
    return updated


@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: int, user: CurrentUser) -> None:
    note = _NOTES.get(note_id)
    if note is None or note.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    _NOTES.pop(note_id, None)
