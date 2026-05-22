-- Batch #108: durable trend-to-action decision trail.
-- Trend actions are admin control-plane records. They are not buyer/supplier
-- hot-path state and they preserve the 10,000 concurrent-user baseline by
-- keeping writes bounded to explicit operator decisions.

create table if not exists yorso_admin_incident_trend_actions (
  action_id text primary key,
  kind text not null check (kind in (
    'anomaly_follow_up',
    'route_risk_review',
    'sla_recovery',
    'capacity_rebalance'
  )),
  status text not null check (status in ('accepted', 'dismissed')),
  title text not null,
  signal text not null,
  route text,
  priority text not null check (priority in ('immediate', 'next', 'follow_up')),
  owner_role text not null check (owner_role in ('operator', 'engineering', 'security', 'founder')),
  load_score integer not null check (load_score >= 0),
  related_incident_ids text[] not null default '{}',
  note text,
  decided_by_user_id uuid not null references yorso_users(id) on delete restrict,
  accepted_at timestamptz,
  dismissed_at timestamptz,
  updated_at timestamptz not null default now(),
  check (length(action_id) between 8 and 180),
  check (action_id ~ '^[a-z0-9._:-]+$'),
  check (length(title) between 1 and 160),
  check (length(signal) between 1 and 160),
  check (route is null or length(route) between 1 and 260),
  check (array_length(related_incident_ids, 1) between 1 and 25),
  check (length(coalesce(note, '')) <= 500),
  check (
    status <> 'accepted'
    or accepted_at is not null
  ),
  check (
    status <> 'dismissed'
    or dismissed_at is not null
  )
);

create index if not exists idx_yorso_admin_trend_actions_status_updated
  on yorso_admin_incident_trend_actions (status, updated_at desc);

create index if not exists idx_yorso_admin_trend_actions_kind_priority
  on yorso_admin_incident_trend_actions (kind, priority, updated_at desc);

create index if not exists idx_yorso_admin_trend_actions_route
  on yorso_admin_incident_trend_actions (route, updated_at desc)
  where route is not null;

create index if not exists idx_yorso_admin_trend_actions_related_gin
  on yorso_admin_incident_trend_actions using gin (related_incident_ids);

comment on table yorso_admin_incident_trend_actions is
  'Durable admin decisions for trend-derived incident actions. Operator control-plane only.';

comment on index idx_yorso_admin_trend_actions_related_gin is
  'Supports bounded incident-to-trend action drill-down without scanning the action table.';
