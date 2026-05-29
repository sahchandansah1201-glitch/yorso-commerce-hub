# Next Actions

## Current Next Action

Start Backend Phase 2G: password recovery delivery worker/sender runtime.

Phase 2F replaces the self-hosted password-reset gap with owned API endpoints,
durable reset-token source of truth, backend-only sealed delivery handoff
material and session revocation after password reset. It does not add Supabase,
hosted BaaS, SaaS email/SMS/WhatsApp provider coupling or public UI layout
changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Reset request API | Добавить owned endpoint для запроса восстановления пароля. | Реализовано: `POST /v1/auth/password-reset/request` принимает email и optional `redirectTo`; known/unknown accounts получают одинаковый public response. | Закрыто в commit `4c2da272`. |
| Token storage | Не хранить plain reset token как lookup key. | Реализовано: `yorso_auth_password_recovery_tokens` хранит `token_lookup_hash` и salted `token_secret`; migration `0029_auth_password_recovery`. | Cleanup job для expired tokens можно сделать отдельным maintenance batch. |
| No raw reset token | Не возвращать reset token или raw email в browser-visible response. | Реализовано: response содержит только `ok`, `sent`, `expiresInSeconds`, `requestId`; server tests проверяют отсутствие token/email. | Сохранять этот contract для future delivery adapters. |
| Delivery handoff | Передать reset token только в backend-owned delivery handoff. | Реализовано: `yorso_auth_password_recovery_outbox` хранит masked destination и `recovery_token_sealed`. | Recovery worker/sender leasing можно выделить в Phase 2G. |
| Reset complete | Сменить пароль через self-hosted source of truth. | Реализовано: `POST /v1/auth/password-reset/complete` проверяет token hash/secret/expiry/used state и обновляет `yorso_auth_credentials`. | KDF/password policy hardening отдельно. |
| Session safety | Старые sessions должны стать невалидными после reset. | Реализовано: repository revokes/deletes sessions by user; service deletes matching session-cache entries. | Redis outage/chaos smoke можно добавить позже. |
| Frontend runtime | `/reset-password` должен работать через self-hosted API. | Реализовано: `auth-runtime` читает `?token=` или `#token=`, вызывает owned request/complete endpoints; Supabase остаётся prototype fallback only when self-hosted API is disabled. | UX copy для expired/used token можно улучшить отдельным public UX batch. |
| Production guard | 10,000 concurrent-user review and guard scripts должны знать Phase 2F. | Реализовано: `docs/backend/phase-2f-password-recovery-source-of-truth.md`, production-scale baseline, self-hosted DB/API guards and migration tests updated. | Закрыто в commit `4c2da272`. |

## Next Implementation After Phase 2F

Recommended next scoped workstream:

Backend Phase 2G: password recovery delivery worker/sender runtime.

Concrete scope:

- lease `yorso_auth_password_recovery_outbox` jobs with bounded `for update skip locked`;
- decrypt `recovery_token_sealed` only inside backend worker runtime;
- write owned file-spool recovery handoff with reset URL/token outside public
  responses/logs;
- mark jobs sent/failed with sanitized errors and retry/backoff;
- keep no hosted provider/Supabase production dependency.

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
