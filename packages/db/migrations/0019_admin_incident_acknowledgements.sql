-- Batch #101: durable operator incident acknowledgement state.
-- Incidents are derived from runtime diagnostics and audit events. This table stores
-- the operator state only, so incident reads stay cheap and do not copy audit payloads.
-- Designed for the 10,000 concurrent-user production baseline: incident status
-- writes are sparse admin actions, while reads use bounded derived incident lists
-- and indexed acknowledgement lookups.

create table if not exists yorso_admin_incident_acknowledgements (
  incident_id text primary key,
  status text not null check (status in ('acknowledged', 'resolved')),
  note text,
  acknowledged_by_user_id uuid not null references yorso_users(id) on delete restrict,
  acknowledged_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_yorso_admin_incident_ack_status_updated
  on yorso_admin_incident_acknowledgements (status, updated_at desc);

create index if not exists idx_yorso_admin_incident_ack_actor_updated
  on yorso_admin_incident_acknowledgements (acknowledged_by_user_id, updated_at desc);
