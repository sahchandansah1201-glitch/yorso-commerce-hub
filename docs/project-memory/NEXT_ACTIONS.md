# Next Actions

## Current Next Action

Start the next scoped backend workstream after Backend Phase 2D.

Phase 2D adds the first owned registration verification delivery runtime:
an opt-in background scheduler and a self-hosted `file_spool` sender that writes
durable JSON delivery handoff files to a mounted local directory. It does not
add Supabase, hosted BaaS, SaaS email/SMS/WhatsApp provider coupling or public
UI changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Runtime scheduler | Запускать обработку outbox вне request handlers и не допускать overlap. | Реализовано: `RegistrationDeliveryScheduler` с `start`, `stop`, `runOnce`, bounded worker options и skip при уже активном batch. | Если API-process scheduler станет операционно тесным, вынести в отдельный process/command. |
| Sender decision | Выбрать первый self-hosted sender без SaaS/provider coupling. | Реализовано: `FileSpoolRegistrationVerificationSender` пишет JSON handoff-файлы с mode `0600` в owned spool dir. | Phase 2E должен решить OTP/channel semantics перед реальной внешней доставкой. |
| Production guard | Production не должен стартовать без delivery runtime. | Реализовано: production guard требует `YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=true`, `YORSO_REGISTRATION_DELIVERY_SENDER=file_spool` и абсолютный spool path. | Добавить sender-specific readiness, когда появится не-file adapter. |
| Metrics | Видеть worker outcomes без утечки контактов. | Реализовано: Prometheus counters по run outcome/job result/worker id; email/phone/destination не используются как labels. | Добавить queue-age gauges после появления repository queue stats. |
| Infra/env | Deployment должен иметь owned spool volume и явные env knobs. | Реализовано: `.env.example`, `.env.production.example`, `infra/docker-compose.yml` и guard scripts обновлены. | Нужен operator runbook для retention/архивации spool files. |
| OTP policy | Не смешивать runtime scheduler с изменением verification-code policy. | Не реализовано в Phase 2D: текущая prototype OTP policy в `AuthService` сохранена. | Следующий конкретный workstream: Phase 2E заменить фиксированный prototype code на per-request OTP и определить безопасный payload/channel handoff. |
| Validation | Проверить runtime, infra guards, API guards, migrations, lint, build. | Passed: focused API tests, TypeScript, self-hosted infra/runtime/API guards, production-scale guard, DB migrations, lint, api build, diff check, production build. | Можно стартовать Phase 2E. |

## Next Implementation

Recommended next scoped workstream:

Backend Phase 2E: registration OTP generation and channel delivery semantics.

Concrete scope:

- replace the fixed prototype registration code policy with per-request OTP
  generation, expiry and attempt rules;
- decide how the self-hosted file-spool handoff carries code material safely,
  or introduce an owned channel adapter boundary without SaaS/provider coupling;
- preserve browser hygiene: no raw code/full contact in public responses;
- keep Phase 2A account creation, Phase 2B safe delivery metadata, Phase 2C
  lease/retry semantics and Phase 2D scheduler/file-spool runtime;
- add validation for resend, expiry, wrong-code attempts, terminal delivery
  failures and no contact/code leakage.

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
