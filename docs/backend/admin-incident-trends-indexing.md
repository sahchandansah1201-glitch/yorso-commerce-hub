# Admin Incident Trends Indexing

Batch #107 adds `0023_admin_incident_trend_analytics.sql` to keep admin trend
reads bounded under the production-scale baseline.

## Index List

- `idx_yorso_admin_incident_events_occurred_type`
- `idx_yorso_admin_incident_events_incident_type_occurred`
- `idx_yorso_admin_incident_ack_status_updated`
- `idx_yorso_admin_incident_ack_escalation_status_updated`
- `idx_yorso_admin_incident_execution_status_updated_source`
- `idx_yorso_admin_incident_execution_incident_updated`
- `idx_yorso_admin_incident_execution_priority_updated`

## Query Families

Bucket reads:

- driven by event occurrence time and type.

Incident drill-down reads:

- driven by incident id, event type and event time.

Status mix:

- driven by acknowledgement status and update time.

Escalation mix:

- driven by escalation level, status and update time.

Execution pressure:

- driven by execution status, update time and source.

Priority review:

- driven by open execution priority and update time.

## Operational Notes

The indexes are not a substitute for query limits. The API contract still caps
trend rows and export rows. If the incident event table grows beyond the first
production threshold, the next step is time partitioning or materialized trend
snapshots.

Marker: Batch #107.
Marker: 0023_admin_incident_trend_analytics.
Marker: 10,000 concurrent-user.
