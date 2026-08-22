import pytest
import uuid
import numpy as np
from ml.environments.state import StateVector
from ml.environments.action_space import Action
from ml.services.scheduler_service import SchedulerService

@pytest.fixture
def dummy_state():
    return StateVector(**{
        "bands": [
            {"band_id": 0, "time_since_last_scan": 10, "recent_detection_rate_ewma": 0.8, "consecutive_misses": 0, "periodicity_phase": 0.0, "periodicity_confidence": 0.0, "band_priority_weight": 1.0, "tuning_cost_to_band": 0}
        ],
        "receiver": {"tuned_bands": [], "dwell_remaining_ms": 0, "tuning_delay_countdown_ms": 0}
    })

def test_api_policy_routing_isolation(dummy_state):
    """
    Verifies that the SchedulerService accurately routes requests to the 
    specified policy agent without contaminating the other agent's state.
    """
    service = SchedulerService()
    
    # 1. Decide Bandit
    action_b, model_b, dec_id_b = service.decide(
        simulation_id="sim_1", 
        state=dummy_state, 
        policy="bandit"
    )
    assert model_b == "model_bandit_in_memory"
    assert service.decision_routes[dec_id_b] == "bandit"
    
    # 2. Decide Q-Learning
    action_q, model_q, dec_id_q = service.decide(
        simulation_id="sim_1", 
        state=dummy_state, 
        policy="q_learning"
    )
    assert model_q == "model_q_learning_in_memory"
    assert service.decision_routes[dec_id_q] == "q_learning"
    
    # Capture initial norms to track contamination
    bandit_norm_pre = np.linalg.norm(service.bandit_agent.theta)
    
    # 3. Learn Q-Learning
    service.learn(
        simulation_id="sim_1",
        decision_id=dec_id_q,
        state=dummy_state,
        action=action_q,
        reward=100.0,
        next_state=dummy_state
    )
    
    # Q-Learning should have updated its dictionary
    assert len(service.q_learning_agent.q_table) > 0
    # Bandit should remain completely untouched
    bandit_norm_post = np.linalg.norm(service.bandit_agent.theta)
    assert bandit_norm_pre == bandit_norm_post
    
    # 4. Learn Bandit
    service.learn(
        simulation_id="sim_1",
        decision_id=dec_id_b,
        state=dummy_state,
        action=action_b,
        reward=100.0,
        next_state=None
    )
    
    # Now bandit norm should have changed
    bandit_norm_final = np.linalg.norm(service.bandit_agent.theta)
    assert bandit_norm_pre != bandit_norm_final

def test_invalid_policy_rejection(dummy_state):
    service = SchedulerService()
    with pytest.raises(ValueError, match="Unsupported policy 'contextual_bandit'"):
        service.decide("sim_1", dummy_state, "contextual_bandit")
        
def test_checkpoint_isolation(dummy_state, tmp_path):
    service = SchedulerService()
    
    # Save a Q-Learning checkpoint
    filepath = tmp_path / "test_q.json"
    service.q_learning_agent.save(str(filepath))
    
    # Attempting to activate Q-learning model into Bandit slot should fail securely
    # Wait, activate_model assigns the loaded agent to either bandit or q_learning
    # based on the algorithm argument.
    
    # If the backend lies and says algorithm="bandit" but the file is Q-learning:
    with pytest.raises(ValueError, match="Incompatible"):
        service.activate_model("new_id", str(filepath), "bandit")
