import pytest
import numpy as np
from pydantic import ValidationError
from ml.environments.state import BandState, ReceiverState, StateVector
from ml.environments.action_space import Action
from ml.environments.reward import validate_reward
from ml.environments.environment import SchedulerEnv

def test_valid_band_state():
    state = BandState(
        band_id=1,
        time_since_last_scan=5,
        recent_detection_rate_ewma=0.5,
        consecutive_misses=1,
        periodicity_phase=0.2,
        periodicity_confidence=0.9,
        band_priority_weight=2.0,
        tuning_cost_to_band=1
    )
    assert state.band_id == 1

def test_invalid_band_state():
    with pytest.raises(ValidationError):
        BandState(
            band_id=-1, # Invalid: negative
            time_since_last_scan=0,
            recent_detection_rate_ewma=1.5, # Invalid: > 1.0
            consecutive_misses=0,
            periodicity_phase=0.0,
            periodicity_confidence=0.0,
            band_priority_weight=1.0,
            tuning_cost_to_band=0
        )

def test_state_vector_to_observation():
    bands = [
        BandState(band_id=0, time_since_last_scan=1, recent_detection_rate_ewma=0.1, consecutive_misses=0,
                  periodicity_phase=0.1, periodicity_confidence=0.5, band_priority_weight=1.0, tuning_cost_to_band=1)
    ]
    receiver = ReceiverState(tuned_bands=[0], dwell_remaining_ms=10, tuning_delay_countdown_ms=0)
    sv = StateVector(bands=bands, receiver=receiver)
    
    obs = sv.to_observation(num_bands=2)
    assert "band_features" in obs
    assert obs["band_features"].shape == (2, 8)
    assert obs["tuned_bands"][0] == 1
    assert obs["tuned_bands"][1] == 0
    assert obs["receiver_features"][0] == 10.0

def test_action_validation():
    action = Action(next_band=5)
    assert action.next_band == 5
    
    with pytest.raises(ValidationError):
        Action(next_band=-1)

def test_reward_validation():
    assert validate_reward(10.5) == 10.5
    assert validate_reward(0) == 0.0
    
    with pytest.raises(TypeError):
        validate_reward("invalid")

def test_environment_initialization():
    env = SchedulerEnv(num_bands=16)
    assert env.action_space.n == 16
    obs, info = env.reset()
    assert obs["band_features"].shape == (16, 8)
    
def test_environment_step_valid():
    env = SchedulerEnv(num_bands=16)
    env.reset(seed=42)
    obs, reward, term, trunc, info = env.step(5)
    assert info["selected_band"] == 5
    assert reward == 0.0

def test_environment_step_invalid():
    env = SchedulerEnv(num_bands=16)
    env.reset(seed=42)
    with pytest.raises(ValueError, match="Invalid action"):
        env.step(20) # Out of bounds
    with pytest.raises(ValueError, match="Invalid action"):
        env.step(-1)

def test_environment_reproducibility():
    env1 = SchedulerEnv(num_bands=16)
    obs1, _ = env1.reset(seed=42)
    
    env2 = SchedulerEnv(num_bands=16)
    obs2, _ = env2.reset(seed=42)
    
    np.testing.assert_array_equal(obs1["band_features"], obs2["band_features"])
