from fastapi.testclient import TestClient
from ml.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/internal/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_correlation_id_passthrough():
    test_corr_id = "test-corr-123"
    response = client.get("/internal/health", headers={"X-Correlation-ID": test_corr_id})
    assert response.status_code == 200
    assert response.headers["X-Correlation-ID"] == test_corr_id

def test_generated_correlation_id():
    response = client.get("/internal/health")
    assert response.status_code == 200
    assert "X-Correlation-ID" in response.headers
    assert len(response.headers["X-Correlation-ID"]) > 0
