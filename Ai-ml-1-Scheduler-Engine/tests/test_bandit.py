import pytest
import numpy as np
from ml.environments.state import StateVector, BandState, ReceiverState
from ml.agents.bandit_agent import ContextualBanditAgent, ContextualBanditConfig

@pytest.fixture
def base_state():
    bands = []
    for i in range(16):
        bands.append(BandState(
            band_id=i,
            time_since_last_scan=10 if i == 5 else 0,
            recent_detection_rate_ewma=0.0,
            consecutive_misses=0,
            periodicity_phase=0.0,
            periodicity_confidence=0.0,
            band_priority_weight=1.0,
            tuning_cost_to_band=0
        ))
    return StateVector(
        bands=bands,
        receiver=ReceiverState(tuned_bands=[], dwell_remaining_ms=0, tuning_delay_countdown_ms=0)
    )

def test_initialization():
    config = ContextualBanditConfig(num_bands=16, initial_epsilon=1.0, seed=42)
    agent = ContextualBanditAgent(config)
    assert agent.num_bands == 16
    assert agent.epsilon == 1.0
    assert agent.theta.shape == (16, 11) # 8 band + 2 rec + 1 bias

def test_extract_features(base_state):
    agent = ContextualBanditAgent(ContextualBanditConfig(num_bands=16))
    X = agent._extract_features(base_state)
    assert X.shape == (16, 11)
    # Band 5 has time_since_last_scan=10
    assert X[5, 1] == 10.0
    # Bias term is 1.0
    assert np.all(X[:, -1] == 1.0)

def test_action_selection_exploration(base_state):
    config = ContextualBanditConfig(num_bands=16, initial_epsilon=1.0, seed=42)
    agent = ContextualBanditAgent(config)
    action = agent.select_action(base_state)
    assert 0 <= action < 16

def test_action_selection_exploitation(base_state):
    # Set epsilon to 0 to force exploitation
    config = ContextualBanditConfig(num_bands=16, initial_epsilon=0.0, seed=42)
    agent = ContextualBanditAgent(config)
    # Give band 7 a very high weight manually
    agent.theta[7, -1] = 100.0 
    action = agent.select_action(base_state)
    assert action == 7

def test_learning_update_positive_reward(base_state):
    config = ContextualBanditConfig(num_bands=16, initial_epsilon=0.0, seed=42)
    agent = ContextualBanditAgent(config)
    
    initial_val = agent.theta[3, -1]
    # Provide a large positive reward for action 3
    agent.update(base_state, 3, 10.0)
    
    # The bias weight (index -1) should increase because feature is 1.0
    assert agent.theta[3, -1] > initial_val

def test_learning_update_negative_reward(base_state):
    config = ContextualBanditConfig(num_bands=16, initial_epsilon=0.0, seed=42)
    agent = ContextualBanditAgent(config)
    
    initial_val = agent.theta[2, -1]
    # Provide a negative reward
    agent.update(base_state, 2, -5.0)
    
    assert agent.theta[2, -1] < initial_val

def test_epsilon_decay():
    config = ContextualBanditConfig(initial_epsilon=1.0, epsilon_decay=0.5, min_epsilon=0.1)
    agent = ContextualBanditAgent(config)
    agent.decay_epsilon()
    assert agent.epsilon == 0.5
    agent.decay_epsilon()
    assert agent.epsilon == 0.25
    agent.decay_epsilon()
    agent.decay_epsilon()
    assert agent.epsilon == 0.1 # Should not drop below min_epsilon

def test_reproducibility(base_state):
    config = ContextualBanditConfig(seed=123)
    agent1 = ContextualBanditAgent(config)
    agent2 = ContextualBanditAgent(config)
    
    a1 = agent1.select_action(base_state)
    a2 = agent2.select_action(base_state)
    assert a1 == a2
    
    agent1.update(base_state, a1, 5.0)
    agent2.update(base_state, a2, 5.0)
    
    np.testing.assert_array_equal(agent1.theta, agent2.theta)

def test_context_sensitivity(base_state):
    """Verify that different contexts lead to different Q-estimates and potentially different actions."""
    config = ContextualBanditConfig(num_bands=16, initial_epsilon=0.0, seed=42)
    agent = ContextualBanditAgent(config)
    
    # Train agent that high time_since_last_scan yields high reward
    # Band 5 has time_since_last_scan=10
    agent.update(base_state, 5, 20.0)
    
    # In base state, band 5 has highest time_since_last_scan, so it should be preferred
    assert agent.select_action(base_state) == 5
    
    # Create a new context where band 2 has an even higher time_since_last_scan
    new_bands = []
    for i in range(16):
        new_bands.append(BandState(
            band_id=i,
            time_since_last_scan=100 if i == 2 else 0,
            recent_detection_rate_ewma=0.0,
            consecutive_misses=0,
            periodicity_phase=0.0,
            periodicity_confidence=0.0,
            band_priority_weight=1.0,
            tuning_cost_to_band=0
        ))
    new_state = StateVector(bands=new_bands, receiver=base_state.receiver)
    
    # Action should switch to band 2 because of the context change
    assert agent.select_action(new_state) == 2
