from abc import ABC, abstractmethod
from typing import Tuple
from ml.environments.state import StateVector

class BackendTrainingAdapter(ABC):
    """
    Interface boundary for training execution.
    The Backend must implement this adapter to provide genuine RF simulation physics,
    StateVector assembly, state transitions, and Equation 10.1 reward calculations.
    AI-ML-1 strictly consumes this adapter and does not fabricate physics.
    """
    
    @abstractmethod
    def reset(self) -> StateVector:
        """
        Resets the simulation to the beginning of an episode and returns the initial state.
        """
        pass

    @abstractmethod
    def step(self, action: int) -> Tuple[StateVector, float, bool]:
        """
        Executes the selected band action in the simulation.
        
        Returns:
            next_state (StateVector): The updated state after scanning.
            reward (float): The calculated scalar reward (Eq 10.1).
            terminated (bool): Whether the episode has reached its natural conclusion.
        """
        pass

class MockTrainingAdapter(BackendTrainingAdapter):
    """
    A strict boundary enforcer for local execution.
    Fails explicitly to prevent AI-ML-1 from fabricating fake RF states or rewards.
    """
    def reset(self) -> StateVector:
        raise NotImplementedError("Backend integration required for actual training. Do not fabricate physics.")

    def step(self, action: int) -> Tuple[StateVector, float, bool]:
        raise NotImplementedError("Backend integration required for actual training. Do not fabricate physics.")
