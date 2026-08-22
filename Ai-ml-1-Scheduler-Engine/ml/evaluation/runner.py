from ml.evaluation.scenarios import ScenarioDefinition
from ml.evaluation.results import ScenarioResult, EvaluationMetrics
from ml.registry.registry import ModelMetadata

class EvaluationRunner:
    """
    Adapter boundary for triggering and consuming simulations from the Backend.
    AI-ML-1 DOES NOT OWN SIMULATION. This class represents the boundary where 
    we would ask the Backend to run a scenario with a specific policy, and then 
    we consume the returned raw events to calculate metrics.
    """
    
    def run_scenario(self, scenario: ScenarioDefinition, seed: int, model: ModelMetadata) -> ScenarioResult:
        """
        ACTUAL EVALUATION DEFERRED.
        In a real cloud environment, this would call the Backend simulation API,
        retrieve the raw detection log, and map it through ml/evaluation/metrics.py.
        """
        return ScenarioResult(
            scenario_id=scenario.scenario_id,
            seed=seed,
            algorithm=model.algorithm,
            model_version=str(model.version),
            duration_steps=scenario.duration_steps,
            metrics=EvaluationMetrics(
                pd=None, pfa=None, ait=None, latency=None, hpdr=None
            )
        )
