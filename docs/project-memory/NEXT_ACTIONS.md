# Next Actions

## Current Next Action

Backend Phase 2H is implemented and committed locally at `8a8ac50f`.

Phase 2H adds account-enumeration-safe password reset abuse control and a
bounded cleanup policy for password recovery tokens/outbox rows. It does not
add Supabase, hosted BaaS, SaaS email provider coupling or public UI layout
changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Password reset rate limit | Ограничить частые reset-запросы по email/IP, не раскрывая наличие аккаунта. | Реализовано: `AuthRateLimiter.checkPasswordReset/recordPasswordReset`; service checks before account lookup; public response remains generic for known/unknown until limit is exceeded. | Наблюдение через security events/telemetry. |
| Rate-limit event | Нужен отдельный audit/security marker. | Реализовано: `password_reset_rate_limited` in contracts + migration 0030; server test covers 429 without email leak. | В future admin/security dashboard можно вывести агрегаты. |
| Cleanup repository | Нужна bounded очистка expired/used tokens и terminal outbox rows. | Реализовано: `cleanupPasswordRecovery` in memory/Postgres; ordered limited deletes and retention cutoffs. | Phase 2I подключит runtime/scheduler/CLI. |
| Cleanup worker | Нужна reusable policy object без request-handler coupling. | Реализовано: `PasswordRecoveryCleanupWorker` computes cutoffs and delegates to repository. | Phase 2I определит запуск и production config. |
| DB/indexes | Cleanup должен масштабироваться на 10k concurrent-user baseline. | Реализовано: `0030_auth_password_recovery_abuse_cleanup.sql` adds cleanup indexes and security event type. | После runtime wiring добавить queue/cleanup age observability. |
| Smoke/guards/docs | Self-hosted runtime must fail closed and be проверяемым. | Реализовано: env/compose/guards/smoke/docs updated; `password_reset_rate_limit_guard=ok`. | Закрыто в commit `8a8ac50f`. |

## Next Implementation After Phase 2H

Recommended next scoped workstream:

Backend Phase 2I: password recovery cleanup runtime/scheduler path.

Concrete scope:

- wire `PasswordRecoveryCleanupWorker` into an owned maintenance runtime,
  scheduler or explicit CLI command;
- add runtime config for cleanup interval, retention and batch size if needed;
- add smoke/guard coverage that cleanup runs outside public request handlers;
- document read/write profile, backpressure, DB indexes, failure mode and
  observability for the 10,000 concurrent-user baseline;
- preserve no hosted provider/Supabase production dependency.

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
