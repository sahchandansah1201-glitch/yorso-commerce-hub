# Next Actions

## Current Next Action

Start the next scoped backend workstream after Backend Phase 1J.

Phase 1J is committed locally as a documentation and gate checkpoint. It closes
Backend Phase 1 after Phases 1A-1I and records what is actually
production-ready for the account source-of-truth path.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Phase 1 closure | Проверить, что `/account/*` больше не является production localStorage-first surface. | Закрыто: API-enabled `/account/*` валидирует self-hosted session, загружает workspace через `GET /v1/account/workspace` и сохраняет через backend authority. | Не расширять Phase 1; двигаться в следующий scoped workstream. |
| Self-contained product boundary | Зафиксировать, что production account path не зависит от Supabase. | Закрыто для account Phase 1: self-hosted auth/session/account API, PostgreSQL и self-hosted storage. | Не расширять Supabase; legacy Supabase surfaces выносить в отдельный removal/consolidation workstream. |
| Contract map | Обновить route/data-source contract под фактический account authority. | `docs/backend/frontend-backend-contract.md` обновлен: `/account/*` указывает на self-hosted workspace snapshot в API-enabled production; localStorage/mock только API-disabled preview. | Использовать contract как guard для Phase 2. |
| Validation | Прогнать документальные и policy-гейты. | Passed: `npm run check:self-hosted-production-runtime`; `npm run check:production-scale-baseline`; `npm run lint`; `git diff --check`. | Для следующего workstream снова валидировать точечно и release-гейтами. |

## Next Implementation After Commit

Recommended next scoped workstream:

Backend Phase 2A: Registration-to-account creation source of truth.

Concrete scope:

- registration should create/attach the buyer account through the self-hosted
  auth/account backend, not only frontend/prototype state;
- email/phone verification state should be backend-owned;
- post-registration account workspace should be initialized from PostgreSQL;
- local preview behavior must remain clearly API-disabled and non-production;
- validation should include contracts, API tests, registration/account frontend
  tests, lint, build, production-scale baseline and self-hosted runtime check.

Alternative if the user prioritizes infrastructure debt first:

Self-hosted consolidation pass: inventory and quarantine remaining legacy
Supabase/prototype surfaces route-by-route without changing public UX.

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
