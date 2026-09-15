# Stack.md — Technology Stack

Provenance tags follow the same convention as the PRD: **[SOURCE REQUIREMENT]** = stated in the source PRD/master prompt, **[ARCHITECTURAL DECISION]** = chosen here to satisfy a source requirement, **[RECOMMENDATION]** = AI-suggested best practice, not mandated, **[TBD]** = unresolved.

Optimization order used throughout: **Security > Reliability > Maintainability > Performance > Developer Convenience.**

## Desktop UI

| Item | Detail |
|---|---|
| Technology | React Native for Windows/Desktop |
| Status | **[SOURCE REQUIREMENT]** — the master prompt mandates React Native for the desktop UI, replacing the earlier web dashboard. |
| Why | Reuses React component model the team may already know from the prior dashboard, while targeting a native Windows shell instead of a browser. |
| Alternatives considered | Electron+React (heavier, ships a full Chromium runtime — larger attack surface for a security-sensitive app); native WinUI/WPF (steeper learning curve for a student team). **[RECOMMENDATION]** |
| Limitation to flag | React Native for Windows has a smaller component/library ecosystem than web React; complex data-dense panels (spectrum waterfall, multi-panel dashboards) may need custom native modules. **[RECOMMENDATION]** If this proves infeasible after a Phase-1 spike, Electron+React is the documented fallback — record any such deviation explicitly rather than silently switching. |

## Backend

| Item | Detail |
|---|---|
| Technology | Java + Spring Boot (Spring Security, Spring Data JPA, Hibernate, Bean Validation) |
| Status | **[SOURCE REQUIREMENT]** |
| Purpose | Core orchestration boundary: simulation engine, receiver/detection, StateBuilder, scheduler orchestration, metrics, experiment management, model registry, auth, audit, config, API/IPC layer. |
| Security considerations | Spring Security enforces RBAC on every endpoint; no endpoint should be reachable without an authenticated, authorized session. |

## AI/ML

| Item | Detail |
|---|---|
| Technology | Python (isolated services, not embedded in the Java process) |
| Status | **[SOURCE REQUIREMENT]** |
| Components | AI-ML-1 (Intelligent Scheduler — contextual multi-armed bandit at MVP, escalation to Q-Learning/DQN/PPO only after beating baseline) and AI-ML-2 (Periodicity Estimator). **[SOURCE REQUIREMENT]** |
| Boundary rule | AI-ML-2 must not directly control the frontend; AI-ML-1 must not bypass the backend. The Java backend is the sole orchestration/policy boundary. **[SOURCE REQUIREMENT]** |

## Database

| Item | Detail |
|---|---|
| Technology | PostgreSQL, running locally, never exposed to an external network |
| Status | **[ARCHITECTURAL DECISION]** — PostgreSQL is the source PRD's default; retained here because it gives transactional integrity, mature backup/restore, and row-level-security options useful for auditability, while still running entirely on localhost. |
| Alternatives considered | SQLite/embedded Postgres/DuckDB — simpler to ship but weaker on concurrent read/write from backend + reporting simultaneously. **[RECOMMENDATION]** Revisit if actual concurrency needs turn out to be trivial. |
| Exposure rule | `Desktop App -> Local Java Backend -> Local PostgreSQL`, never `Internet -> PostgreSQL`, and never a direct Frontend-to-DB path. **[SOURCE REQUIREMENT]** |

## Redis

**[RECOMMENDATION] Remove.** Redis existed in the prior web-dashboard architecture for caching/session/pub-sub across browser clients. A single-user local desktop process has no cross-instance session or distributed-cache need; use in-process pub/sub (e.g., Spring's `ApplicationEventPublisher` or a local event bus) for real-time UI events instead. If a future multi-workstation lab deployment reintroduces a genuine caching need, Redis (bound to localhost/lab network only, never internet-facing) can be reconsidered — but it should not be carried forward by default.

## Authentication

**[RECOMMENDATION]** — no authentication standard is mandated by the source material.

- MVP: local username/password + a second factor (TOTP or a hardware-backed key).
- Where the workstation is domain-joined: Windows-integrated authentication.
- Longer-term hardening: smart-card/PKI client certificates, TPM-backed key storage.
- **[TBD]** Any DRDO-mandated authentication standard for an actual deployment must be confirmed by an authorized DRDO/security authority; none is assumed here.

## Local IPC / API

**[TBD]** — exact transport (authenticated REST over `127.0.0.1` vs. named pipes vs. gRPC over a Unix domain socket/Windows named pipe) requires a technical spike. **[RECOMMENDATION]** Start with authenticated REST over loopback with a per-session token — simplest to secure and test — and only move to a lower-level IPC mechanism if measured latency requires it.

## Testing

**[RECOMMENDATION]**

- Java: JUnit + Spring Boot Test (unit/integration/API/security/DB).
- Python: pytest (model, data, inference, training, evaluation).
- Desktop UI: Jest + React Native Testing Library; manual E2E pass for the demo script.
- Security: dependency scanning (OWASP Dependency-Check), static analysis, secrets scanning.

## Build & Packaging

**[RECOMMENDATION]** Gradle or Maven for the Java backend; standard React Native for Windows build tooling for the UI; a signed Windows installer (e.g., MSIX/WiX) for packaging, with offline update packages rather than assumed internet-based auto-update. **[SOURCE REQUIREMENT: do not assume internet-based automatic updates are appropriate.]**

## Documentation

Markdown + Mermaid/ASCII diagrams, consistent with this document set (PRD.docx, Stack.md, Architecture.md, README.md).

---
*All figures and system specifications elsewhere in this project's PRD that describe real-world DRDO/DSJ systems (Samyukta's frequency range, PHD sensing Pd/Pfa values, PSO scheduling gains, etc.) are cited to the reference list in PRD.docx Section 21 — nothing in this stack document is drawn from those sources, as this document is purely architectural.*
