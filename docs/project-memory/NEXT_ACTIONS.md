# Next Actions

## Current Next Action

Start the next scoped backend workstream after Backend Phase 2B.

Phase 2B adds a self-hosted registration verification delivery outbox. API
registration can now record durable delivery intent for email, SMS and WhatsApp
verification without adding a hosted BaaS or external provider dependency.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Durable delivery intent | Хранить delivery job на backend, а не считать `sent` только mock/UI-состоянием. | Реализовано: `yorso_registration_delivery_outbox` с purpose/channel/status, masked destination, destination hash, retry and lease fields. | Добавить worker только отдельным Phase 2C решением. |
| Email verification delivery | При старте регистрации создавать delivery intent для email-кода. | Реализовано: draft insert + email outbox insert в одном PostgreSQL CTE; memory runtime mirror. | Worker сможет резолвить raw destination через draft внутри backend runtime. |
| Phone verification delivery | При SMS/WhatsApp verification request создавать channel-specific delivery intent. | Реализовано: phone state update + outbox insert в одном PostgreSQL CTE. | Добавить lease/retry processing позже. |
| Safe response | Браузер может видеть delivery status, но не код и не полный контакт. | Реализовано: response содержит только id, purpose, channel, status, destinationPreview; тесты проверяют отсутствие полного email/phone и `123456`. | Сохранять этот hygiene-contract в worker/admin surfaces. |
| Self-contained boundary | Не добавлять Supabase/hosted provider coupling. | Сохранено: только owned API/PostgreSQL metadata; no hosted BaaS. | Выбрать Phase 2C worker или legacy Supabase consolidation. |
| Validation | Проверить контракты, DB migration, API, frontend boundary, lint/build/runtime guards. | Passed: contracts, registration API client, DB migrations, API tests, TypeScript, lint, production-scale, self-hosted runtime, api build, diff check, production build. | Выбрать Phase 2C или legacy Supabase consolidation. |

## Next Implementation After Commit

Recommended next scoped workstream:

Backend Phase 2C: self-hosted verification worker/lease processing.

Concrete scope:

- implement an internal worker boundary that leases queued
  `yorso_registration_delivery_outbox` rows;
- mark jobs sent/failed without logging verification codes or raw destinations;
- keep provider integration self-hosted and configurable;
- add retry/backoff and worker observability;
- preserve Phase 2A account creation and Phase 2B safe delivery metadata.

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
