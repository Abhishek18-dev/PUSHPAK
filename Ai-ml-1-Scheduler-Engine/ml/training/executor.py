import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel

class JobStatus:
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"

class TrainingJob(BaseModel):
    job_id: str
    algorithm: str
    scenario: str
    status: str
    progress: float
    error: Optional[str] = None
    model_id: Optional[str] = None

class TrainingOrchestrator:
    """
    Mock orchestration boundary for training execution.
    In the local laptop environment, actual training is DEFERRED for safety.
    This component manages the state lifecycle and contract of /internal/train
    without triggering blocking computationally expensive tasks.
    """
    def __init__(self):
        self.jobs: Dict[str, TrainingJob] = {}
        
    def submit_job(self, algorithm: str, scenario: str, hyperparams: Dict[str, Any], episode_count: int, seed_range: list) -> str:
        """
        Validates training configuration and creates a job record.
        Actual execution is deferred/mocked in this environment.
        """
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        job = TrainingJob(
            job_id=job_id,
            algorithm=algorithm,
            scenario=scenario,
            status=JobStatus.QUEUED,
            progress=0.0
        )
        self.jobs[job_id] = job
        
        # Log that execution is deferred
        import logging
        logger = logging.getLogger("ml-scheduler")
        logger.warning(f"Training job {job_id} submitted. ACTUAL TRAINING EXECUTION DEFERRED in local environment.")
        
        return job_id
        
    def get_job_status(self, job_id: str) -> Optional[TrainingJob]:
        return self.jobs.get(job_id)

# Global orchestrator instance
training_orchestrator = TrainingOrchestrator()
