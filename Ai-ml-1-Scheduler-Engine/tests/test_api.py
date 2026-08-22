import pytest
from fastapi.testclient import TestClient
from ml.main import app

client = TestClient(app)

def get_dummy_state():
    return {
        "bands": [
            {
                "band_id": 0,
                "time_since_last_scan": 10,
                "recent_detection_rate_ewma": 0.5,
                "consecutive_misses": 0,
                "periodicity_phase": 0.0,
                "periodicity_confidence": 0.0,
                "band_priority_weight": 1.0,
                "tuning_cost_to_band": 0
            }
        ],
        "receiver": {
            "tuned_bands": [],
            "dwell_remaining_ms": 0,
            "tuning_delay_countdown_ms": 0
        }
    }

def test_health():
    response = client.get("/internal/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_decide_endpoint_valid():
    payload = {
        "simulation_id": "sim_12345678",
        "state": get_dummy_state(),
        "policy": "bandit"
    }
    response = client.post("/internal/decide", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "action" in data
    assert "next_band" in data["action"]
    assert "decision_id" in data
    assert data["decision_id"].startswith("dec_")
    assert data["model_id"] == "model_bandit_in_memory"

def test_decide_endpoint_invalid_policy():
    payload = {
        "simulation_id": "sim_12345678",
        "state": get_dummy_state(),
        "policy": "dqn"
    }
    response = client.post("/internal/decide", json=payload)
    assert response.status_code == 422
    assert "Unsupported policy" in response.json()["detail"]

def test_decide_endpoint_invalid_state():
    # Missing required 'bands' key in state
    payload = {
        "simulation_id": "sim_12345678",
        "state": {"receiver": {"tuned_bands": [], "dwell_remaining_ms": 0, "tuning_delay_countdown_ms": 0}},
        "policy": "bandit"
    }
    response = client.post("/internal/decide", json=payload)
    assert response.status_code == 422

def test_learn_endpoint_valid():
    # 1. Fetch action
    payload = {
        "simulation_id": "sim_12345678",
        "state": get_dummy_state(),
        "policy": "bandit"
    }
    decide_resp = client.post("/internal/decide", json=payload)
    decide_data = decide_resp.json()
    action = decide_data["action"]
    decision_id = decide_data["decision_id"]
    
    # 2. Issue learning update
    learn_payload = {
        "simulation_id": "sim_12345678",
        "decision_id": decision_id,
        "state": get_dummy_state(),
        "action": action,
        "reward": 15.5
    }
    learn_resp = client.post("/internal/learn", json=learn_payload)
    assert learn_resp.status_code == 200
    assert learn_resp.json() == {"acknowledged": True}

def test_learn_invalid_reward():
    learn_payload = {
        "simulation_id": "sim_12345678",
        "decision_id": "dec_123",
        "state": get_dummy_state(),
        "action": {"next_band": 0},
        "reward": "not-a-number"  # Invalid reward format
    }
    learn_resp = client.post("/internal/learn", json=learn_payload)
    assert learn_resp.status_code == 422
