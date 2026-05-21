-- Batch #102: durable operator incident workflow.
-- Extends derived admin incidents from basic acknowledge/resolve into assign,
-- escalation and timeline workflows without copying raw audit payloads.
-- This remains an admin control-plane path for the 10,000 concurrent-user
-- baseline: hot buyer traffic never reads these tables, and all operator
-- reads stay bounded by indexed incident ids and recent event windows.

alter table yorso_admin_incident_acknowledgements
  add column if not exists assigned_to_user_id uuid references yorso_users(id) on delete restrict,
  add column if not exists assigned_at timestamptz,
  add column if not exists escalation_level text not null default 'none'
    check (escalation_level in ('none', 'lead', 'engineering', 'executive')),
  add column if not exists escalated_at timestamptz,
  add column if not exists resolved_at timestamptz;

create table if not exists yorso_admin_incident_events (
  event_id uuid primary key default gen_random_uuid(),
  incident_id text not null,
  event_type text not null check (event_type in (
    'created',
    'acknowledged',
    'assigned',
    'commented',
    'escalated',
    'resolved'
  )),
  actor_user_id uuid not null references yorso_users(id) on delete restrict,
  assigned_to_user_id uuid references yorso_users(id) on delete restrict,
  escalation_level text check (escalation_level in ('none', 'lead', 'engineering', 'executive')),
  status text check (status in ('open', 'acknowledged', 'resolved')),
  note text,
  occurred_at timestamptz not null default now(),
  check (length(coalesce(note, '')) <= 500)
);

create index if not exists idx_yorso_admin_incident_events_incident_time
  on yorso_admin_incident_events (incident_id, occurred_at desc);

create index if not exists idx_yorso_admin_incident_events_actor_time
  on yorso_admin_incident_events (actor_user_id, occurred_at desc);

create index if not exists idx_yorso_admin_incident_events_type_time
  on yorso_admin_incident_events (event_type, occurred_at desc);

create index if not exists idx_yorso_admin_incident_ack_assignee_updated
  on yorso_admin_incident_acknowledgements (assigned_to_user_id, updated_at desc)
  where assigned_to_user_id is not null;

create index if not exists idx_yorso_admin_incident_ack_escalation_updated
  on yorso_admin_incident_acknowledgements (escalation_level, updated_at desc)
  where escalation_level <> 'none';
