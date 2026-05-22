-- Batch #104: durable execution state for incident remediation and postmortem actions.
-- This is admin control-plane state, not buyer/supplier hot-path data.
-- Reads are bounded by incident_id and writes are single item upserts, preserving
-- the 10,000 concurrent-user baseline by keeping operator workflows off the
-- marketplace catalog/request paths.

create table if not exists yorso_admin_incident_execution_items (
  incident_id text not null,
  item_id text not null,
  source text not null check (source in (
    'remediation_step',
    'verification_check',
    'rollback_step',
    'capacity_note',
    'postmortem_action',
    'prevention_check'
  )),
  status text not null default 'open' check (status in (
    'open',
    'in_progress',
    'blocked',
    'done',
    'skipped'
  )),
  assigned_to_user_id uuid references yorso_users(id) on delete restrict,
  updated_by_user_id uuid not null references yorso_users(id) on delete restrict,
  note text,
  evidence_note text,
  blocked_reason text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (incident_id, item_id),
  check (length(coalesce(note, '')) <= 500),
  check (length(coalesce(evidence_note, '')) <= 500),
  check (length(coalesce(blocked_reason, '')) <= 500),
  check (
    status <> 'blocked'
    or length(coalesce(blocked_reason, '')) > 0
  ),
  check (
    status <> 'done'
    or length(coalesce(evidence_note, note, '')) > 0
  )
);

create index if not exists idx_yorso_admin_incident_execution_incident_status
  on yorso_admin_incident_execution_items (incident_id, status, updated_at desc);

create index if not exists idx_yorso_admin_incident_execution_assignee_status
  on yorso_admin_incident_execution_items (assigned_to_user_id, status, updated_at desc)
  where assigned_to_user_id is not null;

create index if not exists idx_yorso_admin_incident_execution_source_status
  on yorso_admin_incident_execution_items (source, status, updated_at desc);
