"""FastAPI app for pilot-app."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import LoginRequest, LoginResponse, SEED_USERS, User

app = FastAPI(title="pilot-app", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3010"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    user = next((u for u in SEED_USERS if u.email == payload.email), None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    return LoginResponse(token="demo-token", user=user)


@app.get("/api/users/me", response_model=User)
async def me() -> User:
    return SEED_USERS[0]


@app.get("/api/users/count")
async def users_count() -> dict[str, int]:
    return {"count": len(SEED_USERS)}
