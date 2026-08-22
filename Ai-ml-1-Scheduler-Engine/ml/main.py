from fastapi import FastAPI, Request
from ml.utils.logger import setup_logger, correlation_id_var, simulation_id_var
from ml.api.routes import router as internal_router
import uuid

logger = setup_logger()

app = FastAPI(
    title="Ai-ml-1-Scheduler-Engine",
    description="Intelligent RF Spectrum Scan Strategy - ML Scheduler",
    version="1.0.0"
)

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    # Extract correlation IDs from headers if present, else generate a correlation ID
    corr_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    sim_id = request.headers.get("X-Simulation-ID", "")
    
    # Set context variables for structured logging
    token_corr = correlation_id_var.set(corr_id)
    token_sim = simulation_id_var.set(sim_id)
    
    try:
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = corr_id
        return response
    finally:
        correlation_id_var.reset(token_corr)
        simulation_id_var.reset(token_sim)

@app.get("/internal/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "ok"}

# Register Level 4 integration endpoints
app.include_router(internal_router)
