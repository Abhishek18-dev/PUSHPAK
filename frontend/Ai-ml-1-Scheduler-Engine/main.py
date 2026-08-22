import random
from typing import Dict, List, Optional, Any
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Ai-ml-1 Scheduler Engine")

# Simple internal Q-table/bandit value store
q_values: Dict[int, float] = {}

class BandState(BaseModel):
    band_id: int
    time_since_last_scan: int
    recent_detection_rate_ewma: float
    consecutive_misses: int
    periodicity_phase: float
    periodicity_confidence: float
    band_priority_weight: float
    tuning_cost_to_band: int

class ReceiverState(BaseModel):
    tuned_bands: List[int]
    dwell_remaining_ms: int
    tuning_delay_countdown_ms: int

class StateVector(BaseModel):
    bands: List[BandState]
    receiver: ReceiverState

class DecideRequest(BaseModel):
    simulation_id: str
    state: StateVector
    policy: str  # "bandit" | "q_learning" | "dqn" | "ppo"
    model_id: Optional[str] = None

class LearnRequest(BaseModel):
    simulation_id: str
    decision_id: str
    state: StateVector
    action: Dict[str, Any]
    reward: float
    next_state: Optional[StateVector] = None

@app.get("/internal/health")
def health():
    return {"status": "ok"}

@app.post("/internal/decide")
def decide(req: DecideRequest):
    bands = req.state.bands
    if not bands:
        return {"action": {"next_band": 0}, "model_id": "model_bandit_default", "decision_id": "dec_01"}
    
    epsilon = 0.15
    if random.random() < epsilon:
        # Explore
        selected_band = random.choice([b.band_id for b in bands])
    else:
        # Exploit: score bands based on priority, time since last scan, and periodicity
        scores = []
        for b in bands:
            q_val = q_values.get(b.band_id, 0.0)
            score = (
                q_val * 2.0 +
                b.band_priority_weight * 1.5 +
                (b.time_since_last_scan * 0.1) +
                (b.periodicity_confidence * b.periodicity_phase * 2.0)
            )
            scores.append((score, b.band_id))
        scores.sort(reverse=True)
        selected_band = scores[0][1]

    return {
        "action": {"next_band": selected_band, "dwell_time": 50},
        "model_id": req.model_id or "model_bandit_01",
        "decision_id": f"dec_{random.randint(1000, 9999)}"
    }

@app.post("/internal/learn")
def learn(req: LearnRequest):
    band_id = req.action.get("next_band", 0)
    alpha = 0.1
    current_q = q_values.get(band_id, 0.0)
    q_values[band_id] = current_q + alpha * (req.reward - current_q)
    return {"acknowledged": True}

@app.get("/internal/models")
def list_models():
    return {
        "models": [
            {"id": "model_bandit_01", "algorithm": "bandit", "active": True, "pd": 0.88, "pfa": 0.03},
            {"id": "model_qlearn_01", "algorithm": "q_learning", "active": False, "pd": 0.82, "pfa": 0.05}
        ]
    }
