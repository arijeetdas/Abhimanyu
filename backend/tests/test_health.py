from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_meta() -> None:
    res = client.get("/api/v1/meta")
    assert res.status_code == 200
    assert res.json()["service"] == "abhimanyu-api"
