-- Batch #73: self-hosted auth/session foundation.
-- This schema belongs to the YORSO-owned backend. It is not a hosted auth provider integration.

create table if not exists yorso_auth_credentials (
  user_id uuid primary key references yorso_users(id) on delete cascade,
  password_secret text not null check (
    password_secret like 'plain:%'
    or password_secret like 'sha256:%:%'
  ),
  password_updated_at timestamptz not null default now(),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists yorso_auth_sessions (
  id text primary key check (char_length(id) between 32 and 160),
  user_id uuid not null references yorso_users(id) on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint yorso_auth_sessions_expiry_order check (expires_at > issued_at)
);

create index if not exists idx_yorso_auth_credentials_enabled_user
  on yorso_auth_credentials(user_id)
  where disabled_at is null;

create index if not exists idx_yorso_auth_sessions_user_active
  on yorso_auth_sessions(user_id, expires_at desc)
  where revoked_at is null;

create index if not exists idx_yorso_auth_sessions_active_expiry
  on yorso_auth_sessions(expires_at)
  where revoked_at is null;

comment on table yorso_auth_credentials is
  'Self-hosted auth credential records. Batch #73 foundation only; production hardening must replace prototype password secrets.';

comment on table yorso_auth_sessions is
  'Self-hosted API session records used by x-yorso-session-id. Designed for future Redis/PostgreSQL session hardening.';
