import pytest
import os
import shutil
from pathlib import Path
from typing import Tuple

from ml.environments.state import StateVector, BandState, ReceiverState
from ml.training.adapter import BackendTrainingAdapter, MockTrainingAdapter
from ml.training.train_bandit import train_bandit
from ml.training.train_q_learning import train_q_learning

# Helper to generate a dummy state without faking RF logic
def generate_dummy_state(num_bands: int = 16) -> StateVector:
    bands = []
    for i in range(num_bands):
        bands.append(BandState(
            band_id=i, time_since_last_scan=0, recent_detection_rate_ewma=0.0,
            consecutive_misses=0, periodicity_phase=0.0, periodicity_confidence=0.0,
            band_priority_weight=1.0, tuning_cost_to_band=0
        ))
    return StateVector(
        bands=bands,
        receiver=ReceiverState(tuned_bands=[], dwell_remaining_ms=0, tuning_delay_countdown_ms=0)
    )

class DummyTestAdapter(BackendTrainingAdapter):
    """A test-only adapter that does not perform simulation."""
    def __init__(self, max_steps: int = 10):
        self.step_count = 0
        self.max_steps = max_steps
        
    def reset(self) -> StateVector:
        self.step_count = 0
        return generate_dummy_state()

    def step(self, action: int) -> Tuple[StateVector, float, bool]:
        self.step_count += 1
        terminated = self.step_count >= self.max_steps
        return generate_dummy_state(), 1.0, terminated

def test_mock_adapter_fails_safely():
    adapter = MockTrainingAdapter()
    with pytest.raises(NotImplementedError):
        adapter.reset()

def test_bandit_training_pipeline_artifacts(tmp_path):
    adapter = DummyTestAdapter(max_steps=5)
    run_id = "test_run_01"
    
    summary = train_bandit(
        adapter=adapter,
        run_id=run_id,
        output_dir=tmp_path,
        episodes=2,
        max_steps_per_episode=5
    )
    
    assert summary["status"] == "TRAINED"
    assert summary["algorithm"] == "bandit"
    
    run_dir = tmp_path / "bandit" / run_id
    assert (run_dir / "checkpoint.json").exists()
    assert (run_dir / "config.json").exists()
    assert (run_dir / "metrics.json").exists()
    assert (run_dir / "training_summary.json").exists()

def test_q_learning_training_pipeline_artifacts(tmp_path):
    adapter = DummyTestAdapter(max_steps=5)
    run_id = "test_run_02"
    
    summary = train_q_learning(
        adapter=adapter,
        run_id=run_id,
        output_dir=tmp_path,
        episodes=2,
        max_steps_per_episode=5
    )
    
    assert summary["status"] == "TRAINED"
    assert summary["algorithm"] == "q_learning"
    
    run_dir = tmp_path / "q_learning" / run_id
    assert (run_dir / "checkpoint.json").exists()
    assert (run_dir / "config.json").exists()
    assert (run_dir / "metrics.json").exists()
    assert (run_dir / "training_summary.json").exists()
