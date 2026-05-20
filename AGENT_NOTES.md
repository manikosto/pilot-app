# Agent Notes — KAN-18

## Database migration (Alembic) not applicable

The spec references an Alembic migration file. This project uses an in-memory
store (plain Python dicts + Pydantic models) with no SQLAlchemy or Alembic
setup. The Task model — including the `description: TEXT` column — was added
directly to `backend/src/app/models.py` and wired into the in-memory state
in `backend/src/app/main.py`. No migration file is needed or applicable for
this stack.

If the project is later migrated to a real database, a migration adding
`ALTER TABLE tasks ADD COLUMN description TEXT;` (or an Alembic equivalent)
will be needed at that point.

## Frontend test framework added (Vitest)

No test framework was present in the frontend. Vitest + @testing-library/react
were introduced to support the spec-required component tests. This is the only
new framework added.
