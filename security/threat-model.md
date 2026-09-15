# Threat Model & Security Policy

## 1. System Boundary & Assets
The Intelligent RF Spectrum Scan Strategy operates as a local-first workstation software system on `127.0.0.1`.

| Asset | Sensitivity | Protection Mechanisms |
|---|---|---|
| **Ground-Truth Scenario Data** | Confidential / Anti-Cheating | Isolated within Backend `GroundTruthGenerator`; never exposed to `StateBuilder` or ML services. |
| **Active ML Model Weights** | High / Operational Integrity | Cryptographic hash verification on activation, rollback capability. |
| **Audit Trail Logs** | High / Accountability | Append-only database records with correlation IDs and timestamps. |
| **Local IPC & APIs** | Medium / Process Isolation | Authenticated loopback REST & WebSocket (`127.0.0.1:8080`), not bound to external interfaces. |

## 2. Risk Register & Mitigations

| Threat ID | Threat Description | Severity | Mitigation Strategy |
|---|---|---|---|
| **T-01** | Ground-truth leakage into scheduler inference state | Critical | Hard isolation in Java `StateBuilder`: StateVector only exposes observable metrics ($P$, EWMA, tuning cost, periodicity phase). CI test verifies zero leakage. |
| **T-02** | Malicious or degraded ML model activation | High | Two-step model activation gate (Validation -> Evaluation -> Approval -> Active) with instant rollback to previous model. |
| **T-03** | Unauthorized direct database access | High | PostgreSQL bound strictly to localhost; credentials managed via local application configuration. |
| **T-04** | Fabricated / Hardcoded ML results | High | End-to-end execution of genuine LinUCB/SGD contextual bandit and Rayleigh periodicity estimators; no mock data or client-side random number generation. |
| **T-05** | Audit log tampering | Medium | Append-only database records; write access restricted to backend service context. |
