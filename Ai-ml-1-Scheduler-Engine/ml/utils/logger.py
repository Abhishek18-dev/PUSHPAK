import logging
import json
import os
from contextvars import ContextVar
from typing import Any, Dict

# Context variables for correlation IDs
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")
simulation_id_var: ContextVar[str] = ContextVar("simulation_id", default="")

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
        }
        
        # Add correlation IDs if they exist
        corr_id = correlation_id_var.get()
        if corr_id:
            log_record["correlation_id"] = corr_id
            
        sim_id = simulation_id_var.get()
        if sim_id:
            log_record["simulation_id"] = sim_id
            
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)

def setup_logger(name: str = "ml-scheduler") -> logging.Logger:
    logger = logging.getLogger(name)
    level = os.environ.get("LOG_LEVEL", "INFO")
    
    # Avoid adding multiple handlers if setup is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = JSONFormatter()
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    return logger
