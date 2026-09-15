# Intelligent RF Spectrum Scan Strategy — DRDO/SIH Project

**Status:** Draft product documentation (pre-implementation). **Classification:** Unclassified project working document — not an official DRDO document.

## Project Overview

A simulation-only RF/EW research system that decides which of 16 synthetic RF bands a constrained receiver should scan next, comparing a deterministic baseline scanner against an adaptive ML scheduler under identical scenarios and random seeds. The system does **not** touch real RF hardware, does **not** intercept real communications, does **not** jam, and does **not** control weapons — this boundary is a hard requirement, not a suggestion. See `PRD.docx` Section 5 for full scope/non-goals.

The product is a **secure, local-first Windows desktop application**, not a website — see `Architecture.md`.

## Documentation Set

| File | Contents |
|---|---|
| `PRD.docx` | Full Product Requirements Document — problem statement, requirements, architecture, AI/ML design, metrics, MVP, roadmap, risks, traceability matrix, and the full reference list. **Start here.** |
| `Architecture.md` | System architecture, process model, security architecture, and condensed threat model. |
| `Stack.md` | Technology choices with rationale, alternatives considered, and provenance tags. |
| `HLD_LLD_and_API_Design.docx` | High-Level Design, Low-Level Design (module/package/class breakdown, DB schema, sequence flows), the full REST + internal ML API endpoint reference, and the stack-wise folder structure for `desktop/`, `backend/`, `ai-ml/`, `database/`, `security/`, `deployment/`, `tests/`, `docs/`. **Use this when you start writing code.** |
| `README.md` | This file. |

*The master prompt used to scope this project also requested `Design.md`, `Security.md`, `Threat-Model.md`, `API.md`, `Database.md`, `AI-ML.md`, `Testing.md`, and `Deployment.md` as separate files. At this stage of the project (pre-implementation, no code yet), those topics are covered as sections inside `PRD.docx` and `Architecture.md` rather than as separate near-empty files — splitting is straightforward once each area has enough real content (API contracts, DB schema, test plans) to justify its own document.*

## How Facts Are Sourced

Every real-world figure or system description in this documentation set (detection probabilities, DRDO system frequency ranges, published performance gains, etc.) is tagged with a reference like `[R2]` and traced to a source in `PRD.docx` Section 21 — drawn only from the project's own PRD and a curated set of Defence Science Journal / DRDO / IEEE sources. Everything else (role names, phase breakdown, security recommendations) is this project's own design work and is explicitly labeled `[RECOMMENDATION]`, `[ARCHITECTURAL DECISION]`, `[ASSUMPTION]`, or `[TBD]` rather than presented as fact. See the legend at the start of `PRD.docx`.

## Technology Stack (summary — see `Stack.md` for full rationale)

- **Desktop UI:** React Native for Windows/Desktop
- **Backend:** Java + Spring Boot
- **AI/ML:** Python (isolated services — AI-ML-1 scheduler, AI-ML-2 periodicity estimator)
- **Database:** PostgreSQL (local only, never network-exposed)
- **Cache:** none by default (Redis removed — see `Stack.md` for why)

## Current Project Stage

This repository currently contains **documentation only** — no implementation yet. Suggested next steps, in order (see `PRD.docx` Section 15 for full roadmap):

1. Architecture/security foundation spike (confirm local IPC transport).
2. Desktop shell skeleton (React Native for Windows — validate feasibility early).
3. Java backend skeleton with auth.
4. Simulation engine (5 emitter classes, reproducible from seed).
5. Receiver & detection engine.
6. Deterministic baseline scanner.
7. Periodicity estimator, then the bandit-based intelligent scheduler.

## Open Questions Before Implementation

See `PRD.docx` Section 19 for the full list. The most consequential ones:

- Formal mathematical definitions of Pd, Pfa, AIT, latency, HPDR, scan efficiency for this specific simulation are **not yet defined** in the source material.
- Default reward-function weights (`w1`–`w6`) and their units are **not yet defined**.
- No DRDO-mandated security certification is confirmed to apply to this project — all security language is framed as "designed per defense-oriented principles," not as certified compliance.

## License

**[TBD]** — not specified in the source material.
