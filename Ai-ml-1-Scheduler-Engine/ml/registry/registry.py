import json
import os
from typing import Dict, List, Optional
from pydantic import BaseModel

class ModelStatus:
    TRAINED = "trained"
    EVALUATED = "evaluated"
    ACTIVE = "active"
    ARCHIVED = "archived"
    FAILED = "failed"

class ModelMetadata(BaseModel):
    """
    Metadata identity for a registered model artifact.
    """
    model_id: str
    algorithm: str
    version: int
    created_at: str
    status: str
    checkpoint_path: str
    config: Dict
    eval_metrics: Optional[Dict[str, float]] = None

class LocalModelRegistry:
    """
    Simple local model registry to fulfill MVP requirements without external dependencies.
    Persists metadata to a local JSON manifest inside the checkpoints directory.
    """
    def __init__(self, registry_file: str = "ml/checkpoints/registry.json"):
        self.registry_file = registry_file
        self.models: Dict[str, ModelMetadata] = {}
        self._load()
        
    def _load(self):
        if os.path.exists(self.registry_file):
            with open(self.registry_file, "r") as f:
                data = json.load(f)
                for k, v in data.items():
                    self.models[k] = ModelMetadata(**v)
                    
    def _save(self):
        os.makedirs(os.path.dirname(self.registry_file), exist_ok=True)
        with open(self.registry_file, "w") as f:
            json.dump({k: v.model_dump() for k, v in self.models.items()}, f, indent=2)
            
    def register_model(self, model: ModelMetadata):
        self.models[model.model_id] = model
        self._save()
        
    def get_model(self, model_id: str) -> Optional[ModelMetadata]:
        return self.models.get(model_id)
        
    def list_models(self, algorithm: Optional[str] = None, active: Optional[bool] = None) -> List[ModelMetadata]:
        res = list(self.models.values())
        if algorithm is not None:
            res = [m for m in res if m.algorithm == algorithm]
        if active is not None:
            status_filter = ModelStatus.ACTIVE if active else None
            if status_filter:
                res = [m for m in res if m.status == status_filter]
        return res
        
    def mark_active(self, model_id: str):
        """
        Marks a specific model as active and archives any previously active models 
        for the same algorithm. Does not load it into inference (Service layer does that).
        """
        model = self.get_model(model_id)
        if not model:
            raise ValueError("Model not found in registry")
            
        # Deactivate previously active model
        for m in self.models.values():
            if m.algorithm == model.algorithm and m.status == ModelStatus.ACTIVE:
                m.status = ModelStatus.ARCHIVED
                
        model.status = ModelStatus.ACTIVE
        self._save()

# Global registry instance
model_registry = LocalModelRegistry()
