"""Pydantic models for API_CONTRACT.md -- Sections 1, 4 and 6.

Robust, tolerant data contracts for high-speed ML decision and learning paths.
"""

from __future__ import annotations

from typing import Any, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

# -- Section 6: shared enums and ID formats ------------------------------------------------

BehaviorClass = Literal["fixed", "periodic", "agile", "random", "intermittent"]
PolicyType = Literal["baseline", "bandit", "q_learning", "dqn", "ppo"]
DetectionType = Literal["TP", "FN", "FP", "TN"]
ScenarioId = Literal["A", "B", "C", "D", "E", "F", "G"]
LearningPolicy = Literal["baseline", "bandit", "q_learning", "dqn", "ppo"]

SIMULATION_ID_PATTERN = r"^sim_[0-9a-f]{8}$"
EXPERIMENT_ID_PATTERN = r"^exp_[0-9a-f]{8}$"
MODEL_ID_PATTERN = r"^model_(baseline|bandit|q_learning|dqn|ppo)_[0-9a-f]{8}$"


def new_request_id() -> str:
    return f"req_{uuid4().hex[:8]}"


def new_model_id(algorithm: str) -> str:
    return f"model_{algorithm}_{uuid4().hex[:8]}"


def new_decision_id() -> str:
    return f"dec_{uuid4().hex[:8]}"


# -- Section 1: standard envelope ----------------------------------------------------------

class ErrorBody(BaseModel):
    model_config = ConfigDict(extra="ignore")
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class SuccessEnvelope(BaseModel):
    model_config = ConfigDict(extra="ignore")
    success: Literal[True] = True
    data: Any = None
    requestId: str = Field(default_factory=new_request_id)


class ErrorEnvelope(BaseModel):
    model_config = ConfigDict(extra="ignore")
    success: Literal[False] = False
    error: ErrorBody
    requestId: str = Field(default_factory=new_request_id)


# -- Section 4: StateVector ----------------------------------------------------------------

class BandState(BaseModel):
    model_config = ConfigDict(extra="ignore")

    band_id: int = Field(default=0, ge=0)
    time_since_last_scan: int = Field(default=0, ge=0)
    recent_detection_rate_ewma: float = Field(default=0.0)
    consecutive_misses: int = Field(default=0, ge=0)
    periodicity_phase: float = Field(default=0.0)
    periodicity_confidence: float = Field(default=0.0)
    band_priority_weight: float = Field(default=1.0)
    tuning_cost_to_band: int = Field(default=0, ge=0)


class ReceiverState(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tuned_bands: list[int] = Field(default_factory=list)
    dwell_remaining_ms: int = Field(default=0, ge=0)
    tuning_delay_countdown_ms: int = Field(default=0, ge=0)


class StateVector(BaseModel):
    model_config = ConfigDict(extra="ignore")

    bands: list[BandState] = Field(default_factory=list)
    receiver: ReceiverState = Field(default_factory=ReceiverState)


class Action(BaseModel):
    model_config = ConfigDict(extra="ignore")

    next_band: int = Field(default=0, ge=0)
    dwell_time: Optional[int] = Field(default=None, ge=0)


# -- Section 4: request/response bodies ----------------------------------------------------

class DecideRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    simulation_id: str = Field(default="sim_default")
    state: StateVector
    policy: str = Field(default="bandit")
    model_id: Optional[str] = None


class DecideResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    action: Action
    model_id: str
    decision_id: str


class LearnRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    simulation_id: str = Field(default="sim_default")
    decision_id: str = Field(default="dec_default")
    state: StateVector
    action: Action
    reward: float = Field(default=0.0)
    next_state: Optional[StateVector] = None


class LearnResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    acknowledged: bool = True


class TrainRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    algorithm: PolicyType
    scenario: ScenarioId
    hyperparams: dict[str, Any] = Field(default_factory=dict)
    episode_count: Optional[int] = Field(default=None, ge=1)
    seed_range: Optional[tuple[int, int]] = None


class TrainResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_id: str


class TrainStatusResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: Literal["running", "done", "failed"]
    progress: float = Field(ge=0.0, le=1.0)
    detail: dict[str, Any] = Field(default_factory=dict)


class EvaluateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    scenario: ScenarioId
    episode_count: int = Field(default=20, ge=1)


class ModelMetadata(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), extra="ignore")

    model_id: str
    algorithm: PolicyType
    scenario: Optional[str] = None
    version: int = 1
    active: bool = False
    created_at: str
    hyperparams: dict[str, Any] = Field(default_factory=dict)
    seed_range: Optional[list[int]] = None
    metrics: dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: Literal["ok"] = "ok"
