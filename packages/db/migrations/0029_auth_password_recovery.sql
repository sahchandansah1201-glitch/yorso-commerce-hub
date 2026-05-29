-- Backend Phase 2F: self-hosted password recovery source of truth.
-- Reset requests are owned by the YORSO backend. Browser responses never
-- expose reset tokens or raw account existence; delivery material is sealed
-- in a backend-only outbox for the owned sender/runtime path.

alter type yorso_auth_security_event_type add value if not exists 'password_reset_requested';
alter type yorso_auth_security_event_type add value if not exists 'password_reset_completed';
alter type yorso_auth_security_event_type add value if not exists 'password_reset_invalid';

create table if not exists yorso_auth_password_recovery_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references yorso_users(id) on delete cascade,
  email citext not null,
  destination_hash text not null check (destination_hash like 'sha256:%'),
  destination_preview text not null check (char_length(destination_preview) between 1 and 80),
  token_lookup_hash text not null unique check (token_lookup_hash like 'sha256:%'),
  token_secret text not null check (token_secret like 'sha256:%:%'),
  expires_at timestamptz not null,
  used_at timestamptz,
  request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_auth_password_recovery_expiry_order check (expires_at > created_at)
);

create table if not exists yorso_auth_password_recovery_outbox (
  id uuid primary key default gen_random_uuid(),
  recovery_id uuid not null references yorso_auth_password_recovery_tokens(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'leased', 'sent', 'failed', 'cancelled')),
  destination_hash text not null check (destination_hash like 'sha256:%'),
  destination_preview text not null check (char_length(destination_preview) between 1 and 80),
  template_key text not null check (char_length(template_key) between 1 and 120),
  recovery_token_sealed text not null check (
    recovery_token_sealed like 'v1:%'
    and char_length(recovery_token_sealed) between 20 and 900
  ),
  request_id uuid,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text check (locked_by is null or char_length(locked_by) <= 120),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_auth_password_recovery_outbox_attempts_within_limit check (attempt_count <= max_attempts)
);

create index if not exists idx_yorso_auth_password_recovery_user_recent
  on yorso_auth_password_recovery_tokens(user_id, created_at desc);

create index if not exists idx_yorso_auth_password_recovery_active_expiry
  on yorso_auth_password_recovery_tokens(expires_at)
  where used_at is null;

create index if not exists idx_yorso_auth_password_recovery_outbox_ready
  on yorso_auth_password_recovery_outbox(available_at, created_at)
  where status = 'queued' and attempt_count < max_attempts;

create index if not exists idx_yorso_auth_password_recovery_outbox_recovery_recent
  on yorso_auth_password_recovery_outbox(recovery_id, created_at desc);

comment on table yorso_auth_password_recovery_tokens is
  'Self-hosted password recovery token records. Lookup uses deterministic token hash; reset token never returns in browser responses.';

comment on table yorso_auth_password_recovery_outbox is
  'Self-hosted password recovery delivery outbox with backend-only sealed reset-token material for the owned sender path.';

comment on index idx_yorso_auth_password_recovery_active_expiry is
  'Supports bounded cleanup and expiry scans for active password recovery tokens at the 10,000 concurrent-user baseline.';

comment on index idx_yorso_auth_password_recovery_outbox_ready is
  'Supports bounded worker leasing for queued password recovery deliveries at the 10,000 concurrent-user baseline.';
