# Next Actions

## Current Next Action

Backend Phase 2I is implemented and committed locally at `70d65de6`.

Phase 2I wires the Phase 2H password recovery cleanup policy into an owned
self-hosted API scheduler. It does not add Supabase, hosted BaaS, SaaS email
provider coupling or public UI layout changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Cleanup scheduler | Запускать очистку password recovery вне public request handlers. | Реализовано: `PasswordRecoveryCleanupScheduler` вызывает worker, пропускает overlapping runs и пишет success/failure/skipped события. | Позже можно добавить admin visibility по queue/cleanup age. |
| Runtime factory | Включать cleanup только явной self-hosted настройкой. | Реализовано: `createPasswordRecoveryCleanupRuntime` создаёт scheduler только при `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`. | Production держит worker включённым. |
| API lifecycle | Старт/стоп cleanup должен быть связан с API process, а не с пользовательским запросом. | Реализовано: `createApiServer` стартует scheduler на `listening` и останавливает на `close`. | Закрыто в commit `70d65de6`. |
| Production guard | Production должен fail closed без cleanup runtime. | Реализовано: `assertSelfHostedProductionRuntime` требует `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`; env/compose содержат interval, batch, retention и worker id. | Retention values остаются config-owned. |
| Observability/smoke | Нужна проверка runtime без PII/token labels. | Реализовано: Prometheus metrics `yorso_api_password_recovery_cleanup_worker_*`; smoke ждёт `password_recovery_cleanup_runtime_guard=ok`. | Alert thresholds позже. |

## Next Implementation After Phase 2I

Recommended next scoped workstream:

Backend Phase 2J: auth/registration/password recovery closure audit.

Concrete scope:

- проверить Phase 2A-2I как единый self-hosted auth/registration/password
  recovery surface;
- подтвердить, что production path не зависит от Supabase/BaaS/provider runtime;
- сверить env examples, Docker Compose, production guards, smoke markers,
  metrics and docs;
- составить точный список оставшегося Supabase/prototype debt;
- выбрать следующий implementation step только после audit findings.

Alternative:

Backend Phase 3A: scoped legacy Supabase consolidation/removal for the first
remaining production-relevant surface found by Phase 2J.

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
