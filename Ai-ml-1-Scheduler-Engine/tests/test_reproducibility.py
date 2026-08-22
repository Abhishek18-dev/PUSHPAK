import pytest
import numpy as np
import os
import json
from ml.environments.state import StateVector
from ml.agents.bandit_agent import ContextualBanditAgent, ContextualBanditConfig
from ml.agents.q_learning_agent import QLearningAgent, QLearningConfig

@pytest.fixture
def dummy_state():
    return StateVector(**{
        "bands": [
            {"band_id": 0, "time_since_last_scan": 10, "recent_detection_rate_ewma": 0.8, "consecutive_misses": 0, "periodicity_phase": 0.0, "periodicity_confidence": 0.0, "band_priority_weight": 1.0, "tuning_cost_to_band": 0},
            {"band_id": 1, "time_since_last_scan": 10, "recent_detection_rate_ewma": 0.1, "consecutive_misses": 0, "periodicity_phase": 0.0, "periodicity_confidence": 0.0, "band_priority_weight": 1.0, "tuning_cost_to_band": 0}
        ],
        "receiver": {"tuned_bands": [], "dwell_remaining_ms": 0, "tuning_delay_countdown_ms": 0}
    })

def test_bandit_reproducibility(dummy_state):
    """Verifies Contextual Bandit determinism with identical seeds."""
    config1 = ContextualBanditConfig(num_bands=2, seed=99, initial_epsilon=0.5)
    agent1 = ContextualBanditAgent(config1)
    
    config2 = ContextualBanditConfig(num_bands=2, seed=99, initial_epsilon=0.5)
    agent2 = ContextualBanditAgent(config2)
    
    # 1. Initialization equivalence
    np.testing.assert_array_equal(agent1.theta, agent2.theta)
    
    # 2. Action equivalence sequence
    actions1 = [agent1.select_action(dummy_state) for _ in range(5)]
    actions2 = [agent2.select_action(dummy_state) for _ in range(5)]
    assert actions1 == actions2
    
    # 3. Update equivalence
    agent1.update(dummy_state, action=0, reward=1.0)
    agent2.update(dummy_state, action=0, reward=1.0)
    np.testing.assert_array_equal(agent1.theta, agent2.theta)
    
def test_q_learning_reproducibility(dummy_state):
    """Verifies Tabular Q-Learning determinism with identical seeds."""
    config1 = QLearningConfig(num_bands=2, seed=77, initial_epsilon=0.5)
    agent1 = QLearningAgent(config1)
    
    config2 = QLearningConfig(num_bands=2, seed=77, initial_epsilon=0.5)
    agent2 = QLearningAgent(config2)
    
    # 1. Action equivalence sequence
    actions1 = [agent1.select_action(dummy_state) for _ in range(5)]
    actions2 = [agent2.select_action(dummy_state) for _ in range(5)]
    assert actions1 == actions2
    
    # 2. Update equivalence
    agent1.update(dummy_state, action=1, reward=5.0, next_state=dummy_state, terminated=False)
    agent2.update(dummy_state, action=1, reward=5.0, next_state=dummy_state, terminated=False)
    
    key1 = agent1.discretizer.discretize(dummy_state)
    key2 = agent2.discretizer.discretize(dummy_state)
    assert key1 == key2
    np.testing.assert_array_equal(agent1.q_table[key1], agent2.q_table[key2])

def test_checkpoint_reproducibility(dummy_state, tmp_path):
    """Verifies round-trip determinism of model serialization without floating point corruption."""
    config = QLearningConfig(num_bands=2, seed=42)
    agent = QLearningAgent(config)
    
    # Mutate state
    agent.update(dummy_state, action=1, reward=3.14159, terminated=True)
    
    filepath = tmp_path / "model.json"
    agent.save(str(filepath))
    
    loaded_agent = QLearningAgent.load(str(filepath))
    
    # Check epsilon, config, and algorithm state
    assert loaded_agent.epsilon == agent.epsilon
    assert loaded_agent.config.num_bands == agent.config.num_bands
    
    # Check exact numerical parity
    for key, q_vals in agent.q_table.items():
        assert key in loaded_agent.q_table
        np.testing.assert_array_equal(q_vals, loaded_agent.q_table[key])
