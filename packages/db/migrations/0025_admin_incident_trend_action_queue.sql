-- Batch #109: indexes for the cross-window admin trend action queue.
-- This is an admin control-plane path. It is still bounded and indexed so
-- incident-response operators do not create table scans during production load.

create index if not exists idx_yorso_admin_trend_actions_owner_priority
  on yorso_admin_incident_trend_actions (owner_role, priority, updated_at desc);

create index if not exists idx_yorso_admin_trend_actions_status_kind_priority
  on yorso_admin_incident_trend_actions (status, kind, priority, updated_at desc);

create index if not exists idx_yorso_admin_trend_actions_decider_updated
  on yorso_admin_incident_trend_actions (decided_by_user_id, updated_at desc);

comment on index idx_yorso_admin_trend_actions_owner_priority is
  'Supports the bounded admin incident trend action queue owner/priority filters.';

comment on index idx_yorso_admin_trend_actions_status_kind_priority is
  'Supports trend action queue status, kind and priority filters without scanning action decisions.';
