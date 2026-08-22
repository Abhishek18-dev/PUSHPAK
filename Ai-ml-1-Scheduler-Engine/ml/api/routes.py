from fastapi import APIRouter, HTTPException, Query
import logging
from ml.api.schemas import (DecideRequest, DecideResponse, LearnRequest, LearnResponse, 
                            TrainRequest, TrainResponse, JobStatusResponse, EvaluateRequest)
from ml.services.scheduler_service import scheduler_service
from ml.registry.registry import model_registry, ModelMetadata
from ml.training.executor import training_orchestrator

logger = logging.getLogger("ml-scheduler")
router = APIRouter(prefix="/internal")

@router.post("/decide", response_model=DecideResponse)
async def decide_endpoint(req: DecideRequest):
    """
    Given the current StateVector, selects the next best band via the configured ML policy.
    """
    try:
        action, model_id, decision_id = scheduler_service.decide(
            simulation_id=req.simulation_id,
            state=req.state,
            policy=req.policy
        )
        logger.info("Decision made", extra={"decision_id": decision_id, "band": action.next_band, "simulation_id": req.simulation_id})
        return DecideResponse(action=action, model_id=model_id, decision_id=decision_id)
    except ValueError as e:
        logger.warning(f"Validation error in decide: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Internal server error during decide")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/learn", response_model=LearnResponse)
async def learn_endpoint(req: LearnRequest):
    """
    Processes the system reward calculated by the Backend and updates the ML policy.
    """
    try:
        scheduler_service.learn(
            simulation_id=req.simulation_id,
            decision_id=req.decision_id,
            state=req.state,
            action=req.action,
            reward=req.reward,
            next_state=req.next_state
        )
        logger.info("Learning updated", extra={"decision_id": req.decision_id, "reward": req.reward, "simulation_id": req.simulation_id})
        return LearnResponse(acknowledged=True)
    except ValueError as e:
        logger.warning(f"Validation error in learn: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Internal server error during learn")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- LEVEL 5 ENDPOINTS: MODEL REGISTRY & TRAINING ORCHESTRATION ---

@router.post("/train", response_model=TrainResponse)
async def train_endpoint(req: TrainRequest):
    """
    Submits a training job. ACTUAL TRAINING IS DEFERRED LOCALLY.
    """
    try:
        job_id = training_orchestrator.submit_job(
            algorithm=req.algorithm,
            scenario=req.scenario,
            hyperparams=req.hyperparams,
            episode_count=req.episode_count,
            seed_range=req.seed_range
        )
        return TrainResponse(job_id=job_id)
    except Exception as e:
        logger.exception("Failed to submit training job")
        raise HTTPException(status_code=500, detail="Internal error")

@router.get("/train/{job_id}/status", response_model=JobStatusResponse)
async def train_status_endpoint(job_id: str):
    job = training_orchestrator.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(status=job.status, progress=job.progress)

@router.get("/models")
async def list_models(algorithm: str = Query(None), active: bool = Query(None)):
    models = model_registry.list_models(algorithm=algorithm, active=active)
    return models

@router.get("/models/{model_id}")
async def get_model(model_id: str):
    model = model_registry.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.post("/models/{model_id}/activate")
async def activate_model(model_id: str):
    """
    Activates a registered model, archiving any previously active models for the same algorithm.
    Validates and reconstructs the checkpoint into the active serving process.
    """
    model = model_registry.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    try:
        # Load the model securely into the service layer
        scheduler_service.activate_model(model.model_id, model.checkpoint_path, model.algorithm)
        
        # Mark as active in the registry
        model_registry.mark_active(model_id)
        
        logger.info(f"Model {model_id} successfully activated")
        return {"status": "activated"}
    except ValueError as e:
        logger.error(f"Failed to activate model {model_id}: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error activating model {model_id}")
        raise HTTPException(status_code=500, detail="Internal error during activation")

@router.post("/models/{model_id}/evaluate")
async def evaluate_model(model_id: str, req: EvaluateRequest):
    """
    EVALUATION IS DEFERRED LOCALLY.
    """
    model = model_registry.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    logger.warning(f"Evaluation requested for {model_id}. ACTUAL EVALUATION EXECUTION DEFERRED.")
    return {"metrics": {"status": "deferred_execution_placeholder"}}

