# Abhimanyu backend

FastAPI service. See [docs/API_SPECIFICATION.md](../docs/API_SPECIFICATION.md) for the contract.

```bash
./dev run backend          # from the repo root (recommended)
# or manually, from backend/:
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
uv run pytest
uv run ruff check .
```

Interactive API docs: http://localhost:8000/docs
