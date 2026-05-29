# Backend Phase 2F Password Recovery Source Of Truth

## Scope

Backend Phase 2F replaces the production-facing reset-password gap with owned
self-hosted password recovery endpoints. Supabase remains a prototype fallback
only when `VITE_YORSO_API_URL` is not configured.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Reset request API | Добавить owned endpoint для запроса восстановления пароля. | Реализовано: `POST /v1/auth/password-reset/request` принимает email и optional `redirectTo`, всегда возвращает generic success. | Добавить реальный owned SMTP/SMS adapter можно поверх outbox без изменения browser contract. |
| Token storage | Не хранить plain reset token как lookup key. | Реализовано: `yorso_auth_password_recovery_tokens` хранит deterministic `token_lookup_hash` и salted `token_secret`. | Добавить cleanup job для истёкших токенов отдельным maintenance batch. |
| No raw reset token | Не возвращать reset token или raw email в публичный ответ. | Реализовано: response содержит только `ok`, `sent`, `expiresInSeconds`, `requestId`; тесты проверяют отсутствие token/email. | Сохранять для любых будущих delivery adapters. |
| Delivery handoff | Передать recovery token в owned backend-only handoff. | Реализовано: `yorso_auth_password_recovery_outbox` хранит masked destination и `recovery_token_sealed`; browser его не видит. | Worker leasing/sender для recovery можно вынести в следующий scoped runtime batch. |
| Reset completion | Сменить пароль через owned source of truth. | Реализовано: `POST /v1/auth/password-reset/complete` проверяет token hash, secret, expiry, usage state; обновляет `yorso_auth_credentials`. | Password policy/KDF hardening можно выделить отдельно. |
| Session safety | После reset старые sessions не должны оставаться активными. | Реализовано: repository revokes/deletes sessions by user and service removes matching session-cache entries. | Для Redis outage нужен отдельный chaos-smoke, если reset станет high-risk release gate. |
| Frontend runtime | `/reset-password` должен работать через self-hosted API. | Реализовано: `auth-runtime` читает `?token=` или `#token=`, вызывает owned request/complete endpoints; Supabase path остаётся только prototype fallback. | UI copy для expired/used token можно улучшить в отдельном UX batch. |

## API Contract

### `POST /v1/auth/password-reset/request`

Request:

```json
{
  "email": "buyer@example.com",
  "redirectTo": "https://app.yorso.com/reset-password"
}
```

Response for known and unknown accounts:

```json
{
  "ok": true,
  "sent": true,
  "expiresInSeconds": 1800,
  "requestId": "uuid"
}
```

The response intentionally does not reveal whether the account exists.

### `POST /v1/auth/password-reset/complete`

Request:

```json
{
  "token": "backend-issued-token-from-delivery",
  "password": "NewPassword1"
}
```

Success:

```json
{
  "ok": true,
  "passwordUpdated": true,
  "requestId": "uuid"
}
```

Errors:

- `password_reset_token_invalid`
- `password_reset_token_expired`

## 10,000 Concurrent-User Review

Expected read/write profile:

- Request path: 1 indexed user lookup by normalized email; for known accounts,
  1 insert into `yorso_auth_password_recovery_tokens`, 1 insert into
  `yorso_auth_password_recovery_outbox`, 1 security event insert.
- Unknown-account request path: no token/outbox write; 1 security event insert
  and identical public response shape.
- Complete path: 1 lookup by unique `token_lookup_hash`, 1 credential update,
  1 token `used_at` update, bounded session revocation for the user and 1
  security event insert.

Cache/queue/backpressure strategy:

- Public request response is constant-shape to avoid account enumeration.
- Delivery is outbox-backed and can be leased by a bounded worker in a follow-up
  runtime batch.
- Session cache entries for revoked sessions are deleted after successful reset.
- Sign-in rate limiting remains unchanged; password-reset request throttling is
  not added in this batch and should be scoped separately if abuse pressure
  appears.

Database indexing and pagination strategy:

- `token_lookup_hash` is unique for O(log n) reset completion lookup.
- `idx_yorso_auth_password_recovery_active_expiry` supports cleanup/expiry scans.
- `idx_yorso_auth_password_recovery_user_recent` supports admin/security review.
- `idx_yorso_auth_password_recovery_outbox_ready` supports bounded worker lease
  reads without scanning sent/failed rows.

Failure mode and graceful degradation:

- Unknown email returns the same generic success response as known email.
- Invalid, expired or used tokens return structured 400 errors without token
  echoing.
- Delivery worker absence does not leak tokens; requests are durably stored for
  owned handoff processing.
- Session-cache deletion failure follows existing fail-closed cache policy.

Observability and load-test plan:

- API audit records `auth.password_reset.request` and
  `auth.password_reset.complete`.
- Auth security events include `password_reset_requested`,
  `password_reset_completed` and `password_reset_invalid`.
- Current validation covers server route behavior, frontend runtime boundary,
  migration planning, self-hosted DB/API guards and production-scale guard.
- Load testing should model a burst of reset requests with mixed known/unknown
  emails, then complete-token traffic against the unique hash lookup.

## Safeguards Preserved

- No Supabase or hosted BaaS production dependency is introduced.
- Public UX/a11y safeguards Batches #110-#141 are not changed.
- Batch #112 route splitting and Batch #113 route chunk error boundary are not
  changed.
- Access gating, supplier identity redaction and exact-price locks are not
  touched.
