-- Batch #89: durable, sanitized API audit storage for the self-hosted backend.
-- Stores audit envelopes only. Request bodies, query strings, emails, passwords,
-- raw user ids, raw session ids, supplier ids, file names and business values
-- must not be stored here.

create table if not exists yorso_api_audit_events (
  audit_id text primary key,
  occurred_at timestamptz not null,
  request_id text not null,
  correlation_id text not null,
  action text not null,
  outcome text not null check (outcome in ('success', 'failure', 'blocked')),
  http_method text null,
  route text null,
  status_code integer null check (status_code between 100 and 599),
  actor_user_hash text null check (actor_user_hash is null or actor_user_hash like 'sha256:%'),
  session_hash text null check (session_hash is null or session_hash like 'sha256:%'),
  resource_type text null,
  resource_hash text null check (resource_hash is null or resource_hash like 'sha256:%'),
  reason text null,
  event jsonb not null,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(event) = 'object'),
  check ((event->>'type') = 'api_audit_event')
);

create index if not exists idx_yorso_api_audit_events_occurred_at
  on yorso_api_audit_events (occurred_at desc);

create index if not exists idx_yorso_api_audit_events_action_outcome_time
  on yorso_api_audit_events (action, outcome, occurred_at desc);

create index if not exists idx_yorso_api_audit_events_actor_time
  on yorso_api_audit_events (actor_user_hash, occurred_at desc)
  where actor_user_hash is not null;

create index if not exists idx_yorso_api_audit_events_resource_time
  on yorso_api_audit_events (resource_type, resource_hash, occurred_at desc)
  where resource_type is not null and resource_hash is not null;

create index if not exists idx_yorso_api_audit_events_correlation
  on yorso_api_audit_events (correlation_id);

comment on table yorso_api_audit_events is
  'Self-hosted sanitized API audit trail for protected mutations and auth outcomes, indexed for 10,000 concurrent users.';
