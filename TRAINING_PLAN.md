# AI-ML-1 Scheduler Engine — TRAINING PLAN

> **Warning:** This project is being developed locally. No training operations are authorized on the local laptop.
> All training operations described below are **DEFERRED** to a cloud or Codespace environment.

## 1. MVP Phase: Contextual Multi-Armed Bandit

The MVP algorithm is a Contextual Multi-Armed Bandit that learns to schedule spectrum bands based on live contextual features. 
Because the physics context is unique to this simulation, we train this bandit **from scratch** on synthetic scenarios. No pretrained foundation models are used.

### 1.1 Algorithm Overview
- **Algorithm:** Linear Contextual Multi-Armed Bandit (Disjoint Linear Models)
- **Feature Representation:** The agent consumes an 11-dimensional feature vector for each candidate band (8 per-band features, 2 global receiver features, 1 bias term). Features include `time_since_last_scan`, `recent_detection_rate_ewma`, `consecutive_misses`, `periodicity_phase`, `periodicity_confidence`, etc.
- **Value Estimation:** For each band $a$, the expected reward is estimated as $Q_a(x) = \theta_a^T x$.
- **Action Selection:** $\epsilon$-greedy exploration.
- **Learning/Update Method:** Stochastic Gradient Descent (SGD) on the prediction error $Error = R_{true} - \hat{Q}$.

### 1.2 Hyperparameters
- **Initial Epsilon:** `1.0` (100% exploration at start)
- **Minimum Epsilon:** `0.01` (1% persistent exploration to handle non-stationary environments)
- **Epsilon Decay:** `0.995` per episode boundary
- **Learning Rate:** `0.01` with gradient clipping `[-10.0, 10.0]` for numerical stability

### 1.3 Seeding and Reproducibility
- **Seed Strategy:** Global seed (default `42`) injected into `np.random.RandomState`. Both the environment and the agent receive explicit seeds.
- tie-breaking during exploitation is handled deterministically via `np.argmax`.

### 1.4 Episode Structure and Reward Input
- **Episode Structure:** The harness will run episodes of $T$ steps (e.g., $T=1000$ simulation ticks). At the end of each episode, the training harness invokes `agent.decay_epsilon()`.
- **Reward Input:** The backend calculates the system reward. The agent receives this scalar via the `/internal/learn` REST endpoint (simulated locally via direct Python calls during training) and applies it to update $\theta_a$.

### 1.5 Future Training Command (Deferred)
To train the contextual bandit on Scenario A across 100 seeds safely within Google Colab, leveraging the `BackendTrainingAdapter`:
```bash
# DO NOT EXECUTE LOCALLY
# Requires a live implementation of BackendTrainingAdapter to supply RF Physics.
python -m ml.training.train_all \
    --algorithm bandit \
    --episodes 1000 \
    --seed 42 \
    --output-dir /content/drive/MyDrive/training_runs
```

### 1.6 Training Job Lifecycle
- `queued`: Request received, configuration validated, job ID issued.
- `running`: Actual training executor processing episodes.
- `failed`: Exception encountered during execution.
- `done`: Training complete, checkpoint written, model registered.

### 1.7 Training Configuration
Strict configuration parsing ensures we only train models with recognized schemas:
- Algorithm validation (e.g., must be `bandit`)
- Scenario identifier mapping
- Episode counts and seed ranges
- (Future) Hyperparameters like epsilon_decay, learning_rate.

### 1.8 Executor Architecture
The `TrainingOrchestrator` maintains an API boundary separate from the `TrainingExecutor`. Currently on the local laptop, the executor is mocked and defers execution to avoid hardware lockups.

### 1.9 Checkpoint Creation
- **Format:** Pure JSON (no pickle) storing the parameter matrix $\Theta$ (`num_bands` $\times$ `num_features`), schema version, and current $\epsilon$.
- **Location:** Saved in `ml/checkpoints/` and tracked by `registry.json`.
- **Serialization Guarantee:** The file must contain sufficient detail to fully reconstruct `ContextualBanditAgent` identically.

### 1.10 Registry Registration
Upon training completion, the artifact is logged in the `LocalModelRegistry` with metadata (`model_id`, `version`, `algorithm`, `status`).

### 1.11 Evaluation Gate
To pass the MVP gate, the trained contextual bandit must:
1. Statistically outperform a non-contextual random/round-robin baseline on Scenario A/B.
2. Demonstrate context sensitivity across changing periodicity phases.

### 1.12 Model Activation
**A model MUST NOT be activated merely because training completed.**
Model activation is a deliberate, explicit flow:
1. `TRAINED`: Training script yields a checkpoint and registers the identity.
2. `EVALUATION`: The checkpoint is put through Monte Carlo simulation against the baseline.
3. `ACCEPTANCE GATE`: The gate logic assesses statistical significance over threshold limits.
4. `MANUAL ACTIVATION`: Only if accepted, an explicit POST `/internal/models/{id}/activate` is invoked. It securely reconstructs the policy into the live memory of `SchedulerService`, hot-swapping the active policy seamlessly.

### 1.13 Future Cloud Execution
**ACTUAL TRAINING IS NOT EXECUTED DURING LOCAL DEVELOPMENT.**
All steps described here (job progression, checkpoint generation, evaluation scoring) will occur via Codespace or remote CI worker running the deferred scripts once dependencies are installed.

---

## 2. V1 Tabular Q-Learning

### 2.1 Algorithm
The Tabular Q-Learning agent uses a discrete, hashable state representation paired with an action space corresponding to the specific bands (`num_bands`). It iteratively updates Q-values according to the Bellman equation during training.

### 2.2 State Discretization
To prevent intractable Cartesian state explosions, the agent relies on a `StateDiscretizer` which maps continuous `StateVector` band features via configurable bins (defaulting to a single threshold on `recent_detection_rate_ewma`). It verifies the theoretical maximum state space bound (limit 1,000,000) prior to execution.

### 2.3 Q Update Equation
$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$
When a terminal state is reached, the bootstrapping term $\gamma \max_{a'} Q(s', a')$ evaluates to $0.0$.

### 2.4 Hyperparameters
- **$\alpha$ (Learning Rate)**: 0.1
- **$\gamma$ (Discount Factor)**: 0.99
- **$\epsilon$ (Exploration Rate)**: Starts at 1.0.
- **$\epsilon$ Decay**: 0.995 applied at episode boundaries.
- **Min $\epsilon$**: 0.01

### 2.5 Seed Strategy
All initialization tie-breaking, $\epsilon$-greedy exploration selection, and state traversals are deterministically bounded by a global random seed to ensure strict reproducibility requirements.

### 2.6 Future Episode Structure
Episodes run a predefined step length ending with a terminal transition, triggering $\epsilon$ decay prior to the start of the next episode simulation loop.

### 2.7 Checkpoint Strategy
Because standard state exploration is highly sparse, the Q-table is maintained natively as a Python dictionary and flattened to list-backed arrays within a standard JSON dump format. Missing states assume explicit $0.0$ bounds implicitly at runtime. 

### 2.8 Evaluation Requirement
**NO Q-LEARNING TRAINING WAS EXECUTED LOCALLY.**
Q-Learning model candidates are evaluated explicitly through the evaluation gate constructed in Level 6. The Contextual Bandit remains the primary MVP. Any activation of Q-Learning models is deferred to the explicit manual `/internal/models/{id}/activate` invocation.

---

## 3. Reproducibility & Regression (Level 8 Protections)

All algorithms generated by AI-ML-1 are mathematically locked by reproducibility test harnesses (`test_reproducibility.py` & `test_regression.py`). 
To ensure determinism remains protected in production, **all future remote training executions must statically record**:
- The initialization seed.
- The precise algorithm version (e.g. `bandit_v1`).
- The explicit model configuration schema.
- Feature boundaries and discretizer bins (if applicable).
- The exact environment version tracking the synthetic state generation logic.
- The JSON checkpoint version tag.