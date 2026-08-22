# PROJECT OPERATING RULES

## 1. Project Scope

This repository is the Intelligent RF Spectrum Scan Strategy
simulation-only project.

Current implementation scope:
AI-ML-1 Scheduler Engine.

AI-ML-2 is reference-only unless explicitly instructed otherwise.

---

## 2. LOCAL MACHINE SAFETY — ABSOLUTE RULE

This project is being developed on the user's local laptop.

The AI agent MUST NOT:

- install system-level software
- install global Python/npm packages
- modify the operating system
- modify shell configuration
- modify PATH
- modify environment variables outside this project
- write files outside the repository root
- create files in the user's home directory
- access unrelated directories
- download models
- download datasets
- download training checkpoints
- start model training
- start GPU-intensive workloads
- start long-running training processes
- use external RF hardware
- access SDR devices
- access real RF/network capture data
- create operational RF capabilities

All file creation and modification MUST remain inside:

<PROJECT_ROOT>

If a required operation would write outside <PROJECT_ROOT>, STOP and report it.

---

## 3. NO UNAUTHORIZED DOWNLOADS

Do not download:

- ML models
- pretrained weights
- datasets
- large archives
- binaries
- external artifacts

Do not automatically execute commands such as:

pip install ...
npm install ...
apt install ...
brew install ...
curl ... | bash
wget ...
git clone ...
or equivalent download/install commands

unless explicitly approved by the user.

---

## 4. DEPENDENCY POLICY

Prefer libraries already available in the environment only when:

1. They are compatible with the project architecture.
2. They are part of the approved technology stack.
3. Their usage is recorded in DEPENDENCY_MANIFEST.md.
4. The code remains reproducible in a clean environment.

Never make the project depend on an unrelated preinstalled package merely because it happens to exist.

If a missing dependency is required:

DO NOT install it automatically.

Instead:
1. Record it in DEPENDENCY_MANIFEST.md.
2. Record why it is required.
3. Record the intended version/range if known.
4. Add the installation command to DOWNLOAD_PLAN.md.
5. Continue with implementation only if the missing dependency can be cleanly abstracted or mocked without reducing production correctness.
6. Inform the user that the dependency is pending.

---

## 5. TRAINING POLICY

Do NOT train models on this laptop.

Implementation must include:

- training code
- inference code
- evaluation code
- model registry interfaces
- checkpoint handling
- reproducibility utilities
- configuration
- seed management
- experiment definitions
- training documentation

But actual model training must NOT be executed locally.

When training is required:

1. Implement the complete training pipeline.
2. Validate it with lightweight deterministic/unit-test substitutes where possible.
3. Record the exact training command in TRAINING_PLAN.md.
4. Record required dependencies and compute requirements.
5. Record expected input/output artifacts.
6. Do not execute the training command.

Training will later be performed in a controlled cloud/Codespace environment.

---

## 6. ARTIFACT POLICY

Never download or generate large artifacts during normal development.

Use placeholders, fixtures, mocks, and deterministic synthetic test data where appropriate.

If a real model/checkpoint is eventually required:

Document:
- source
- version
- checksum if applicable
- expected location
- download procedure
- compatibility requirements

in DOWNLOAD_PLAN.md.

Do not download it automatically.

---

## 7. CODE QUALITY

Local restrictions MUST NOT reduce implementation quality.

The implementation must still be:

- production-quality
- modular
- typed
- testable
- deterministic where required
- documented
- observable
- maintainable
- contract-compatible
- integration-ready
- container-ready
- cloud-training-ready

Do not replace real functionality with fake implementations merely because local execution is restricted.

Use mocks/stubs only at clearly defined external boundaries.

---

## 8. ARCHITECTURE CONTRACT

Follow this priority:

1. PRD
2. root API_CONTRACT.md
3. AI-ML-1 README
4. AI-ML-1 API_CONTRACT.md
5. AI-ML-2 README/API contract for compatibility
6. existing project code
7. current user instruction

Never silently invent routes, fields, variables, schemas, or interfaces.

If a conflict is discovered:
STOP and report it.

Do not silently rewrite the contract.

---

## 9. AI-ML-1 BOUNDARY

AI-ML-1 owns:

- scheduler policy
- contextual bandit
- later Q-Learning/DQN/PPO when authorized
- state consumption
- action selection
- learning from backend-provided reward
- training
- evaluation
- model registry
- inference
- reproducibility
- observability

AI-ML-1 does NOT own:

- RF simulation
- ground truth generation
- emitter generation
- receiver mechanics
- detection engine
- reward calculation
- periodicity estimation
- frontend
- backend persistence
- WebSocket infrastructure

AI-ML-1 MUST NOT directly call AI-ML-2.

---

## 10. IMPLEMENTATION PROCESS

Implement one level at a time.

For each level:

1. Read all relevant documentation.
2. Inspect existing code.
3. Identify dependencies.
4. Implement only the requested level.
5. Add/update tests.
6. Run safe local verification.
7. Perform contract validation.
8. Perform integration-boundary validation.
9. Update documentation.
10. Report completion and remaining limitations.

Do not automatically continue to the next level.

---

## 11. NO ARCHITECTURAL DRIFT

Do not:

- rename contract fields
- rename routes
- change request/response schemas
- change ports without approval
- change service boundaries
- make AI-ML-1 call AI-ML-2
- move responsibilities between services
- introduce unnecessary frameworks
- add unnecessary dependencies

If an improvement appears useful but changes the contract:
STOP and ask for approval.

---

## 12. BEFORE ANY RISKY COMMAND

If a command could:

- download something
- install something
- modify files outside the repository
- consume significant CPU/GPU
- train a model
- start a long-running process
- modify system configuration

DO NOT execute it automatically.

Explain what it would do and record it in the appropriate planning file instead.

---

## 13. COMPLETION STANDARD

"Implemented" means the code is complete and production-quality even if:

- models are not trained
- external artifacts are not downloaded
- cloud-only dependencies are not installed locally

Use deterministic tests, mocks, fixtures, schemas, and interface validation to verify as much as possible without violating the local safety policy.




## MODEL SELECTION POLICY

Before implementing or training any ML model:

1. Determine whether the task actually requires a learned model.
2. Check the PRD for the prescribed algorithm.
3. Prefer the simplest model that can satisfy the measurable requirement.
4. If a suitable existing pretrained/open model could solve the task, document it as an option.
5. Do not download or use the model automatically.
6. Compare the proposed model against the prescribed MVP baseline.
7. Do not introduce a large pretrained/foundation model merely because it is available.
8. Do not fine-tune or train models locally.
9. Record possible external models/checkpoints in DOWNLOAD_PLAN.md.
10. Record possible training/fine-tuning procedures in TRAINING_PLAN.md.
11. The implementation must remain model-agnostic where practical.
12. Any model selection must preserve the existing API and StateVector contracts.

For the current MVP:
- Contextual Multi-Armed Bandit is the primary scheduler.
- Periodicity estimation uses the prescribed statistical estimator.
- Q-Learning is a later selectable option.
- DQN/PPO are not to be implemented/executed unless explicitly authorized after the MVP gate.