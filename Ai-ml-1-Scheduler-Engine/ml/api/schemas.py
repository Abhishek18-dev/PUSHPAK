from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Tuple, List
from ml.environments.state import StateVector
from ml.environments.action_space import Action

class DecideRequest(BaseModel):
    """Schema for the /internal/decide incoming request."""
    simulation_id: str = Field(..., description="Identifier for the simulation session")
    state: StateVector = Field(..., description="Current simulation state features")
    policy: str = Field(..., description="Target algorithm (e.g., bandit)")
    model_id: Optional[str] = Field(None, description="Optional explicit model version to use")

class DecideResponse(BaseModel):
    """Schema for the /internal/decide output."""
    action: Action
    model_id: str
    decision_id: str

class LearnRequest(BaseModel):
    """Schema for the /internal/learn incoming feedback request."""
    simulation_id: str
    decision_id: str
    state: StateVector
    action: Action
    reward: float
    next_state: Optional[StateVector] = None

class LearnResponse(BaseModel):
    """Schema for the /internal/learn output."""
    acknowledged: bool = True

class TrainRequest(BaseModel):
    """Schema for the /internal/train incoming request."""
    algorithm: str = Field(..., description="E.g., bandit, q_learning")
    scenario: str = Field(..., description="E.g., A, B, C")
    hyperparams: Dict[str, Any] = Field(default_factory=dict)
    episode_count: int = Field(..., ge=1)
    seed_range: Tuple[int, int]

class TrainResponse(BaseModel):
    """Schema for the /internal/train output."""
    job_id: str

class JobStatusResponse(BaseModel):
    """Schema for the /internal/train/{job_id}/status output."""
    status: str
    progress: float
    
class EvaluateRequest(BaseModel):
    """Schema for the /internal/models/{id}/evaluate request."""
    scenario: str
    episode_count: int
