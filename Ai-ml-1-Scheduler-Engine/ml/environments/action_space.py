from pydantic import BaseModel, Field
from typing import Optional

class Action(BaseModel):
    """
    Action response sent from AI-ML-1 to the Backend per API_CONTRACT.md §4.
    
    The MVP action space consists solely of selecting the next band to scan.
    Dwell-time control is deferred to V2 (DQN/PPO).
    """
    next_band: int = Field(ge=0, description="The integer index of the band to tune to next.")
    dwell_time: Optional[int] = Field(None, description="Deferred to V2. Optional dwell time in ms.")
