import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Optional, Tuple, Dict, Any

from .state import StateVector, BandState, ReceiverState
from .reward import validate_reward

class SchedulerEnv(gym.Env):
    """
    Gymnasium environment foundation for the AI-ML-1 Scheduler Engine.
    
    This environment provides a standard RL interface for the scheduler policy 
    (Contextual Bandit, etc.) but DOES NOT simulate RF ground truth. The true
    simulation happens in the Backend. This environment acts as a stateful 
    adapter for training harnesses and reproducible local testing.
    """
    metadata = {"render_modes": []}

    def __init__(self, num_bands: int = 16):
        """
        Initializes the environment spaces for the given number of bands.
        The default is 16, but supports up to 64+ per requirements.
        """
        super().__init__()
        self.num_bands = num_bands
        
        # MVP Action Space: Discrete selection of the next band
        self.action_space = spaces.Discrete(self.num_bands)
        
        # Observation Space: Dictionary of Box spaces matching StateVector.to_observation()
        self.observation_space = spaces.Dict({
            "band_features": spaces.Box(
                low=0.0, high=np.inf, shape=(self.num_bands, 8), dtype=np.float32
            ),
            "tuned_bands": spaces.MultiBinary(self.num_bands),
            "receiver_features": spaces.Box(
                low=0.0, high=np.inf, shape=(2,), dtype=np.float32
            )
        })
        
        self.current_state: Optional[StateVector] = None
        self._np_random = None

    def reset(self, *, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, np.ndarray], Dict[str, Any]]:
        """
        Resets the environment. 
        Because the real simulation state is owned by the Backend, a true reset 
        happens externally. This method accepts an optional 'initial_state' via options 
        for injection, otherwise it creates a zeroed default state.
        """
        super().reset(seed=seed)
        
        if options and "initial_state" in options:
            self.current_state = options["initial_state"]
        else:
            self.current_state = self._create_default_state()
            
        return self.current_state.to_observation(self.num_bands), {}

    def step(self, action: int) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict[str, Any]]:
        """
        Environment step interface.
        Validates the action against the configured action space.
        In a real integrated run, the Backend updates state and calculates reward.
        For local consistency, this adapter returns the mock/fixture state unless externally updated.
        """
        if not self.action_space.contains(action):
            raise ValueError(f"Invalid action: {action}. Must be inside {self.action_space}.")
            
        # The backend provides the actual transition and reward. 
        # Here we merely validate the interface types.
        reward = validate_reward(0.0)
        terminated = False
        truncated = False
        info = {"selected_band": int(action)}
        
        if self.current_state is None:
            raise RuntimeError("Environment must be reset before stepping.")
            
        return self.current_state.to_observation(self.num_bands), reward, terminated, truncated, info

    def _create_default_state(self) -> StateVector:
        """Helper to create a zeroed StateVector when no external state is injected."""
        bands = []
        for i in range(self.num_bands):
            bands.append(BandState(
                band_id=i,
                time_since_last_scan=0,
                recent_detection_rate_ewma=0.0,
                consecutive_misses=0,
                periodicity_phase=0.0,
                periodicity_confidence=0.0,
                band_priority_weight=1.0,
                tuning_cost_to_band=0
            ))
        receiver = ReceiverState(
            tuned_bands=[],
            dwell_remaining_ms=0,
            tuning_delay_countdown_ms=0
        )
        return StateVector(bands=bands, receiver=receiver)
