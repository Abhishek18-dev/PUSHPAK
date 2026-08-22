import pytest
import os
import json
import numpy as np
from fastapi.testclient import TestClient
from ml.main import app
from ml.registry.registry import model_registry, ModelMetadata, ModelStatus
from ml.agents.bandit_agent import ContextualBanditAgent, ContextualBanditConfig

client = TestClient(app)

def test_save_and_load_agent(tmp_path):
    # 1. Create and save an agent
    config = ContextualBanditConfig()
    agent = ContextualBanditAgent(config)
    # Mutate to verify loading
    agent.theta = np.ones_like(agent.theta) * 0.5
    agent.epsilon = 0.5
    
    filepath = tmp_path / "test_model.json"
    agent.save(str(filepath))
    
    # 2. Load the agent securely
    loaded_agent = ContextualBanditAgent.load(str(filepath))
    
    # 3. Assert properties match
    assert loaded_agent.epsilon == 0.5
    np.testing.assert_array_equal(loaded_agent.theta, agent.theta)
    assert loaded_agent.config.num_bands == agent.config.num_bands

def test_registry_lifecycle(tmp_path):
    # Isolate registry to tmp path for test
    model_registry.registry_file = str(tmp_path / "registry.json")
    model_registry.models = {}
    
    # Register a model
    meta = ModelMetadata(
        model_id="model_bandit_123",
        algorithm="bandit",
        version=1,
        created_at="2026-01-01T00:00:00Z",
        status=ModelStatus.TRAINED,
        checkpoint_path="/fake/path.json",
        config={"num_bands": 5}
    )
    model_registry.register_model(meta)
    
    # Retrieve
    retrieved = model_registry.get_model("model_bandit_123")
    assert retrieved is not None
    assert retrieved.algorithm == "bandit"
    
    # Mark active
    model_registry.mark_active("model_bandit_123")
    assert model_registry.get_model("model_bandit_123").status == ModelStatus.ACTIVE

def test_train_orchestrator_endpoint():
    payload = {
        "algorithm": "bandit",
        "scenario": "A",
        "episode_count": 100,
        "seed_range": [0, 5]
    }
    resp = client.post("/internal/train", json=payload)
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    
    status_resp = client.get(f"/internal/train/{job_id}/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "queued"

def test_model_activation_endpoint(tmp_path):
    # Setup agent and save to tmp path
    agent = ContextualBanditAgent(ContextualBanditConfig())
    filepath = str(tmp_path / "model.json")
    agent.save(filepath)
    
    # Register
    model_registry.registry_file = str(tmp_path / "registry.json")
    model_registry.models = {}
    meta = ModelMetadata(
        model_id="model_bandit_test",
        algorithm="bandit",
        version=1,
        created_at="2026-01-01T00:00:00Z",
        status=ModelStatus.TRAINED,
        checkpoint_path=filepath,
        config={}
    )
    model_registry.register_model(meta)
    
    # Activate via endpoint
    resp = client.post("/internal/models/model_bandit_test/activate")
    assert resp.status_code == 200
    
    # Verify via decision endpoint that model_id matches activated model
    payload = {
        "simulation_id": "sim_123",
        "state": {
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
        },
        "policy": "bandit"
    }
    decide_resp = client.post("/internal/decide", json=payload)
    assert decide_resp.json()["model_id"] == "model_bandit_test"
