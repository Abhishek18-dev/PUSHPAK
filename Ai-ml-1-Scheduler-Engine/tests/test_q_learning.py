import pytest
import numpy as np
import os
from ml.agents.q_learning_agent import QLearningAgent, QLearningConfig, FeatureBin
from ml.environments.state import StateVector

@pytest.fixture
def dummy_state():
    return StateVector(**{
        "bands": [
            {
                "band_id": i,
                "time_since_last_scan": 10,
                "recent_detection_rate_ewma": 0.8 if i == 1 else 0.1,
                "consecutive_misses": 0,
                "periodicity_phase": 0.0,
                "periodicity_confidence": 0.0,
                "band_priority_weight": 1.0,
                "tuning_cost_to_band": 0
            } for i in range(2)
        ],
        "receiver": {
            "tuned_bands": [],
            "dwell_remaining_ms": 0,
            "tuning_delay_countdown_ms": 0
        }
    })

def test_initialization():
    config = QLearningConfig(num_bands=2)
    agent = QLearningAgent(config)
    assert agent.discretizer.theoretical_size == 4
    
    # Test invalid config
    with pytest.raises(ValueError):
        QLearningConfig(learning_rate=1.5)

def test_discretization(dummy_state):
    config = QLearningConfig(num_bands=2, discretizer_features=[FeatureBin(feature="recent_detection_rate_ewma", bins=[0.5])])
    agent = QLearningAgent(config)
    
    # dummy_state has ewma 0.1 for band 0 (bin 0) and ewma 0.8 for band 1 (bin 1)
    key = agent.discretizer.discretize(dummy_state)
    assert key == "0|1"
    
    # Non-finite test
    dummy_state.bands[0].recent_detection_rate_ewma = np.nan
    with pytest.raises(ValueError):
        agent.discretizer.discretize(dummy_state)

def test_action_selection(dummy_state):
    config = QLearningConfig(num_bands=2, initial_epsilon=0.0) # Exploit only
    agent = QLearningAgent(config)
    
    # Initially ties broken randomly
    action = agent.select_action(dummy_state)
    assert action in [0, 1]
    
    # Inject Q-values directly
    key = agent.discretizer.discretize(dummy_state)
    agent.q_table[key] = np.array([0.5, 1.5], dtype=np.float32)
    
    action2 = agent.select_action(dummy_state)
    assert action2 == 1

def test_q_update_terminal(dummy_state):
    config = QLearningConfig(num_bands=2, learning_rate=0.5, discount_factor=0.9)
    agent = QLearningAgent(config)
    
    # Update terminal state (next_state=None)
    # Q(s,a) = 0 + 0.5 * (1.0 + 0 - 0) = 0.5
    agent.update(dummy_state, action=1, reward=1.0, next_state=None)
    
    key = agent.discretizer.discretize(dummy_state)
    assert np.isclose(agent.q_table[key][1], 0.5)

def test_q_update_non_terminal(dummy_state):
    config = QLearningConfig(num_bands=2, learning_rate=0.5, discount_factor=0.9)
    agent = QLearningAgent(config)
    
    # Simulate a next state that has max Q of 2.0
    key_next = agent.discretizer.discretize(dummy_state)
    agent.q_table[key_next] = np.array([2.0, 0.0], dtype=np.float32)
    
    # Current state is dummy_state (same key here, simulating loop)
    # Q(s,a) = 0 + 0.5 * (1.0 + 0.9 * 2.0 - 0) = 0.5 * 2.8 = 1.4
    agent.update(dummy_state, action=1, reward=1.0, next_state=dummy_state)
    
    key = agent.discretizer.discretize(dummy_state)
    assert np.isclose(agent.q_table[key][1], 1.4)

def test_reproducibility():
    config1 = QLearningConfig(num_bands=2, seed=42)
    agent1 = QLearningAgent(config1)
    config2 = QLearningConfig(num_bands=2, seed=42)
    agent2 = QLearningAgent(config2)
    
    assert agent1.rng.rand() == agent2.rng.rand()

def test_save_load(dummy_state, tmp_path):
    config = QLearningConfig(num_bands=2)
    agent = QLearningAgent(config)
    
    agent.update(dummy_state, action=0, reward=5.0)
    
    filepath = tmp_path / "test_q.json"
    agent.save(str(filepath))
    
    loaded = QLearningAgent.load(str(filepath))
    assert loaded.config.num_bands == 2
    assert loaded.epsilon == agent.epsilon
    
    key = agent.discretizer.discretize(dummy_state)
    np.testing.assert_array_equal(loaded.q_table[key], agent.q_table[key])
    
    # Reject bad algorithm
    with open(filepath, "r") as f:
        data = f.read()
    with open(filepath, "w") as f:
        f.write(data.replace("q_learning", "bandit"))
        
    with pytest.raises(ValueError, match="Incompatible"):
        QLearningAgent.load(str(filepath))
