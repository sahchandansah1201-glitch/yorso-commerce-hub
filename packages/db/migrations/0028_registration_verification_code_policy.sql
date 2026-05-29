-- Backend Phase 2E: registration verification code policy.
-- Enforce per-request code expiry/attempt counters and store backend-only
-- sealed code material for the self-hosted delivery worker handoff.

alter table yorso_registration_drafts
  add column if not exists email_code_expires_at timestamptz,
  add column if not exists email_code_attempt_count integer not null default 0 check (email_code_attempt_count >= 0 and email_code_attempt_count <= 20),
  add column if not exists phone_code_expires_at timestamptz,
  add column if not exists phone_code_attempt_count integer not null default 0 check (phone_code_attempt_count >= 0 and phone_code_attempt_count <= 20);

update yorso_registration_drafts
set email_code_expires_at = least(expires_at, created_at + interval '5 minutes')
where email_code_expires_at is null;

alter table yorso_registration_drafts
  alter column email_code_expires_at set not null;

alter table yorso_registration_delivery_outbox
  add column if not exists verification_code_sealed text check (
    verification_code_sealed is null
    or (
      verification_code_sealed like 'v1:%'
      and char_length(verification_code_sealed) between 20 and 500
    )
  );

create index if not exists idx_yorso_registration_drafts_email_code_expiry
  on yorso_registration_drafts(email_code_expires_at)
  where completed_at is null and email_verified_at is null;

create index if not exists idx_yorso_registration_drafts_phone_code_expiry
  on yorso_registration_drafts(phone_code_expires_at)
  where completed_at is null and phone_verified_at is null and phone_code_expires_at is not null;

comment on column yorso_registration_drafts.email_code_expires_at is
  'Expiry for the current email verification code. Phase 2E enforces this before marking email verified.';

comment on column yorso_registration_drafts.email_code_attempt_count is
  'Failed email verification attempts for the current email code.';

comment on column yorso_registration_drafts.phone_code_expires_at is
  'Expiry for the current phone verification code. Reset whenever a new phone code is requested.';

comment on column yorso_registration_drafts.phone_code_attempt_count is
  'Failed phone verification attempts for the current phone code.';

comment on column yorso_registration_delivery_outbox.verification_code_sealed is
  'Backend-only sealed verification code material for the self-hosted delivery worker. Never returned to browser responses.';
