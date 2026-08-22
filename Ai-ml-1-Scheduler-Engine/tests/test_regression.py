import pytest
import numpy as np
from ml.environments.state import StateVector
from ml.agents.bandit_agent import ContextualBanditAgent, ContextualBanditConfig
from ml.agents.q_learning_agent import QLearningAgent, QLearningConfig, FeatureBin
from ml.evaluation.gates import MVPAcceptanceGate, MVPAcceptanceThresholds
from ml.evaluation.results import ComparisonResult

@pytest.fixture
def regression_state():
    return StateVector(**{
        "bands": [
            {"band_id": 0, "time_since_last_scan": 10, "recent_detection_rate_ewma": 0.8, "consecutive_misses": 0, "periodicity_phase": 0.0, "periodicity_confidence": 0.0, "band_priority_weight": 1.0, "tuning_cost_to_band": 0},
            {"band_id": 1, "time_since_last_scan": 10, "recent_detection_rate_ewma": 0.1, "consecutive_misses": 0, "periodicity_phase": 0.0, "periodicity_confidence": 0.0, "band_priority_weight": 1.0, "tuning_cost_to_band": 0}
        ],
        "receiver": {"tuned_bands": [], "dwell_remaining_ms": 0, "tuning_delay_countdown_ms": 0}
    })

def test_bandit_mathematics_regression(regression_state):
    """
    Prevents silent alteration of the MVP contextual bandit gradient equations.
    """
    config = ContextualBanditConfig(num_bands=2, learning_rate=0.01, initial_epsilon=0.0)
    agent = ContextualBanditAgent(config)
    
    # Overwrite weights with exact zeros to remove rng uncertainty
    agent.theta = np.zeros((agent.num_bands, agent.num_features), dtype=np.float32)
    
    # Extract features for Band 1 manually
    X = agent._extract_features(regression_state)
    x_1 = X[1]
    
    # Reward update
    agent.update(regression_state, action=1, reward=1.0)
    
    # q_pred was 0. error = 1.0 - 0 = 1.0. 
    # gradient = np.clip(1.0 * x_1, -10, 10) = x_1
    # theta[1] += 0.01 * x_1
    expected_theta_1 = 0.01 * x_1
    
    np.testing.assert_allclose(agent.theta[1], expected_theta_1, rtol=1e-5)
    # Band 0 should be untouched
    np.testing.assert_allclose(agent.theta[0], np.zeros(agent.num_features), rtol=1e-5)

def test_q_learning_mathematics_regression(regression_state):
    """
    Prevents silent alteration of the V1 Q-Learning Bellman update.
    """
    config = QLearningConfig(
        num_bands=2, 
        learning_rate=0.1, 
        discount_factor=0.99,
        initial_epsilon=0.0,
        discretizer_features=[FeatureBin(feature="recent_detection_rate_ewma", bins=[0.5])]
    )
    agent = QLearningAgent(config)
    
    key = agent.discretizer.discretize(regression_state)
    assert key == "1|0" # 0.8 is bin 1, 0.1 is bin 0
    
    # Inject precise Q-values
    agent.q_table[key] = np.array([0.5, 1.5], dtype=np.float32)
    
    # Exploit selection should return 1 deterministically
    action = agent.select_action(regression_state)
    assert action == 1
    
    # Terminal Update Regression
    # Q(s,a) = 1.5 + 0.1 * (1.0 + 0 - 1.5) = 1.5 + 0.1 * (-0.5) = 1.45
    agent.update(regression_state, action=1, reward=1.0, next_state=None, terminated=True)
    assert np.isclose(agent.q_table[key][1], 1.45)
    
    # Non-Terminal Update Regression
    # Q(s,a) = 1.45 + 0.1 * (2.0 + 0.99 * 1.5 - 1.45) = 1.45 + 0.1 * (2.035) = 1.6535
    # (Since key maps to [0.5, 1.45] after previous step, max is 1.45. Wait, let's inject a new next state)
    agent.q_table["next_state"] = np.array([2.0, 0.0], dtype=np.float32)
    agent.discretizer.discretize = lambda x: "next_state" # mock briefly
    
    agent.update(regression_state, action=1, reward=2.0, next_state=regression_state, terminated=False)
    # Target = 2.0 + 0.99 * 2.0 = 3.98
    # Error = 3.98 - 1.45 = 2.53
    # Q = 1.45 + 0.1 * 2.53 = 1.703
    assert np.isclose(agent.q_table[key][1], 1.703)

def test_evaluation_gate_regression():
    """
    Ensures the Level 6 Evaluation Gate remains safely blocked while numerical 
    thresholds are unspecified.
    """
    gate = MVPAcceptanceGate()
    # Create dummy comparison result
    comp = ComparisonResult(
        ml_model_id="test",
        baseline_model_id="base",
        scenario_id="A",
        episode_count=100,
        ml_metrics={},
        baseline_metrics={},
        improvements={}
    )
    result = gate.evaluate(comp)
    assert result.passed is False
    assert "BLOCKED" in result.reason
    assert "unspecified_thresholds" in result.failed_criteria
