---
name: yorso-service-architecture-agent
description: Use for Yorso backend, API, contract, persistence, queue, scheduler, auth/account/supplier/storage, and admin tooling changes. Validates service boundaries, source of truth, policy enforcement, contract drift, database strategy, backpressure, observability, and 10,000 concurrent-user readiness.
---

# Yorso Service Architecture Agent

## Purpose

Keep Yorso a self-contained product with clear service boundaries and no hidden
hosted BaaS/Supabase production dependency.

## Architecture Checklist

1. Source of truth
   - Which module owns the state?
   - Which route/API is authoritative?
   - What remains local preview only?
2. Contract boundary
   - Shared schemas live in `packages/contracts`.
   - Browser-visible payloads must be sanitized.
   - Error codes should be stable and tested.
3. Policy enforcement
   - Risk-bearing behavior belongs in backend policy/service code.
   - UI friction is not security enforcement unless backed by server contract.
   - Any UI/e2e/docs phrase like "requires", "must", "cannot" or "blocked"
     must have backend contract rejection and API route tests if it is a
     production policy claim.
4. Persistence
   - Migration needed or explicitly not needed.
   - Indexing/order/pagination strategy documented.
   - Mutations are transactional where audit and state must move together.
5. Runtime profile
   - Expected reads/writes per action.
   - Queue/scheduler/backpressure behavior.
   - Failure and graceful degradation behavior.
   - Request body limits, timeouts and cancellation paths are explicit for
     externally reachable APIs.
   - No avoidable event-loop blocking, unbounded search, unbounded fan-out or
     noisy polling.
6. Observability
   - Audit events, metrics, logs, smoke markers.
   - No PII/secrets in metric labels or logs.
   - Correlation/request ids exist where a user-facing action crosses async
     workers, queues or external boundaries.
7. Dependency and runtime hardening
   - Existing runtime/library first; new dependencies need license,
     maintenance, security and operational rationale.
   - Experimental Node/Next/runtime features require an explicit decision and
     fallback.
   - Boundary validation and least-returned-data are part of the design, not a
     late UI cleanup.
8. Scale baseline
   - 10,000 concurrent-user review exists in `docs/backend/production-scale-baseline.md`.

## Red Flags

- UI duplicates backend policy tables.
- Backend accepts optional audit reasons for actions that product treats as
  mandatory without an explicit decision.
- UI requires a field such as `reasonCode` while backend schema accepts
  `undefined` or silently falls back.
- Guard script checks only string markers and no behavior test exists.
- Project-memory `head_commit` does not distinguish implementation commit from
  documentation checkpoint.
- Route accepts unbounded request bodies or performs CPU-heavy synchronous work
  on user-controlled input.
- Runtime-impacting code has no timeout, retry, backpressure or degraded-mode
  decision.
- A new dependency is added because it is convenient, without proving it is
  safer than existing project code.

## Output Contract

Return in Russian:

| Решение | Архитектурный риск | Проверка | Нужно изменить |
|---|---|---|---|

End with the next smallest safe architecture step.
