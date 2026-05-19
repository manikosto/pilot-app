# pilot-app

Minimal Next.js + FastAPI demo used as the target codebase for the
AgentPipeline Coder agent. Real features in this repo get implemented by the
agent from approved Jira specs.

## Layout

```
pilot-app/
├── README.md
├── frontend/                # Next.js 15 (App Router)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── postcss.config.mjs
│   └── src/
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx
│           └── globals.css
└── backend/                 # FastAPI
    ├── pyproject.toml
    └── src/app/
        ├── __init__.py
        ├── main.py          # POST /api/auth/login, GET /api/users/me
        └── models.py
```

## Run locally

```bash
# backend
cd backend && python3.12 -m venv .venv && .venv/bin/pip install -e .
.venv/bin/uvicorn app.main:app --reload --port 8001

# frontend (separate terminal)
cd frontend && npm install && npm run dev
# → http://localhost:3010
```

## Pipeline integration

This repo is wired to project `kan` in the Agent Pipeline:

- `JIRA_AI_LABEL=ai-pipeline` → triggers Planner.
- Approving the spec (`spec-approved` label) triggers the Coder agent, which
  works on this repo and opens a draft PR to `main`.
