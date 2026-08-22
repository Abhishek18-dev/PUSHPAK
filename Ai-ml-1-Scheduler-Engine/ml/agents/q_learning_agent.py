import numpy as np
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, model_validator
from ml.environments.state import StateVector
from ml.environments.reward import validate_reward

class FeatureBin(BaseModel):
    feature: str
    bins: List[float]

class QLearningConfig(BaseModel):
    """Configuration for Tabular Q-Learning V1."""
    num_bands: int = 16
    initial_epsilon: float = 1.0
    min_epsilon: float = 0.01
    epsilon_decay: float = 0.995
    learning_rate: float = 0.1
    discount_factor: float = 0.99
    seed: int = 42
    
    # Minimal default to avoid state explosion.
    # 2 bins ^ 16 bands = 65,536 theoretical states.
    discretizer_features: List[FeatureBin] = [
        FeatureBin(feature="recent_detection_rate_ewma", bins=[0.5])
    ]

    @model_validator(mode="after")
    def validate_bounds(self) -> "QLearningConfig":
        if not (0 <= self.learning_rate <= 1):
            raise ValueError("learning_rate must be between 0 and 1")
        if not (0 <= self.discount_factor <= 1):
            raise ValueError("discount_factor must be between 0 and 1")
        if not (0 <= self.initial_epsilon <= 1):
            raise ValueError("initial_epsilon must be between 0 and 1")
        return self

class StateDiscretizer:
    def __init__(self, config: QLearningConfig):
        self.features = config.discretizer_features
        self.num_bands = config.num_bands
        
        # Calculate theoretical size
        states_per_band = 1
        for f in self.features:
            states_per_band *= (len(f.bins) + 1)
            
        self.theoretical_size = states_per_band ** self.num_bands
        
        # Reject obviously unsafe configurations
        if self.theoretical_size > 1_000_000:
            raise ValueError(
                f"State space explosion: theoretical size {self.theoretical_size} "
                "exceeds safe limit of 1,000,000. Reduce bins or features."
            )
            
    def discretize(self, state: StateVector) -> str:
        """
        Converts the continuous StateVector into a deterministic, hashable string key.
        Only uses the explicitly configured features to limit state space.
        """
        band_states = []
        # Sort bands by band_id to ensure deterministic order
        sorted_bands = sorted(state.bands, key=lambda b: b.band_id)
        
        for band in sorted_bands:
            band_dict = band.model_dump()
            b_state = []
            for f in self.features:
                val = band_dict.get(f.feature, 0.0)
                if val is None or not np.isfinite(val):
                    raise ValueError(f"Invalid non-finite state feature {f.feature}={val}")
                bin_idx = np.digitize(val, f.bins)
                b_state.append(str(bin_idx))
            band_states.append("-".join(b_state))
            
        return "|".join(band_states)

class QLearningAgent:
    """
    Tabular Q-Learning Agent (V1 algorithm).
    Uses a sparse dictionary-based Q-table to handle large discrete state spaces safely.
    """
    
    def __init__(self, config: QLearningConfig):
        self.config = config
        self.num_bands = config.num_bands
        self.discretizer = StateDiscretizer(config)
        self.rng = np.random.RandomState(config.seed)
        self.epsilon = config.initial_epsilon
        
        # Sparse Q-table: maps discrete_state_key (str) -> np.ndarray of shape (num_bands,)
        self.q_table: Dict[str, np.ndarray] = {}
        
    def _get_q_values(self, state_key: str) -> np.ndarray:
        """Returns Q-values for a state, initializing to zeros if unseen."""
        if state_key not in self.q_table:
            self.q_table[state_key] = np.zeros(self.num_bands, dtype=np.float32)
        return self.q_table[state_key]
        
    def select_action(self, state: StateVector) -> int:
        """Epsilon-greedy action selection."""
        state_key = self.discretizer.discretize(state)
        
        if self.rng.rand() < self.epsilon:
            return int(self.rng.choice(self.num_bands))
            
        q_vals = self._get_q_values(state_key)
        
        # Find all actions with the max Q-value and break ties randomly for fairness
        max_q = float(np.max(q_vals))
        max_indices = np.where(q_vals == max_q)[0]
        return int(self.rng.choice(max_indices))

    def update(self, state: StateVector, action: int, reward: float, next_state: Optional[StateVector] = None, terminated: bool = False):
        """
        Standard Q-Learning update:
        Q(s,a) = Q(s,a) + alpha * (r + gamma * max_a' Q(s',a') - Q(s,a))
        """
        if not (0 <= action < self.num_bands):
            raise ValueError(f"Invalid action {action}")
            
        reward = validate_reward(reward)
        state_key = self.discretizer.discretize(state)
        q_vals = self._get_q_values(state_key)
        
        # Handle terminal state bootstrapping
        if terminated or next_state is None:
            max_next_q = 0.0
        else:
            next_state_key = self.discretizer.discretize(next_state)
            next_q_vals = self._get_q_values(next_state_key)
            max_next_q = float(np.max(next_q_vals))
            
        current_q = q_vals[action]
        target = reward + self.config.discount_factor * max_next_q
        error = target - current_q
        
        # Update the Q-value
        q_vals[action] += self.config.learning_rate * error
        self.q_table[state_key] = q_vals

    def decay_epsilon(self):
        """Decays exploration rate exponentially."""
        self.epsilon = max(self.config.min_epsilon, self.epsilon * self.config.epsilon_decay)
        
    def reset(self):
        self.rng = np.random.RandomState(self.config.seed)
        self.epsilon = self.config.initial_epsilon
        self.q_table = {}
        
    def get_policy_info(self) -> Dict[str, Any]:
        return {
            "algorithm": "q_learning",
            "epsilon": float(self.epsilon),
            "num_bands": self.num_bands,
            "q_table_size": len(self.q_table),
            "theoretical_state_space_size": self.discretizer.theoretical_size
        }

    def save(self, filepath: str):
        """Serializes Q-table and configuration to JSON."""
        serializable_q_table = {k: v.tolist() for k, v in self.q_table.items()}
        
        state_dump = {
            "algorithm": "q_learning",
            "schema_version": 1,
            "config": self.config.model_dump(),
            "epsilon": float(self.epsilon),
            "q_table": serializable_q_table
        }
        with open(filepath, 'w') as f:
            json.dump(state_dump, f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "QLearningAgent":
        """Securely reconstructs the agent from JSON."""
        with open(filepath, 'r') as f:
            state_dump = json.load(f)
            
        if state_dump.get("algorithm") != "q_learning":
            raise ValueError(f"Incompatible algorithm: {state_dump.get('algorithm')}")
            
        config = QLearningConfig(**state_dump["config"])
        agent = cls(config)
        agent.epsilon = state_dump["epsilon"]
        
        # Load Q-table
        agent.q_table = {}
        for k, v in state_dump.get("q_table", {}).items():
            arr = np.array(v, dtype=np.float32)
            if len(arr) != config.num_bands:
                raise ValueError(f"Incompatible Q-values shape: {arr.shape}")
            agent.q_table[k] = arr
            
        return agent
