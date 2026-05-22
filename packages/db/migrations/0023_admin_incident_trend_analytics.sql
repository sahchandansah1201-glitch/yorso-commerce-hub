-- Batch #107: admin incident trend analytics read indexes.
-- Trend analytics is an admin control-plane feature, not a marketplace hot path.
-- The indexes below keep trend buckets, route risks, anomaly scans and briefing
-- reads bounded for the 10,000 concurrent-user production baseline.

create index if not exists idx_yorso_admin_incident_events_occurred_type
  on yorso_admin_incident_events (occurred_at desc, event_type, incident_id);

create index if not exists idx_yorso_admin_incident_events_incident_type_occurred
  on yorso_admin_incident_events (incident_id, event_type, occurred_at desc);

create index if not exists idx_yorso_admin_incident_ack_status_updated
  on yorso_admin_incident_acknowledgements (status, updated_at desc, incident_id);

create index if not exists idx_yorso_admin_incident_ack_escalation_status_updated
  on yorso_admin_incident_acknowledgements (escalation_level, status, updated_at desc, incident_id);

create index if not exists idx_yorso_admin_incident_execution_status_updated_source
  on yorso_admin_incident_execution_items (status, updated_at desc, source, incident_id);

create index if not exists idx_yorso_admin_incident_execution_incident_updated
  on yorso_admin_incident_execution_items (incident_id, updated_at desc, status, source);

create index if not exists idx_yorso_admin_incident_execution_priority_updated
  on yorso_admin_incident_execution_items (priority, updated_at desc, incident_id)
  where status in ('open', 'in_progress', 'blocked');

comment on index idx_yorso_admin_incident_events_occurred_type is
  'Batch #107 trend bucket index for recent admin incident events under the 10,000 concurrent-user production baseline.';

comment on index idx_yorso_admin_incident_events_incident_type_occurred is
  'Batch #107 trend drill-down index for incident event history without wide scans.';

comment on index idx_yorso_admin_incident_ack_status_updated is
  'Batch #107 status mix index for admin incident trend analytics.';

comment on index idx_yorso_admin_incident_ack_escalation_status_updated is
  'Batch #107 escalation and status index for trend anomaly review.';

comment on index idx_yorso_admin_incident_execution_status_updated_source is
  'Batch #107 execution state trend index for route risk and SLA posture.';

comment on index idx_yorso_admin_incident_execution_incident_updated is
  'Batch #107 incident execution trend index for briefing and anomaly reads.';

comment on index idx_yorso_admin_incident_execution_priority_updated is
  'Batch #107 open execution priority index for trend analytics and operator briefing.';
