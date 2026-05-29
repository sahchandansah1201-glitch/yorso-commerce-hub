# Next Actions

## Current Next Action

Backend Phase 2G is implemented and committed locally at `9485bd36`.

Phase 2G turns the Phase 2F password recovery outbox into an owned
self-hosted delivery runtime. It does not add Supabase, hosted BaaS, SaaS email
provider coupling or public UI layout changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Worker leasing | Обрабатывать `yorso_auth_password_recovery_outbox` bounded batches. | Реализовано: `leasePasswordRecoveryDeliveryJobs`; PostgreSQL uses ordered `for update skip locked`, excludes expired/used recoveries and decrypts only after lease. | Queue-age stats позже. |
| Sender | Нужен self-hosted provider-neutral handoff. | Реализовано: `FileSpoolPasswordRecoverySender` writes `0600` JSON handoff with reset URL/token. | SMTP only if self-hosted/operator-owned. |
| Scheduler/runtime | Worker должен работать вне public request handlers. | Реализовано: `PasswordRecoveryDeliveryScheduler`, `createPasswordRecoveryDeliveryRuntime`, server start/stop lifecycle. | Admin runtime visibility later if needed. |
| Retry/failure | Failed sends должны retry/backoff без секретов в ошибках. | Реализовано: sent/failed/requeued states, retry delay, max attempts, sanitized email/phone/reset-token errors. | Dead-letter review later. |
| Production guard | Production must fail closed without owned recovery delivery runtime. | Реализовано: config requires enabled worker, `file_spool`, absolute spool dir; env/compose/guards updated. | Retention runbook later. |
| Metrics | Нужны worker metrics без PII/token labels. | Реализовано: password recovery delivery worker runs/jobs metrics by worker id/result only. | Queue-age gauges later. |
| Documentation | План/факт и 10k review должны быть зафиксированы. | Реализовано: Phase 2G doc, production baseline, deployment doc and frontend/backend contract updated. | Закрыто в commit `9485bd36`. |

## Next Implementation After Phase 2G

Recommended next scoped workstream:

Backend Phase 2H: password recovery abuse-control and cleanup policy.

Concrete scope:

- rate-limit password reset request bursts without account enumeration;
- add cleanup/retention policy for expired/used password recovery tokens and
  sent/failed delivery rows;
- keep public responses constant-shape for known and unknown accounts;
- preserve self-hosted production-only runtime and no hosted provider coupling.

Alternative:

Self-hosted consolidation pass for remaining legacy Supabase/prototype surfaces
route-by-route, without changing public UX.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Self-contained product direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
