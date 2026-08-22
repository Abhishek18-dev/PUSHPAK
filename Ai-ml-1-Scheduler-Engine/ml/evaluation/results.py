from typing import Optional
from pydantic import BaseModel

class EvaluationMetrics(BaseModel):
    pd: Optional[float]
    pfa: Optional[float]
    ait: Optional[float]
    latency: Optional[float]
    hpdr: Optional[float]

class ScenarioResult(BaseModel):
    scenario_id: str
    seed: int
    algorithm: str
    model_version: str
    duration_steps: int
    metrics: EvaluationMetrics

class ComparisonResult(BaseModel):
    scenario_id: str
    seed: int
    baseline_metrics: EvaluationMetrics
    ml_metrics: EvaluationMetrics
    
    # Delta improvements. 
    # Positive means improvement (e.g., higher Pd, lower AIT)
    pd_improvement: Optional[float]
    pfa_improvement: Optional[float]
    ait_improvement: Optional[float]
    latency_improvement: Optional[float]
    hpdr_improvement: Optional[float]

class GateResult(BaseModel):
    passed: bool
    reason: str
    failed_criteria: list[str]
