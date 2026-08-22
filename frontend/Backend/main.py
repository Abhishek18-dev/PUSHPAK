import asyncio
import json
import time
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="RF Scheduler Backend System of Record")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
simulations: Dict[str, Dict[str, Any]] = {}
active_websockets: Dict[str, List[WebSocket]] = {}

class SimulationCreate(BaseModel):
    name: str = "Scenario A — Mostly Fixed Emitters"
    bands: int = 16
    duration_steps: int = 2000
    seed: int = 42

class EmitterCreate(BaseModel):
    behavior_class: str
    band: int
    priority: int = 1

class SchedulerConfig(BaseModel):
    policy: str  # "baseline" | "bandit" | "q_learning" | "dqn" | "ppo"

@app.get("/health")
@app.get("/ready")
def health():
    return {"status": "ok", "service": "Backend System of Record"}

@app.post("/api/v1/simulations")
def create_simulation(req: SimulationCreate):
    sim_id = f"sim_{hex(int(time.time()))[2:]}"
    sim = {
        "id": sim_id,
        "name": req.name,
        "bands": req.bands,
        "duration_steps": req.duration_steps,
        "seed": req.seed,
        "status": "draft",
        "current_step": 0,
        "policy": "bandit",
        "receiver": {
            "bandwidth_k": 2,
            "dwell_ms": 50,
            "tuning_delay_ms": 10,
            "threshold_snr": 12,
            "tuned_bands": [0, 1]
        },
        "emitters": [
            {"id": "em_1", "behavior_class": "fixed", "band": 3, "priority": 3},
            {"id": "em_2", "behavior_class": "periodic", "band": 7, "priority": 2},
        ],
        "metrics": {
            "pd": 0.88,
            "pfa": 0.03,
            "ait": 3.8,
            "scan_efficiency": 0.82,
            "cumulative_reward": 485
        }
    }
    simulations[sim_id] = sim
    return {"success": True, "data": sim, "requestId": "req_create_01"}

@app.get("/api/v1/simulations")
def list_simulations():
    return {"success": True, "data": list(simulations.values()), "requestId": "req_list_01"}

@app.get("/api/v1/simulations/{sim_id}")
def get_simulation(sim_id: str):
    if sim_id not in simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"success": True, "data": simulations[sim_id], "requestId": "req_get_01"}

@app.post("/api/v1/simulations/{sim_id}/start")
def start_simulation(sim_id: str):
    if sim_id in simulations:
        simulations[sim_id]["status"] = "running"
    return {"success": True, "data": {"status": "running"}, "requestId": "req_start_01"}

@app.post("/api/v1/simulations/{sim_id}/stop")
def stop_simulation(sim_id: str):
    if sim_id in simulations:
        simulations[sim_id]["status"] = "paused"
    return {"success": True, "data": {"status": "paused"}, "requestId": "req_stop_01"}

@app.put("/api/v1/scheduler/config")
def update_scheduler_config(req: SchedulerConfig):
    return {"success": True, "data": {"policy": req.policy}, "requestId": "req_policy_01"}

@app.websocket("/ws/v1/simulations/{sim_id}")
async def websocket_endpoint(websocket: WebSocket, sim_id: str):
    await websocket.accept()
    if sim_id not in active_websockets:
        active_websockets[sim_id] = []
    active_websockets[sim_id].append(websocket)
    
    # Send connection ack
    await websocket.send_json({
        "type": "connection_ack",
        "timestamp": time.time(),
        "simulation_id": sim_id,
        "data": {"status": "connected"}
    })

    try:
        while True:
            data = await websocket.receive_text()
            # Heartbeat ping/pong response
            if "ping" in data:
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
    except WebSocketDisconnect:
        active_websockets[sim_id].remove(websocket)
