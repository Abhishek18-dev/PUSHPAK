# FUTURE_SETUP_PLAN.md — Single Master Tracker for Deferred Work

> **Last Updated:** 2026-08-22  
> **Scope:** AI-ML-1 Scheduler Engine  
> **WARNING:** Writing a command into this file does NOT mean executing it.  
> No deferred command may be executed on the local machine without explicit user authorization.  
> This file ensures nothing required later is forgotten.

---

### 18.5 Future Statistical Analysis
Future iterations may employ scipy/pandas to run statistical significance (e.g. Welch's t-test) on the metric deltas prior to promotion.

### 18.6 Missing Evaluation Thresholds (BLOCKED)
Currently, exact numerical thresholds for MVP acceptance (e.g., minimum Pd improvement) are MISSING from the authoritative documentation (`API_CONTRACT.md`, `README.md`).
Before a real model promotion can occur, the Product Owner must specify exact numerical values for:
- Minimum Pd improvement
- Minimum AIT improvement
- Minimum HPDR improvement
- Maximum Pfa acceptable threshold
These must be passed into `MVPAcceptanceThresholds`.

---

## 1. Deferred Dependencies

### 1.1 Core MVP Dependencies (Status: Availability Unverified)

| # | Item | Why Required | Phase / Level | Source | Version | Size | Destination | Dependencies | Install Command | Tier | Verification | Safety Notes | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1.1.1 | Python 3.11+ | Runtime for FastAPI service | MVP / L1 | python.org | ≥3.11 | ~30 MB | System Python or .venv | None | `python --version` (verify only) | MVP | `python --version` returns ≥3.11 | Do NOT install globally — verify existing | **UNVERIFIED** |
| 1.1.2 | FastAPI | REST framework for internal API | MVP / L1 | PyPI | ≥0.100 | ~1 MB | .venv | Python, pydantic, starlette | `pip install fastapi` | MVP | `python -c "import fastapi; print(fastapi.__version__)"` | Install in venv only | **UNVERIFIED** |
| 1.1.3 | Uvicorn | ASGI server | MVP / L1 | PyPI | ≥0.27 | ~0.5 MB | .venv | Python | `pip install uvicorn[standard]` | MVP | `uvicorn --version` | Install in venv only | **UNVERIFIED** |
| 1.1.4 | NumPy | Numerical operations for bandit | MVP / L2 | PyPI | ≥1.24 | ~15 MB | .venv | Python | `pip install numpy` | MVP | `python -c "import numpy; print(numpy.__version__)"` | Install in venv only | **DEFERRED (L2)** |
| 1.1.5 | Gymnasium | RL environment interface | MVP / L2 | PyPI | ≥0.29 | ~5 MB | .venv | Python, NumPy | `pip install gymnasium` | MVP | `python -c "import gymnasium; print(gymnasium.__version__)"` | Install in venv only | **DEFERRED (L2)** |
| 1.1.6 | PyYAML | Config/scenario file loading | MVP / L1 | PyPI | ≥6.0 | ~0.5 MB | .venv | Python | `pip install pyyaml` | MVP | `python -c "import yaml; print(yaml.__version__)"` | Install in venv only | **UNVERIFIED** |
| 1.1.7 | Pytest | Testing framework | MVP / L1 | PyPI | ≥7.0 | ~3 MB | .venv (dev) | Python | `pip install pytest` | MVP | `pytest --version` | Install in venv only; dev dependency | **UNVERIFIED** |

### 1.2 Implicit Dependencies (Not in DEPENDENCY_MANIFEST but likely needed)

| # | Item | Why Required | Phase / Level | Source | Version | Size | Destination | Dependencies | Install Command | Tier | Verification | Safety Notes | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1.2.1 | Pydantic | FastAPI request/response validation | MVP / L1 | PyPI (FastAPI dep) | ≥2.0 | ~2 MB | .venv | Python | Installed as FastAPI dependency | MVP | `python -c "import pydantic; print(pydantic.__version__)"` | Comes with FastAPI | **UNVERIFIED** |
| 1.2.2 | httpx or requests | Contract testing (test client) | MVP / L1 | PyPI | Latest | ~0.5 MB | .venv (dev) | Python | `pip install httpx` | MVP | `python -c "import httpx"` | Dev-only dependency | **UNVERIFIED** |
| 1.2.3 | pytest-asyncio | Async test support for FastAPI | MVP / L1 | PyPI | ≥0.21 | ~0.1 MB | .venv (dev) | Pytest | `pip install pytest-asyncio` | MVP | Not required | Dev-only | **NOT REQUIRED** (Tests are synchronous) |

### 1.3 V1 Dependencies (Post-MVP)

| # | Item | Why Required | Phase / Level | Source | Version | Size | Destination | Dependencies | Install Command | Tier | Verification | Safety Notes | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1.3.1 | (None additional) | Q-Learning uses NumPy only | V1 / L7 | — | — | — | — | — | — | V1 | — | — | N/A |

### 1.4 V2 Dependencies (Post-MVP Gate + Architecture Review)

| # | Item | Why Required | Phase / Level | Source | Version | Size | Destination | Dependencies | Install Command | Tier | Verification | Safety Notes | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1.4.1 | PyTorch | Deep learning backend for DQN/PPO | V2 / L9 | PyPI / pytorch.org | ≥2.0 | ~750 MB (CPU) / ~2 GB (CUDA) | .venv | Python | `pip install torch` (CPU) or `pip install torch --index-url https://download.pytorch.org/whl/cu118` (CUDA) | V2 | `python -c "import torch; print(torch.__version__)"` | Large download; cloud/Codespace only; do NOT install locally | **DEFERRED** |
| 1.4.2 | Stable-Baselines3 | DQN/PPO algorithm implementations | V2 / L9 | PyPI | ≥2.0 | ~5 MB | .venv | PyTorch, Gymnasium | `pip install stable-baselines3` | V2 | `python -c "import stable_baselines3; print(stable_baselines3.__version__)"` | Requires PyTorch; cloud/Codespace only | **DEFERRED** |

---

## 2. External Model Candidates

| # | Item | Why Considered | Phase / Level | Source | Version | Size | Destination | Dependencies | Download Command | Tier | Verification | Safety Notes | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2.1 | None required for MVP | Contextual bandit trains from scratch — tiny parameter space, no pretrained model exists for this domain | MVP / L3–L6 | N/A | N/A | N/A | N/A | N/A | N/A | MVP | N/A | No download needed | **NOT APPLICABLE** |
| 2.2 | SB3 pre-built algorithm classes | DQN/PPO algorithm implementations (not pretrained weights) | V2 / L9 | PyPI (Stable-Baselines3) | ≥2.0 | Included in SB3 package | .venv | SB3, PyTorch | `pip install stable-baselines3` | V2 | Import test | These are algorithm implementations, not pretrained models; training from scratch is required | **DEFERRED** |

---

## 3. Required Model / Artifact Downloads

| # | Item | Why Required | Phase / Level | Source | Version | Size | Destination | Dependencies | Download Command | Tier | Verification | Safety Notes | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3.1 | None | No pretrained models, datasets, or external artifacts are required for any level of AI-ML-1 | All | N/A | N/A | N/A | N/A | N/A | N/A | All | N/A | All training is from scratch on synthetic data | **NOT APPLICABLE** |

---

## 4. Cloud / Codespace Environment Setup

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 4.1 | GitHub Codespace or cloud VM | Execute training commands that are deferred from local laptop | MVP / L5+ | Python 3.11+, all MVP deps, sufficient CPU for bandit training | MVP | **DEFERRED** |
| 4.2 | GPU-enabled environment | DQN/PPO training | V2 / L9 | CUDA-compatible GPU, PyTorch with CUDA, ≥16 GB RAM | V2 | **DEFERRED** |
| 4.3 | Docker + Docker Compose | Container-based deployment and integration testing | MVP / L1+ | Docker Engine ≥24.0, Compose V2 | MVP | **DEFERRED** — verify Docker availability locally before assuming cloud-only |

---

## 5. Training Environment

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 5.1 | Bandit training environment | Train contextual bandit on scenarios A–G | MVP / L5 | CPU-only, minutes per scenario, deterministic seeds | MVP | **DEFERRED** — training code will be implemented locally but not executed |
| 5.2 | Q-Learning training environment | Train tabular Q-Learning on scenarios A–G | V1 / L7 | CPU-only, tens of minutes per scenario | V1 | **DEFERRED** |
| 5.3 | DQN/PPO training environment | Train deep RL agents | V2 / L9 | GPU preferred, hours per scenario | V2 | **DEFERRED** |

---

## 6. Fine-Tuning Environment

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 6.1 | None planned | All agents train from scratch; no fine-tuning of pretrained models is part of the current architecture | All | N/A | N/A | **NOT APPLICABLE** |

---

## 7. Dataset Preparation

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 7.1 | Synthetic scenario configs (A–G) | Define training/evaluation scenarios per PRD | MVP / L5 | YAML configs defining emitter distributions, band counts, duration | MVP | **TO BE CREATED** — implemented as config files within `ml/experiments/`, no download needed |
| 7.2 | Deterministic seed sets | Ensure reproducible training and evaluation | MVP / L5 | Seed ranges defined in training configs | MVP | **TO BE CREATED** — implemented in code, no download needed |

---

## 8. Training Commands (Documentation Only — DO NOT EXECUTE LOCALLY)

| # | Algorithm | Command | Config | Seeds | Expected Compute | Expected Output | Tier | Status |
|---|---|---|---|---|---|---|---|---|
| 8.1 | Contextual Bandit | `python -m ml.training.train_all --algorithm bandit --episodes 1000 --seed 42` | CLI args + Config Defaults | 0–99 | CPU, ~5 min | JSON Checkpoint + Metrics in `training_runs/` | MVP | **DEFERRED** — BackendTrainingAdapter missing |
| 8.2 | Contextual Bandit | Same as 8.1 (for Scenario B adapter) | Same | 0–99 | CPU, ~5 min | Versioned model | MVP | **DEFERRED** |
| 8.3 | Q-Learning | `python -m ml.training.train_all --algorithm q_learning --episodes 1000 --seed 42` | CLI Args | 0–99 | CPU, ~30 min | JSON Checkpoint + Metrics in `training_runs/` | V1 | **DEFERRED** |
| 8.4 | DQN | N/A (V2 Stretch) | N/A | 0–99 | GPU, ~2 hrs | Versioned model | V2 | **DEFERRED** |
| 8.5 | PPO | N/A (V2 Stretch) | N/A | 0–99 | GPU, ~2 hrs | Versioned model | V2 | **DEFERRED** |

---

## 9. Evaluation Commands (Documentation Only — DO NOT EXECUTE LOCALLY)

| # | Algorithm | Scenario | Command | Expected Output | Tier | Status |
|---|---|---|---|---|---|---|
| 9.1 | Bandit | A | `POST /internal/models/{id}/evaluate {"scenario":"A","episode_count":100}` | Pd, Pfa, AIT, latency, HPDR metrics | MVP | **DEFERRED** |
| 9.2 | Bandit | B | Same with `"scenario":"B"` | Same metrics | MVP | **DEFERRED** |
| 9.3 | Random baseline | A/B | Evaluate with random policy for comparison | Baseline metrics for MVP gate | MVP | **DEFERRED** |

---

## 10. Checkpoint / Model Registry Setup

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 10.1 | `ml/checkpoints/` directory | Store versioned model weights / Q-tables | MVP / L5 | Gitignored (already in `.gitignore`), Docker volume mount in production | MVP | **TO BE CREATED** — directory structure only |
| 10.2 | Model metadata storage | Track model versions, hyperparams, eval metrics | MVP / L5 | JSON metadata files alongside checkpoints, or SQLite if needed | MVP | **TO BE IMPLEMENTED** |

---

## 11. Environment Variables / Secrets

| # | Variable | Why Required | Phase / Level | Default Value | Notes | Tier | Status |
|---|---|---|---|---|---|---|---|
| 11.1 | `PORT` | Service port | MVP / L1 | `8500` | Per API_CONTRACT §7 | MVP | **TO BE CREATED** in `.env.example` |
| 11.2 | `LOG_LEVEL` | Logging verbosity | MVP / L1 | `INFO` | Structured JSON logging | MVP | **TO BE CREATED** |
| 11.3 | `CHECKPOINT_DIR` | Model checkpoint storage path | MVP / L5 | `./ml/checkpoints` | Gitignored | MVP | **TO BE CREATED** |
| 11.4 | `DEFAULT_EPSILON` | Initial exploration rate for bandit | MVP / L3 | `1.0` | Decays per episode | MVP | **TO BE CREATED** |
| 11.5 | `EPSILON_DECAY` | Exploration decay rate | MVP / L3 | `0.995` | Per-episode decay | MVP | **TO BE CREATED** |
| 11.6 | `SEED` | Global random seed | MVP / L2 | `42` | Reproducibility (NFR-006) | MVP | **TO BE CREATED** |

---

## 12. Docker / Cloud Deployment Setup

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 12.1 | Dockerfile | Container build for AI-ML-1 service | MVP / L1 | Python 3.11+ slim base, pip install requirements, expose 8500 | MVP | **TO BE CREATED** — code, not execution |
| 12.2 | docker-compose entry | Service orchestration | MVP / L1 | `ml-scheduler` service on port 8500 | MVP | **TO BE CREATED** — ownership TBD (see audit open question) |
| 12.3 | Docker image build | Build and test container locally | MVP / L1 | `docker build -t ml-scheduler .` | MVP | **DEFERRED** — requires Docker to be available locally |

### 12.4 Codespace Setup Command
```bash
# Future command to prepare environment
pip install -r requirements.txt
pytest tests/
```

---

## 13. Integration Steps

| # | Step | Why Required | Phase / Level | Prerequisites | Details | Tier | Status |
|---|---|---|---|---|---|---|---|
| 13.1 | Backend → AI-ML-1 connectivity | Validate `/internal/decide` end-to-end | MVP / L4+ | Backend Level 6+, AI-ML-1 Level 4+ | Backend calls AI-ML-1 via internal REST | MVP | **DEFERRED** — Backend not yet built |
| 13.2 | AI-ML-2 → Backend → AI-ML-1 flow | Validate periodicity features flow through | MVP / L4+ | All three services running | Full StateVector assembly | MVP | **DEFERRED** — both other services not yet built |
| 13.3 | Full Docker Compose orchestration | All services running together | Integration | All services at Level 6+ | `docker-compose up` starts all services | MVP | **DEFERRED** |

---

## 14. Production / Demo Setup

| # | Item | Why Required | Phase / Level | Details | Tier | Status |
|---|---|---|---|---|---|---|
| 14.1 | Trained bandit model | Demo requires a trained model to make decisions | MVP / L6 | Train bandit on scenarios A/B, verify it beats baseline | MVP | **DEFERRED** — training deferred to cloud |
| 14.2 | Prometheus metrics endpoint | Observability in production | V1 / L10 | `/metrics` endpoint in Prometheus format | V1 | **DEFERRED** |
| 14.3 | Load testing setup | Verify NFR-004 (≥5 concurrent simulations) | V1 / L10 | Load testing tool (locust or similar) | V1 | **DEFERRED** |

---

## 15. Final Verification Checklist

| # | Verification | When | How | Tier | Status |
|---|---|---|---|---|---|
| 15.1 | `/internal/health` returns `{"status":"ok"}` | L1 | `curl localhost:8500/internal/health` | MVP | **PENDING** |
| 15.2 | Gymnasium env step/reset with StateVector schema | L2 | `pytest tests/test_environment.py` | MVP | **DEFERRED (L2)** |
| 15.3 | Bandit convergence on synthetic data | L3 | `pytest tests/test_bandit.py` | MVP | **DEFERRED (L3)** |
| 15.4 | `/internal/decide` and `/internal/learn` endpoints work | L4 | `pytest tests/test_api.py` | MVP | **DEFERRED (L4)** |
| 15.5 | Training pipeline registers versioned model | L5 | `pytest tests/test_registry.py` | MVP | **DEFERRED (L5)** |
| 15.6 | **MVP GATE: Bandit beats random baseline on Scenario A/B** | L6 | `pytest tests/test_evaluation.py` — Pd/Pfa/AIT/latency/HPDR comparison | MVP | **DEFERRED (L6) / BLOCKED (thresholds missing)** |
| 15.7 | Q-Learning reproducible training + selection | L7 | `pytest tests/test_q_learning.py` | V1 | **DEFERRED (L7)** |
| 15.8 | Bit-for-bit reproducibility (NFR-006) | L8 | `pytest tests/test_reproducibility.py tests/test_regression.py tests/test_policy_isolation.py` | V1 | **AUTHORED / EXECUTION DEFERRED (L8)** |
| 15.9 | DQN/PPO selectable, inference <150ms | L9 | `pytest tests/test_dqn_ppo.py` | V2 | **PENDING** |
| 15.10 | ≥80% test coverage (NFR-007) | L10 | `pytest --cov=ml --cov-report=term-missing` | V1 | **PENDING** |
| 15.11 | Concurrency load test (NFR-004) | L10 | Load test with ≥5 concurrent simulations | V1 | **PENDING** |
| 15.12 | pip-audit clean (no known vulnerabilities) | L10 | `pip-audit` | V1 | **PENDING** |
| 15.13 | Full Docker Compose integration | Integration | `docker-compose up` — all services healthy | MVP | **PENDING** |
| 15.14 | API contract byte-for-byte compliance | All | Automated contract test suite | MVP | **PENDING** |

---

## Appendix: Open Questions for User

1. **Docker availability:** Is Docker Desktop installed on the local laptop? Can `docker build` / `docker-compose up` be run locally, or is this cloud-only?
2. **`docker-compose.yml` ownership:** Should AI-ML-1 create its own `docker-compose.yml`, or will the Backend provide one at root?
3. **`baseline` policy:** Does AI-ML-1 need to implement a `baseline` (round-robin) policy, or does the Backend bypass AI-ML-1 entirely for baseline mode?
4. **`decision_id` format:** The contract does not specify a format for `decision_id`. Proposed: `dec_<8-hex>` — acceptable?
5. **Python environment:** What Python version is installed? Which packages are available? (Run `python --version` and `pip list` to verify.)
6. **Virtual environment:** Should we create a `.venv` inside `Ai-ml-1-Scheduler-Engine/`, or at the project root?

---

## 19. V1 Q-Learning Extensions (Deferred Level 7)

### 19.1 Cloud Dependencies
No heavyweight ML frameworks are required. Tabular Q-Learning depends exclusively on `numpy` (already specified for MVP). 

### 19.2 Expected Q-table Size Considerations
To prevent Cartesian state explosion, the `StateDiscretizer` strictly requires feature configuration bounds. The theoretical maximum state space size is constrained to a safe limit of 1,000,000 states, returning errors if the bin combinations exceed this. Currently, using only `recent_detection_rate_ewma` with a threshold of 0.5 (2 bins) across 16 bands generates a perfectly safe theoretical limit of 65,536 states.

### 19.3 Checkpoint Strategy
Checkpoints utilize sparse Python Dictionaries mapped sequentially into JSON. Missing states are safely resolved to deterministic zeros at runtime instead of artificially expanding file bloat.

### 19.4 Evaluation and Activation Procedure
Evaluation utilizes the same deferred framework configured in Level 6. The `MVPAcceptanceGate` will evaluate both Contextual Bandit and Q-Learning policies against the identical baseline. 
**Important:** Q-Learning is NOT automatically promoted. The Bandit remains the primary MVP. Only a manual explicit `POST /internal/models/{id}/activate` will swap Q-Learning into the live `SchedulerService`.

### 19.5 Deferred Training Command
```bash
curl -X POST http://localhost:8500/internal/train \
     -H "Content-Type: application/json" \
     -d '{
           "algorithm": "q_learning",
           "scenario": "A",
           "episode_count": 2500,
           "seed_range": [0, 99],
           "hyperparams": {
               "learning_rate": 0.1,
               "discount_factor": 0.99,
               "epsilon_decay": 0.995
           }
         }'
```

---

## 20. CI / CD Workflows (Deferred Level 8)

### 20.1 Future Continuous Integration Design
The architecture is designed to support standard test pipelines protecting mathematical regression boundaries:
1. **Lint/Type Check**
2. **Unit Tests (`pytest`)**: Run core logic modules.
3. **Reproducibility Tests (`test_reproducibility.py`)**: Assert mathematical seed lockouts.
4. **Regression Tests (`test_regression.py`)**: Enforce exact numerical algorithmic consistency against arbitrary configuration drifts.
5. **Isolation Tests (`test_policy_isolation.py`)**: Confirm boundary firewalls between concurrent algorithm threads running in `SchedulerService`.

*Note: No GitHub Actions or CI runners are installed locally. This workflow conceptually documents future remote deployments only.*

---

## 21. AI-ML-1 Integration Handoff

This section explicitly defines exactly what AI-ML-1 requires from the other services.

### 21.1 From Backend
The Backend is the central orchestrator and the **only** service that calls AI-ML-1. AI-ML-1 expects:
- **State Assembly**: Backend must construct the complete `StateVector` for every request.
- **RF Simulation Physics**: Backend owns all ground-truth simulation execution, emitter physics, and scanning logic.
- **Reward Calculation (Eq 10.1)**: Backend must calculate the continuous scalar reward for the executed action and pass it into `/internal/learn`. AI-ML-1 does not calculate reward.
- **Timely Feedback**: Backend must invoke `/learn` in a timely asynchronous manner after `/decide` is completed.

### 21.2 From AI-ML-2
AI-ML-1 expects AI-ML-2 features to be pre-injected into the `StateVector` by the Backend prior to calling `/internal/decide`.
- **Required Inputs**: None directly (AI-ML-1 does not invoke AI-ML-2).
- **Required Injected Fields**: `periodicity_phase` and `periodicity_confidence` per band. AI-ML-1 trusts these floats natively.

### 21.3 From Frontend
- No direct visibility. The Frontend triggers Backend scenarios; Backend executes API commands.

---

## 22. Architectural Limitations (For Cloud Deployment)

### 22.1 Process-Local Decision Routing
The `SchedulerService` utilizes an in-memory dictionary (`self.decision_routes`) to map asynchronous `/learn` payloads back to the exact algorithm variant (`bandit` vs `q_learning`) triggered during `/decide`. 
- **Limitation**: This strictly requires a **single-process** worker (e.g., `uvicorn --workers 1`) or sticky sessions. If deployed across distributed pods, a `/learn` request might hit an adjacent worker missing the memory map, causing feedback loss or algorithm cross-contamination. 
- **Future Fix**: When scaling out, either migrate routing maps to a shared Redis cache or embed the target algorithm directly into the `decision_id` string payload (e.g., `dec_bandit_a1b2c3d4`).
