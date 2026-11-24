"""Versioned API router. Add feature routers here (see docs/API_SPECIFICATION.md)."""

from fastapi import APIRouter

from app import __version__

router = APIRouter(prefix="/api/v1")


@router.get("/meta", tags=["meta"])
def meta() -> dict[str, str]:
    """Basic service info the frontend can use to confirm it reached the right API."""
    return {"service": "abhimanyu-api", "version": __version__}
