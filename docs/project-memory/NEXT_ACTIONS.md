# Next Actions

## Current Next Action

Commit Backend Phase 2E after completed release validation.

Phase 2E replaces the self-hosted backend's fixed prototype registration code
with per-request OTP generation, expiry, attempt counters and sealed
backend-only delivery handoff material. It does not add Supabase, hosted BaaS,
SaaS email/SMS/WhatsApp provider coupling or public UI layout changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Per-request OTP | Убрать fixed backend OTP `123456` из API-enabled registration. | Реализовано: `RegistrationVerificationCodeIssuer` выпускает свежий 6-значный код для email/phone request; tests inject deterministic codes. | Commit. |
| Secret storage | Не хранить plain OTP в registration drafts. | Реализовано: draft хранит salted SHA-256 `emailCodeSecret` / `phoneCodeSecret`; verification сравнивает через safe secret path. | Security-hardening KDF/pepper policy можно выделить отдельно, если потребуется. |
| Expiry policy | Код должен истекать независимо от 24h registration draft. | Реализовано: `email_code_expires_at` / `phone_code_expires_at`, error `registration_code_expired`. | При UI-задаче добавить copy для expired/resend state. |
| Attempt policy | Wrong-code attempts должны ограничиваться. | Реализовано: durable attempt counters и `registration_rate_limited` после max attempts; correct code тоже блокируется после ceiling. | При необходимости добавить IP/device-level OTP throttling. |
| Delivery handoff | Worker/sender должны получить code без browser leak. | Реализовано: outbox хранит `verification_code_sealed`; worker decrypts after lease; file-spool payload includes backend-only `verificationCode`. | Позже можно добавить owned SMTP/SMS/WhatsApp adapter без изменения public responses. |
| Browser hygiene | Public registration responses не должны отдавать OTP/full contact. | Реализовано: start/phone-send responses содержат только masked delivery metadata; tests assert generated codes are absent. | Сохранять этот contract для любых future channel adapters. |
| Production guard | Production должен требовать owned sealing secret. | Реализовано: `YORSO_REGISTRATION_VERIFICATION_CODE_SECRET`; production default-secret guard; env/compose/scripts updated. | Secret rotation/runbook вне этого batch. |
| Dev UX | Self-hosted dev не должен auto-submit prototype code. | Реализовано: Register verify dev-skip доступен только в API-disabled local mock. | Если нужен operator-only helper, делать отдельным backend-only инструментом. |

## Next Implementation After Phase 2E

Recommended next scoped workstream:

Backend Phase 2F: self-hosted password recovery/reset source of truth.

Concrete scope:

- replace legacy/prototype reset-password behavior with owned API endpoints;
- store recovery token hashes and expiry in PostgreSQL;
- deliver recovery handoff through the same self-hosted delivery runtime or a
  clearly scoped owned channel adapter;
- preserve no raw tokens in browser responses/logs;
- keep no hosted BaaS/Supabase production dependency.

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
