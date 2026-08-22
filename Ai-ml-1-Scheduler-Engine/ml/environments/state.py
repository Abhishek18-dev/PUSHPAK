from typing import List, Dict, Any
from pydantic import BaseModel, Field
import numpy as np

class BandState(BaseModel):
    """Per-band feature representation as defined in API_CONTRACT.md §4."""
    band_id: int = Field(ge=0)
    time_since_last_scan: int = Field(ge=0)
    recent_detection_rate_ewma: float = Field(ge=0.0, le=1.0)
    consecutive_misses: int = Field(ge=0)
    periodicity_phase: float = Field(ge=0.0, le=1.0)
    periodicity_confidence: float = Field(ge=0.0, le=1.0)
    band_priority_weight: float = Field(ge=0.0)
    tuning_cost_to_band: int = Field(ge=0)

class ReceiverState(BaseModel):
    """Receiver constraints representation as defined in API_CONTRACT.md §4."""
    tuned_bands: List[int]
    dwell_remaining_ms: int = Field(ge=0)
    tuning_delay_countdown_ms: int = Field(ge=0)

class StateVector(BaseModel):
    """
    Full StateVector consumed by AI-ML-1.
    AI-ML-1 receives this from the Backend (StateBuilder) and converts it to a 
    Gymnasium observation for the RL policy.
    """
    bands: List[BandState]
    receiver: ReceiverState

    def to_observation(self, num_bands: int) -> Dict[str, np.ndarray]:
        """
        Converts the strictly typed Pydantic state into a flat Gymnasium-compatible 
        dictionary of NumPy arrays.
        
        Args:
            num_bands: The maximum number of configured bands (for matrix padding).
            
        Returns:
            A dictionary matching the spaces.Dict observation space.
        """
        # Feature matrix: shape (num_bands, 8)
        band_features = np.zeros((num_bands, 8), dtype=np.float32)
        for band in self.bands:
            idx = band.band_id
            if 0 <= idx < num_bands:
                band_features[idx] = [
                    band.band_id,
                    band.time_since_last_scan,
                    band.recent_detection_rate_ewma,
                    band.consecutive_misses,
                    band.periodicity_phase,
                    band.periodicity_confidence,
                    band.band_priority_weight,
                    band.tuning_cost_to_band
                ]
        
        # Receiver state: tuned_bands (multi-binary array)
        tuned_bands_arr = np.zeros(num_bands, dtype=np.int8)
        for tb in self.receiver.tuned_bands:
            if 0 <= tb < num_bands:
                tuned_bands_arr[tb] = 1
                
        # Receiver state: scalar features
        receiver_features = np.array([
            self.receiver.dwell_remaining_ms,
            self.receiver.tuning_delay_countdown_ms
        ], dtype=np.float32)

        return {
            "band_features": band_features,
            "tuned_bands": tuned_bands_arr,
            "receiver_features": receiver_features
        }
