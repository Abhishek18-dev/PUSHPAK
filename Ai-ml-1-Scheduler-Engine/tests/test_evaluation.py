import pytest
from ml.evaluation.metrics import (
    calculate_pd, calculate_pfa, calculate_ait, 
    calculate_detection_latency, calculate_hpdr
)
from ml.evaluation.gates import calculate_improvement, MVPAcceptanceGate
from ml.evaluation.results import ComparisonResult, EvaluationMetrics

def test_calculate_pd():
    assert calculate_pd(80, 100) == 0.8
    assert calculate_pd(0, 100) == 0.0
    assert calculate_pd(50, 0) is None

def test_calculate_pfa():
    assert calculate_pfa(5, 100) == 0.05
    assert calculate_pfa(0, 50) == 0.0
    assert calculate_pfa(10, 0) is None

def test_calculate_ait():
    assert calculate_ait([10.5, 20.0, 15.0]) == 15.166666666666666
    assert calculate_ait([]) is None

def test_calculate_detection_latency():
    assert calculate_detection_latency([2.0, 4.0]) == 3.0
    assert calculate_detection_latency([]) is None

def test_calculate_hpdr():
    assert calculate_hpdr(9, 10) == 0.9
    assert calculate_hpdr(0, 0) is None

def test_calculate_improvement():
    # Higher is better (Pd)
    assert calculate_improvement(0.9, 0.8, higher_is_better=True) > 0 # +0.1
    assert calculate_improvement(0.7, 0.8, higher_is_better=True) < 0 # -0.1
    
    # Lower is better (AIT)
    assert calculate_improvement(10.0, 15.0, higher_is_better=False) > 0 # +5.0 improvement
    assert calculate_improvement(20.0, 15.0, higher_is_better=False) < 0 # -5.0 improvement

def test_mvp_gate_blocked():
    gate = MVPAcceptanceGate()
    # Create a dummy comparison result
    comp = ComparisonResult(
        scenario_id="A",
        seed=42,
        baseline_metrics=EvaluationMetrics(pd=0.5, pfa=0.1, ait=20.0, latency=5.0, hpdr=0.5),
        ml_metrics=EvaluationMetrics(pd=0.8, pfa=0.05, ait=10.0, latency=2.0, hpdr=0.9),
        pd_improvement=0.3,
        pfa_improvement=0.05,
        ait_improvement=10.0,
        latency_improvement=3.0,
        hpdr_improvement=0.4
    )
    
    res = gate.evaluate(comp)
    assert res.passed is False
    assert "BLOCKED" in res.reason
