# Next Actions

## Current Next Action

Start the next scoped backend workstream after Backend Phase 2C.

Phase 2C adds a self-hosted registration verification delivery worker boundary.
It leases queued `yorso_registration_delivery_outbox` jobs, sends them through
an injectable sender interface, and marks each job `sent`, requeued or `failed`
without adding Supabase, hosted BaaS, external provider coupling or public UI
changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Worker lease boundary | Обрабатывать delivery outbox через bounded backend worker, а не через browser/mock state. | Реализовано: `RegistrationDeliveryWorker.processBatch` вызывает `leaseRegistrationDeliveryJobs` с `limit`, `workerId`, `leaseMs`. | Подключать runtime scheduler только отдельным Phase 2D решением. |
| PostgreSQL lease safety | Не допускать double-processing и не забирать невалидные registration drafts. | Реализовано: ordered `for update skip locked`, `attempt_count < max_attempts`, фильтр active draft до lease. | Нагрузочно проверить lease contention несколькими worker-процессами. |
| Sender boundary | Не хардкодить сторонний провайдер в backend core. | Реализовано: injectable `RegistrationVerificationDeliverySender`; sender получает backend-only destination и template key. | Реализовать self-hosted SMTP/SMS/WhatsApp adapter или явный no-provider dev sender. |
| Retry/failure | Не терять job при ошибке и не ретраить бесконечно. | Реализовано: `markRegistrationDeliveryFailed` requeue до `max_attempts`, затем `failed`; error text sanitization. | Добавить operator visibility/alerting для terminal failures. |
| Hygiene | Не отдавать verification code/full contact в browser или публичные surfaces. | Реализовано: worker message не содержит `code`/`verificationCode`; browser responses по Phase 2B остаются masked metadata only. | Сохранить контракт при sender adapter/admin console. |
| Validation | Проверить worker, repository boundary, contracts, migrations, runtime guards и build. | Passed: delivery-worker tests, TypeScript, contracts, DB migrations, focused API tests, lint, production-scale, self-hosted runtime, api build, diff check, production build. | Можно стартовать Phase 2D. |

## Next Implementation

Recommended next scoped workstream:

Backend Phase 2D: self-hosted verification sender and runtime scheduler
decision.

Concrete scope:

- choose the first production delivery adapter boundary for registration
  verification: self-hosted SMTP, owned SMS/WhatsApp gateway, or explicit
  operator/manual delivery mode;
- add a runtime scheduler/runner that calls `RegistrationDeliveryWorker`
  without blocking public registration routes;
- add provider/config fail-closed checks for production;
- add metrics for leased/sent/requeued/failed, queued job age and terminal
  failures;
- preserve Phase 2A account creation, Phase 2B safe delivery metadata and
  Phase 2C lease/retry semantics.

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
