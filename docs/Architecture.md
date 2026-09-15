# Architecture.md

*Note on scope: the master prompt requested separate `Architecture.md`, `Security.md`, and `Threat-Model.md` files. They are consolidated here because, for a project at this stage, splitting a ~2-page architecture description into three near-empty files would reduce readability without adding real content. If the project grows (e.g., a formal security review), splitting this file along its `##` headings is straightforward.*

Provenance tags: **[SOURCE REQUIREMENT]** / **[ARCHITECTURAL DECISION]** / **[RECOMMENDATION]** / **[ASSUMPTION]** / **[TBD]**.

## 1. Recommended Final Architecture

```
+------------------------------------------------------+
|            SECURE WINDOWS WORKSTATION                |
|                                                        |
|  React Native Desktop UI (Dashboard / Sim / Spectrum /|
|  Scheduler / ML / Experiments / Models / Reports)      |
+---------------------+----------------------------------+
        Secure Local IPC / Authenticated REST
+---------------------v----------------------------------+
|            JAVA / SPRING BOOT BACKEND                  |
| AuthN/AuthZ - Simulation - Receiver - Detection         |
| StateBuilder - Scheduler Orchestration - Metrics        |
| Experiment Manager - Model Registry - Audit - Reporting |
+-----------+--------------------------+-------------------+
   Secure ML Interface        Secure DB Interface
+-----------v----------+   +-------------v---------------+
| PYTHON AI/ML SERVICES |   |         POSTGRESQL          |
| AI-ML-1 Scheduler     |   | Simulations, Experiments    |
| AI-ML-2 Periodicity   |   | Models, Metrics, Audit      |
+------------------------+   +------------------------------+
        SECURITY / AUDIT / KEY MANAGEMENT LAYER
   (local auth store, TPM/PKI where available,
        RBAC enforcement, integrity checks)
```

**[ARCHITECTURAL DECISION]** This is local-first by design: the UI never talks to the database or the ML services directly, and no component is exposed to an untrusted network by default. **[RECOMMENDATION]** This is a starting point, not a locked decision — the two open evaluation points below should be revisited as the build proceeds.

- **Redis:** removed from the default architecture (see `Stack.md`) — no cross-instance cache/session need in a single-user local desktop app.
- **Local IPC transport:** **[TBD]** — start with authenticated REST over loopback; revisit only if latency measurements require a lower-level transport.

## 2. Process Model

**[RECOMMENDATION]**

- UI process (React Native shell) — no direct DB/ML access.
- Backend process (Spring Boot) — owns all orchestration, auth, and the audit log.
- AI/ML process(es) (Python) — invoked only through the backend's Secure ML Interface.
- Database process (PostgreSQL) — bound to `127.0.0.1`, reachable only from the backend.

Startup sequence (adapted from the master prompt's flow): OS login → launch app → integrity check → user authentication → authorization → start local backend → validate database → initialize AI services → health checks → load configuration → open workspace. **[RECOMMENDATION]**

## 3. Security Architecture

Security is treated as a first-class requirement, not an add-on, given the intended research/defense environment. **No claim of "military-grade," "DRDO-certified," "unhackable," or any specific government compliance is made** — everything below is either a recommendation subject to review or an explicit TBD pending an authorized DRDO/security authority.

| Area | Approach | Tag |
|---|---|---|
| Authentication | Password + second factor (TOTP/hardware key) at MVP; Windows-integrated auth where domain-joined; smart-card/PKI + TPM-backed keys as hardening | RECOMMENDATION |
| Authorization | Default-deny RBAC, least privilege, separation of duties across the roles in the PRD's permission matrix | RECOMMENDATION |
| Network | Local-first; no required internet access for simulate → train → evaluate → report; DB/ML/internal APIs never exposed externally | ARCHITECTURAL DECISION |
| Audit logging | Append-only log of login/logout/failed-login, role changes, simulation/experiment lifecycle, model upload/activation, config changes — each with timestamp, actor, action, resource, result, correlation ID | RECOMMENDATION |
| Data security | Encryption at rest for DB/model files, encryption for local IPC, secrets in an OS credential store (not source, config files, env vars, or plaintext logs) | RECOMMENDATION |
| Model integrity | Every model in the registry carries an integrity hash; activation requires validation → evaluation → integrity check → approval before use | RECOMMENDATION |
| Updates | Signed, offline-installable update packages; no assumed internet-based auto-update | SOURCE REQUIREMENT (do not assume internet auto-update is appropriate) |

## 4. Threat Model (condensed)

| Asset | Threat | Mitigation |
|---|---|---|
| Active ML model | Malicious/corrupted model silently activated | Integrity hash + approval gate before activation; rollback support |
| Ground-truth data | Leaks into scheduler's inference-time state | Explicit leakage test in CI; StateBuilder boundary code review |
| Audit log | Tampering by a local user with elevated access | Append-only storage; restrict write access to the backend process only |
| Local database | Unauthorized direct access, bypassing the backend | Bind to loopback only; no credentials shared with the UI |
| Credentials/secrets | Stored in code/config/logs | OS credential store; secrets scanning in CI |
| Software supply chain | Compromised dependency or unsigned update | Dependency pinning/scanning, code signing, build provenance |

**[TBD]** A full threat model with likelihood/impact/residual-risk scoring should be produced once implementation choices (exact IPC, auth mechanism) are locked in — the above is a starting checklist, not a completed risk register.

## 5. Where to find HLD/LLD detail

This file stays at the "why" level. For the "how" — module/package/class breakdown per stack, the database schema, sequence diagrams for the baseline-vs-ML run and model-activation flows, the full REST API endpoint list (UI↔Backend) and the internal Secure ML Interface (Backend↔AI/ML), and the stack-wise folder structure — see `HLD_LLD_and_API_Design.docx`.

## 6. Consistency Note

Every technology named here (React Native, Java/Spring Boot, Python, PostgreSQL, no Redis by default) matches `Stack.md`, `README.md`, and the PRD (`PRD.docx`). If any of these choices change, update all four documents together.
