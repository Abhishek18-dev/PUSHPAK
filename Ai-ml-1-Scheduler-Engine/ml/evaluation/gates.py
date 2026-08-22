from ml.evaluation.results import ComparisonResult, GateResult
from typing import Optional

class MVPAcceptanceThresholds:
    """
    Configuration holding exact numerical thresholds for MVP acceptance.
    Currently Unspecified by Authoritative Documentation.
    """
    def __init__(
        self,
        min_pd_improvement: Optional[float] = None,
        min_pfa_improvement: Optional[float] = None,
        min_ait_improvement: Optional[float] = None,
        min_hpdr_improvement: Optional[float] = None,
    ):
        self.min_pd_improvement = min_pd_improvement
        self.min_pfa_improvement = min_pfa_improvement
        self.min_ait_improvement = min_ait_improvement
        self.min_hpdr_improvement = min_hpdr_improvement

class MVPAcceptanceGate:
    """
    Evaluates whether an ML model passes the MVP acceptance criteria 
    against a baseline model.
    """
    def __init__(self, thresholds: MVPAcceptanceThresholds = MVPAcceptanceThresholds()):
        self.thresholds = thresholds
    
    def evaluate(self, comparison: ComparisonResult) -> GateResult:
        """
        Evaluates the comparison result.
        
        The project documentation specifies that the model must "demonstrate 
        measurable improvement over the open-loop baseline". 
        However, EXACT numerical thresholds are missing.
        """
        if (self.thresholds.min_pd_improvement is None or 
            self.thresholds.min_ait_improvement is None or 
            self.thresholds.min_hpdr_improvement is None):
            
            return GateResult(
                passed=False,
                reason="BLOCKED: Exact acceptance thresholds are unspecified in documentation.",
                failed_criteria=["unspecified_thresholds"]
            )
        
        # Future logic for threshold evaluation will go here
        return GateResult(passed=False, reason="Blocked", failed_criteria=[])

def calculate_improvement(ml_val: float, baseline_val: float, higher_is_better: bool) -> float:
    """Helper to calculate objective improvement directionally."""
    if higher_is_better:
        return ml_val - baseline_val
    else:
        return baseline_val - ml_val
