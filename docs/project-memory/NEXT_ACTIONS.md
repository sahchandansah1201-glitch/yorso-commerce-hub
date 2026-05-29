# Next Actions

## Current Next Action

Start the next scoped backend workstream after Backend Phase 2A.

Phase 2A implements registration-to-account creation as a self-hosted backend
source of truth. API-enabled `/register/*` no longer creates the production
account from browser-only prototype state.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Backend registration state | Хранить шаги регистрации на backend, а не только в `sessionStorage`. | Реализовано: `yorso_registration_drafts` и `/v1/auth/register/*` для start, verify email, details, phone send/verify, onboarding, markets, complete. | Добавить self-hosted delivery/outbox только отдельным Phase 2B решением. |
| Account creation source | На завершении регистрации создавать account workspace в owned storage. | Реализовано: создаются user, credential, company, company media row, roles, notification defaults, optional target-market meta-region и auth session. | Расширять workspace bootstrap только под реальные onboarding-требования. |
| Frontend registration boundary | При `VITE_YORSO_API_URL` регистрация должна идти через self-hosted API. | Реализовано: `authApi` вызывает `/v1/auth/register/*`; mock-flow остался только API-disabled preview. | Не считать preview production source of truth. |
| Session result | После регистрации пользователь должен получить backend-issued session. | Реализовано: `RegisterReady` сохраняет `source: "self_hosted"` session; self-hosted completion errors fail closed. | Позже можно заменить browser bridge на httpOnly-cookie auth. |
| Validation | Проверить контракты, API, frontend funnel, DB migration, lint, build, scale/self-hosted guards. | Passed: contracts, focused API/frontend/DB tests, TypeScript, lint, production-scale, self-hosted runtime, api build, diff check, production build. | Выбрать Phase 2B или legacy Supabase consolidation. |

## Next Implementation After Commit

Recommended next scoped workstream:

Backend Phase 2B: self-hosted registration verification delivery/outbox
decision.

Concrete scope:

- decide whether YORSO sends email/SMS codes through a self-hosted provider,
  an internal SMTP/SMS gateway or a no-delivery operator-assisted flow;
- if delivery is chosen, add a durable outbox table and worker boundary;
- keep verification codes and delivery attempts out of logs;
- add retry/backpressure and operator observability;
- preserve Phase 2A account creation source of truth.

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
