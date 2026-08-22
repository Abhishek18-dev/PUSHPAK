from typing import Dict, Any
from pydantic import BaseModel

class ScenarioDefinition(BaseModel):
    """
    Defines a deterministic evaluation scenario.
    Does NOT contain the simulator logic, just the configuration required 
    to spin up the Backend simulator for a fair baseline comparison.
    """
    scenario_id: str
    description: str
    num_bands: int
    duration_steps: int
    emitter_config: Dict[str, Any]
    receiver_config: Dict[str, Any]

# Known scenarios according to MVP documentation
SCENARIO_A = ScenarioDefinition(
    scenario_id="A",
    description="Random emitters / random activity",
    num_bands=10,
    duration_steps=1000,
    emitter_config={"behavior_class": "random"},
    receiver_config={"dwell_ms": 10, "tuning_delay": 2}
)

SCENARIO_B = ScenarioDefinition(
    scenario_id="B",
    description="Periodic emitters",
    num_bands=10,
    duration_steps=1000,
    emitter_config={"behavior_class": "periodic"},
    receiver_config={"dwell_ms": 10, "tuning_delay": 2}
)
