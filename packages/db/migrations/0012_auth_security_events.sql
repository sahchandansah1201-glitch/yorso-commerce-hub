-- Batch #77: self-hosted auth security events and sign-in backpressure support.
-- This schema is owned by the YORSO production backend, not a hosted auth provider.

create type yorso_auth_security_event_type as enum (
  'sign_in_succeeded',
  'sign_in_failed',
  'sign_in_rate_limited',
  'session_invalid',
  'sign_out_succeeded',
  'sign_out_invalid'
);

create table if not exists yorso_auth_security_events (
  id bigserial primary key,
  event_type yorso_auth_security_event_type not null,
  user_id uuid references yorso_users(id) on delete set null,
  email citext,
  session_id text,
  request_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_yorso_auth_security_events_email_type_recent
  on yorso_auth_security_events(email, event_type, occurred_at desc)
  where email is not null;

create index if not exists idx_yorso_auth_security_events_session_recent
  on yorso_auth_security_events(session_id, occurred_at desc)
  where session_id is not null;

create index if not exists idx_yorso_auth_security_events_user_recent
  on yorso_auth_security_events(user_id, occurred_at desc)
  where user_id is not null;

create index if not exists idx_yorso_auth_security_events_type_recent
  on yorso_auth_security_events(event_type, occurred_at desc);

comment on table yorso_auth_security_events is
  'Self-hosted auth security audit events for sign-in, sign-out, invalid session and rate-limit decisions. Batch #77 baseline for 10,000 concurrent users.';
