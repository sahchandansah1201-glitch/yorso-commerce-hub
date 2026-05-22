-- Batch #106: admin incident workload and correlation read indexes.
-- This is bounded operator control-plane data. The marketplace hot paths stay
-- independent, while admin consoles can scan active incident execution work
-- without table-wide sorts at the 10,000 concurrent-user production baseline.

create index if not exists idx_yorso_admin_incident_execution_status_updated
  on yorso_admin_incident_execution_items (status, updated_at desc, incident_id, item_id);

create index if not exists idx_yorso_admin_incident_execution_owner_status_due
  on yorso_admin_incident_execution_items (assigned_to_user_id, status, updated_at desc)
  where assigned_to_user_id is not null;

create index if not exists idx_yorso_admin_incident_execution_source_status_due
  on yorso_admin_incident_execution_items (source, status, updated_at desc, incident_id);

create index if not exists idx_yorso_admin_incident_execution_incident_source_status
  on yorso_admin_incident_execution_items (incident_id, source, status, item_id);

create index if not exists idx_yorso_admin_incident_events_incident_recent
  on yorso_admin_incident_events (incident_id, occurred_at desc, event_id);

create index if not exists idx_yorso_admin_incident_events_type_recent
  on yorso_admin_incident_events (event_type, occurred_at desc, incident_id);

comment on index idx_yorso_admin_incident_execution_status_updated is
  'Batch #106 workload queue scan index for bounded admin reads under the 10,000 concurrent-user production baseline.';

comment on index idx_yorso_admin_incident_execution_owner_status_due is
  'Batch #106 assignee workload drill-down index for admin control-plane operators.';

comment on index idx_yorso_admin_incident_execution_source_status_due is
  'Batch #106 execution source mix index for admin incident workload summaries.';

comment on index idx_yorso_admin_incident_execution_incident_source_status is
  'Batch #106 incident correlation index for execution item source/status drill-downs.';

comment on index idx_yorso_admin_incident_events_incident_recent is
  'Batch #106 incident timeline correlation index for recent event drill-downs.';

comment on index idx_yorso_admin_incident_events_type_recent is
  'Batch #106 incident event type correlation index for bounded admin filters.';
