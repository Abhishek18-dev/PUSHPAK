import time
from typing import Dict, List, Optional
from fastapi import FastAPI, Query
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="Ai-ml-2 Periodicity Estimator")

# Buffer: simulation_id -> band_id -> list of detection timestamps
buffers: Dict[str, Dict[int, List[float]]] = {}

class UpdateRequest(BaseModel):
    simulation_id: str
    band_id: int
    detection_timestamp: float

class ResetRequest(BaseModel):
    simulation_id: str

@app.get("/internal/health")
def health():
    return {"status": "ok"}

@app.post("/internal/periodicity/update")
def update_periodicity(req: UpdateRequest):
    sim_id = req.simulation_id
    band_id = req.band_id
    if sim_id not in buffers:
        buffers[sim_id] = {}
    if band_id not in buffers[sim_id]:
        buffers[sim_id][band_id] = []
    
    buffers[sim_id][band_id].append(req.detection_timestamp)
    # Keep last 50 timestamps
    if len(buffers[sim_id][band_id]) > 50:
        buffers[sim_id][band_id].pop(0)
    return {"acknowledged": True}

@app.get("/internal/periodicity/predict")
def predict_periodicity(simulation_id: str, band_id: int):
    timestamps = buffers.get(simulation_id, {}).get(band_id, [])
    if len(timestamps) < 3:
        return {
            "predicted_next_active_window": {"start": 0, "end": 0},
            "estimated_period": 0.0,
            "confidence": 0.0
        }
    
    # Calculate inter-arrival times
    diffs = np.diff(timestamps)
    mean_period = float(np.mean(diffs))
    std_period = float(np.std(diffs))
    
    # Confidence degrades if variance is high
    confidence = max(0.0, min(1.0, 1.0 - (std_period / (mean_period + 1e-5))))
    
    last_t = timestamps[-1]
    next_start = last_t + mean_period - 0.5
    next_end = last_t + mean_period + 0.5
    
    return {
        "predicted_next_active_window": {"start": round(next_start, 2), "end": round(next_end, 2)},
        "estimated_period": round(mean_period, 2),
        "confidence": round(confidence, 2)
    }

@app.get("/internal/periodicity/state")
def get_state(simulation_id: str, band_id: int):
    timestamps = buffers.get(simulation_id, {}).get(band_id, [])
    return {
        "simulation_id": simulation_id,
        "band_id": band_id,
        "buffer_size": len(timestamps),
        "timestamps": timestamps
    }

@app.post("/internal/periodicity/reset")
def reset_periodicity(req: ResetRequest):
    if req.simulation_id in buffers:
        del buffers[req.simulation_id]
    return {"acknowledged": True}
