import threading
import uuid
from typing import Tuple
from ml.environments.state import StateVector
from ml.environments.action_space import Action
from ml.agents.bandit_agent import ContextualBanditAgent, ContextualBanditConfig

class SchedulerService:
    """
    Application layer bridging the API to the ML agents.
    Maintains the in-memory policy state and ensures thread-safe access 
    during concurrent request processing.
    """
    
    def __init__(self):
        # Initialize in-memory instances for both supported V1 algorithms
        self.bandit_agent = ContextualBanditAgent(ContextualBanditConfig())
        self.active_model_id_bandit = "model_bandit_in_memory"
        
        # Q-Learning is deferred but instantiated for routing
        from ml.agents.q_learning_agent import QLearningAgent, QLearningConfig
        self.q_learning_agent = QLearningAgent(QLearningConfig())
        self.active_model_id_q_learning = "model_q_learning_in_memory"
        
        # Store recent decisions to correctly route delayed learn() feedback
        self.decision_routes = {}
        
        self.lock = threading.Lock()
        
    def activate_model(self, model_id: str, filepath: str, algorithm: str):
        """
        Securely activates a trained model from a validated checkpoint artifact.
        Supports 'bandit' and 'q_learning'.
        """
        with self.lock:
            if algorithm == "bandit":
                self.bandit_agent = ContextualBanditAgent.load(filepath)
                self.active_model_id_bandit = model_id
            elif algorithm == "q_learning":
                from ml.agents.q_learning_agent import QLearningAgent
                self.q_learning_agent = QLearningAgent.load(filepath)
                self.active_model_id_q_learning = model_id
            else:
                raise ValueError(f"Unsupported algorithm for activation: {algorithm}")
        
    def decide(self, simulation_id: str, state: StateVector, policy: str) -> Tuple[Action, str, str]:
        """Processes a decision request securely via the requested agent."""
        # Support official 'bandit' contract name. Reject 'contextual_bandit'.
        if policy not in ["bandit", "q_learning"]:
            raise ValueError(f"Unsupported policy '{policy}'. MVP/V1 supports 'bandit' or 'q_learning'.")
            
        decision_id = f"dec_{uuid.uuid4().hex[:8]}"
        
        with self.lock:
            if policy == "bandit":
                band_index = self.bandit_agent.select_action(state)
                model_id = self.active_model_id_bandit
            else:
                band_index = self.q_learning_agent.select_action(state)
                model_id = self.active_model_id_q_learning
                
            # Record decision route to ensure correct learning update later
            self.decision_routes[decision_id] = policy
            
        action = Action(next_band=band_index)
        return action, model_id, decision_id
        
    def learn(self, simulation_id: str, decision_id: str, state: StateVector, action: Action, reward: float, next_state: StateVector = None):
        """Processes a learning reward update securely via the correct agent."""
        with self.lock:
            policy = self.decision_routes.get(decision_id, "bandit") # Default to MVP if unknown
            
            if policy == "bandit":
                self.bandit_agent.update(state, action.next_band, reward)
            else:
                # Q-Learning requires next_state
                self.q_learning_agent.update(state, action.next_band, reward, next_state=next_state)
                
            # Clean up tracking map
            if decision_id in self.decision_routes:
                del self.decision_routes[decision_id]

# Singleton service instance exported for use by FastAPI routes
scheduler_service = SchedulerService()
