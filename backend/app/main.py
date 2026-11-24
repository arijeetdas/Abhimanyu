"""FastAPI entry point.

Run locally from the repo root:  ./dev run backend
Or manually from backend/:       uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1 import router as v1_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Abhimanyu API",
    version=__version__,
    description="AI-powered forensic intelligence for the Indian stock market.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    """Public health check (docs/API_SPECIFICATION.md section 12)."""
    return {"status": "ok", "version": __version__}


app.include_router(v1_router)
