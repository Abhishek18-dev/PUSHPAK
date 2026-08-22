import numpy as np
import json
from typing import Dict, Any, Optional
from pydantic import BaseModel
from ml.environments.state import StateVector
from ml.environments.reward import validate_reward

class ContextualBanditConfig(BaseModel):
    """Configuration for the Contextual Multi-Armed Bandit MVP."""
    num_bands: int = 16
    initial_epsilon: float = 1.0
    min_epsilon: float = 0.01
    epsilon_decay: float = 0.995
    learning_rate: float = 0.01
    seed: int = 42

class ContextualBanditAgent:
    """
    MVP Contextual Multi-Armed Bandit Scheduler Policy.
    
    This agent uses disjoint linear models for each arm (band).
    For a given context vector x, the expected reward for band 'a' is:
    Q_a(x) = theta_a^T x
    
    Exploration is handled via epsilon-greedy action selection.
    Learning is performed via stochastic gradient descent on the reward error.
    """
    
    def __init__(self, config: ContextualBanditConfig):
        self.config = config
        self.num_bands = config.num_bands
        
        # Number of features: 8 band features + 2 receiver features + 1 bias = 11
        self.num_features = 11
        
        self.rng = np.random.RandomState(self.config.seed)
        self.epsilon = self.config.initial_epsilon
        
        # Initialize parameter matrix (num_bands x num_features) with small deterministic noise
        # This breaks initial ties deterministically.
        self.theta = self.rng.uniform(-0.01, 0.01, size=(self.num_bands, self.num_features))
        
    def _extract_features(self, state: StateVector) -> np.ndarray:
        """
        Extracts contextual features from the StateVector.
        Transforms the structured state into a (num_bands, num_features) matrix
        without leaking ground-truth simulation data.
        """
        obs = state.to_observation(self.num_bands)
        band_features = obs["band_features"] # shape: (num_bands, 8)
        receiver_features = obs["receiver_features"] # shape: (2,)
        
        # Tile the global receiver features to concatenate with each band's local features
        rec_tiled = np.tile(receiver_features, (self.num_bands, 1))
        
        # Bias term for the linear model
        bias = np.ones((self.num_bands, 1), dtype=np.float32)
        
        # Combined feature matrix X of shape (num_bands, 11)
        X = np.concatenate([band_features, rec_tiled, bias], axis=1)
        
        if not np.all(np.isfinite(X)):
            raise ValueError("StateVector resulted in non-finite features (NaN/Inf).")
            
        return X

    def select_action(self, state: StateVector) -> int:
        """
        Selects the next band to scan based on the current context.
        Uses epsilon-greedy exploration.
        """
        X = self._extract_features(state)
        
        # Exploration
        if self.rng.rand() < self.epsilon:
            return int(self.rng.choice(self.num_bands))
            
        # Exploitation
        # Expected reward for each band given its specific context vector:
        # q_estimates[a] = dot(theta[a], X[a])
        q_estimates = np.sum(self.theta * X, axis=1)
        
        # np.argmax deterministically returns the first index in case of exact ties
        return int(np.argmax(q_estimates))

    def update(self, state: StateVector, action: int, reward: float):
        """
        Updates the linear model's parameters for the selected action.
        """
        if not (0 <= action < self.num_bands):
            raise ValueError(f"Invalid action {action} for update.")
            
        reward = validate_reward(reward)
        
        X = self._extract_features(state)
        x_a = X[action]
        
        # Current expected reward prediction
        q_pred = np.dot(self.theta[action], x_a)
        
        # Prediction error
        error = reward - q_pred
        
        # SGD update rule: clip gradients for numerical stability
        gradient = np.clip(error * x_a, -10.0, 10.0)
        self.theta[action] += self.config.learning_rate * gradient

    def decay_epsilon(self):
        """
        Applies exponential decay to the exploration rate.
        Should be called by the training harness at episode boundaries.
        """
        self.epsilon = max(self.config.min_epsilon, self.epsilon * self.config.epsilon_decay)
        
    def reset(self):
        """
        Resets the agent parameters to their initial state using the configured seed.
        """
        self.rng = np.random.RandomState(self.config.seed)
        self.epsilon = self.config.initial_epsilon
        self.theta = self.rng.uniform(-0.01, 0.01, size=(self.num_bands, self.num_features))
        
    def get_policy_info(self) -> Dict[str, Any]:
        """
        Inspects the internal state of the policy.
        """
        return {
            "epsilon": float(self.epsilon),
            "theta_norm": float(np.linalg.norm(self.theta)),
            "num_bands": self.num_bands,
            "min_epsilon": self.config.min_epsilon
        }

    def save(self, filepath: str):
        """
        Serializes the complete agent state to a versioned JSON checkpoint.
        Uses pure JSON rather than pickle for deterministic, safe reloading.
        """
        state = {
            "algorithm": "bandit",
            "schema_version": 1,
            "config": self.config.model_dump(),
            "epsilon": float(self.epsilon),
            "theta": self.theta.tolist(),
        }
        with open(filepath, 'w') as f:
            json.dump(state, f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "ContextualBanditAgent":
        """
        Securely reconstructs the agent from a JSON checkpoint.
        Validates schema, algorithm, and matrix dimensions before activating.
        """
        with open(filepath, 'r') as f:
            state = json.load(f)
            
        if state.get("algorithm") != "bandit":
            raise ValueError(f"Incompatible algorithm in checkpoint: {state.get('algorithm')}")
            
        config = ContextualBanditConfig(**state["config"])
        agent = cls(config)
        agent.epsilon = state["epsilon"]
        
        # Load parameters and enforce shape constraints
        theta_arr = np.array(state["theta"], dtype=np.float32)
        if theta_arr.shape != (config.num_bands, agent.num_features):
            raise ValueError(f"Incompatible parameter dimensions: {theta_arr.shape}")
            
        agent.theta = theta_arr
        return agent
