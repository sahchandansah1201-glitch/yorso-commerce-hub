# Self-hosted admin incidents smoke

Batch #101 adds the admin incident response console for the self-hosted YORSO
backend. It is designed as a low-frequency operator workflow under the
10,000 concurrent users production baseline.

## Scope

The smoke validates:

- `GET /v1/admin/incidents`;
- `GET /v1/admin/incidents/:incidentId`;
- `GET /v1/admin/incidents/:incidentId/handoff`;
- `GET /v1/admin/incidents/:incidentId/remediation`;
- `GET /v1/admin/incidents/:incidentId/postmortem`;
- `POST /v1/admin/incidents/:incidentId/acknowledge`;
- `POST /v1/admin/incidents/:incidentId/workflow`;
- `POST /v1/admin/incidents/workflow/bulk`;
- `GET /v1/admin/incidents/export`;
- `GET /v1/admin/incidents/execution-queue`;
- `GET /v1/admin/incidents/execution-queue/export`;
- `POST /v1/admin/incidents/execution-queue/bulk`;
- admin-only access boundaries;
- durable acknowledgement and resolution state;
- durable assignment, escalation and timeline state;
- bounded bulk workflow updates with partial not-found reporting;
- secret-safe incident payloads.
- operator note hygiene rejection for raw emails, UUIDs and token-like secret
  assignments.

Incidents are derived from runtime diagnostics and admin audit events. The
backend stores only operator acknowledgement state in PostgreSQL through
`yorso_admin_incident_acknowledgements`. Batch #102 adds
`yorso_admin_incident_events` for bounded operator timeline events and extends
acknowledgement state with assignment and escalation fields. The API response
also includes operator runbook steps and workload summary counters for
assignment coverage, SLA risk, escalation load and source mix.
Batch #103 adds a dedicated incident detail handoff, remediation and postmortem path. It
exports bounded JSON and Markdown shift handoff payloads from the same
sanitized incident contract, generates a bounded remediation plan, exports a
bounded JSON/Markdown postmortem draft, and adds a browser detail route at
`/admin/incidents/:incidentId`.
Batch #104 adds durable incident execution state for remediation, verification,
rollback, capacity, postmortem and prevention items. Operators can load
`/v1/admin/incidents/:incidentId/execution`, export the bounded execution plan
through `/v1/admin/incidents/:incidentId/execution/export?format=json|csv`, and
update a single execution item through
`/v1/admin/incidents/:incidentId/execution/:itemId` without exposing raw operator
identifiers or secrets.
Batch #105 adds an execution queue across incidents. Operators can list bounded
execution items through `/v1/admin/incidents/execution-queue`, filter by status,
priority, owner, assignment, incident severity/SLA and overdue state, export the
queue through `/v1/admin/incidents/execution-queue/export?format=json|csv`, and
bulk update selected execution items through
`/v1/admin/incidents/execution-queue/bulk`.
Batch #106 adds workload and correlation reads for bounded owner load,
capacity forecast and incident signal drill-down.
Batch #107 adds trend analytics. Operators can list bucketed trend pressure
through `/v1/admin/incidents/trends`, export the same bounded shape through
`/v1/admin/incidents/trends/export?format=json|csv`, review anomalies through
`/v1/admin/incidents/trends/anomalies`, and load an operator briefing through
`/v1/admin/incidents/trends/briefing`.
Batch #108 adds trend action decisions through
`/v1/admin/incidents/trends/actions`. Batch #109 adds a dedicated trend action
queue through `/v1/admin/incidents/trend-action-queue`, bounded export through
`/v1/admin/incidents/trend-action-queue/export?format=json|csv`, and bulk
accept/dismiss through `/v1/admin/incidents/trend-action-queue/bulk`.

## Command

```bash
npm run smoke:self-hosted-admin-incidents
```

For CI after `api:build`:

```bash
npm run smoke:self-hosted-admin-incidents:run
```

## Expected markers

The script must print:

- `admin_incidents_auth_guard=ok`;
- `admin_incidents_role_guard=ok`;
- `admin_incidents_list=ok`;
- `admin_incidents_summary=ok`;
- `admin_incidents_workload_summary=ok`;
- `admin_incidents_detail=ok`;
- `admin_incidents_handoff_json=ok`;
- `admin_incidents_handoff_markdown=ok`;
- `admin_incidents_remediation_plan=ok`;
- `admin_incidents_postmortem_json=ok`;
- `admin_incidents_postmortem_markdown=ok`;
- `admin_incidents_execution_plan=ok`;
- `admin_incidents_execution_export_json=ok`;
- `admin_incidents_execution_export_csv=ok`;
- `admin_incidents_execution_start=ok`;
- `admin_incidents_execution_done=ok`;
- `admin_incidents_execution_blocked=ok`;
- `admin_incidents_execution_note_hygiene_guard=ok`;
- `admin_incidents_execution_missing_item_guard=ok`;
- `admin_incidents_execution_queue=ok`;
- `admin_incidents_execution_queue_filters=ok`;
- `admin_incidents_execution_queue_export_json=ok`;
- `admin_incidents_execution_queue_export_csv=ok`;
- `admin_incidents_execution_queue_bulk=ok`;
- `admin_incidents_execution_queue_note_hygiene_guard=ok`;
- `admin_incidents_workload=ok`;
- `admin_incidents_workload_filters=ok`;
- `admin_incidents_workload_export_json=ok`;
- `admin_incidents_workload_export_csv=ok`;
- `admin_incidents_workload_forecast=ok`;
- `admin_incidents_correlation=ok`;
- `admin_incidents_trends=ok`;
- `admin_incidents_trends_filters=ok`;
- `admin_incidents_trends_export_json=ok`;
- `admin_incidents_trends_export_csv=ok`;
- `admin_incidents_trends_anomalies=ok`;
- `admin_incidents_trends_briefing=ok`;
- `admin_incidents_note_hygiene_guard=ok`;
- `admin_incidents_acknowledge=ok`;
- `admin_incidents_assign=ok`;
- `admin_incidents_escalate=ok`;
- `admin_incidents_comment=ok`;
- `admin_incidents_bulk_workflow=ok`;
- `admin_incidents_export_json=ok`;
- `admin_incidents_export_csv=ok`;
- `admin_incidents_workflow_filters=ok`;
- `admin_incidents_no_secrets=ok`;
- `admin_incidents_status_filter=ok`;
- `admin_incidents_resolve=ok`;
- `admin_incidents_validation_guard=ok`;
- `admin_incidents_workflow_validation_guard=ok`;
- `admin_incidents_bulk_workflow_validation_guard=ok`;
- `self_hosted_admin_incidents_smoke=ok`.

## Production-scale notes

Read profile: low-frequency admin reads. Incident lists are bounded and derived
from runtime diagnostics plus audit summaries, not from unbounded scans.

Write profile: sparse admin workflow writes. Incident acknowledgement,
assignment, escalation, comments, resolution, bounded bulk workflow updates and
sanitized JSON/CSV export use small indexed tables keyed by incident id.
Handoff, remediation plan and postmortem reads are bounded by a single incident id.
Execution tracker reads are also bounded by a single incident id. Execution
updates are single item upserts keyed by `(incident_id, item_id)`.
Execution queue writes are bounded bulk updates capped by the API contract and
operate on explicit `(incidentId, itemId)` pairs only.

Cache/backpressure: no browser polling. Operators refresh explicitly. API
request guardrails, admin role checks and audit backpressure remain active.

Database strategy: `yorso_admin_incident_acknowledgements` has status, actor,
assignee and escalation indexes for durable admin state.
`yorso_admin_incident_events` has incident/time, actor/time and type/time
indexes for bounded timeline reads. Incident derivation remains bounded by
query limits and typed filters.
`yorso_admin_incident_execution_items` has incident/status, assignee/status and
source/status indexes for bounded execution reads and operator work queues.
`0022_admin_incident_workload_correlation` adds workload and correlation
indexes. `0023_admin_incident_trend_analytics` adds event bucket, event
drill-down, acknowledgement status/escalation, execution status/source,
incident execution and open-priority indexes for trend analytics.

Failure mode: missing API, missing session, forbidden role and backend errors
render explicit UI states. The frontend does not fabricate incidents.
Workflow notes reject raw emails, UUIDs and token-like secret assignments.

Observability: incident reads and acknowledgements emit admin audit events and
use existing request, error and metrics telemetry. Payloads must not include
emails, session ids, passwords, connection strings or storage endpoints.

Marker: Batch #101.
Marker: Batch #102.
Marker: Batch #103.
Marker: Batch #104.
Marker: Batch #105.
Marker: Batch #107.
Marker: Batch #108.
Marker: Batch #109.
Marker: admin incident response.
Marker: admin incident workflow.
Marker: admin incident detail handoff.
Marker: admin incident execution.
Marker: trend action loop.
Marker: /v1/admin/incidents.
Marker: /v1/admin/incidents/:incidentId/workflow.
Marker: /v1/admin/incidents/:incidentId/handoff.
Marker: /v1/admin/incidents/:incidentId/remediation.
Marker: /v1/admin/incidents/:incidentId/postmortem.
Marker: /v1/admin/incidents/:incidentId/execution.
Marker: /v1/admin/incidents/:incidentId/execution/export.
Marker: /v1/admin/incidents/execution-queue.
Marker: /v1/admin/incidents/execution-queue/export.
Marker: /v1/admin/incidents/execution-queue/bulk.
Marker: /v1/admin/incidents/trends.
Marker: /v1/admin/incidents/trends/export.
Marker: /v1/admin/incidents/trends/anomalies.
Marker: /v1/admin/incidents/trends/briefing.
Marker: /v1/admin/incidents/trends/actions.
Marker: /v1/admin/incidents/trends/actions/:actionId/decision.
Marker: /v1/admin/incidents/trend-action-queue.
Marker: /v1/admin/incidents/trend-action-queue/export.
Marker: /v1/admin/incidents/trend-action-queue/bulk.
Marker: /v1/admin/incidents/workflow/bulk.
Marker: /v1/admin/incidents/export.
Marker: /admin/incidents.
Marker: /admin/incidents/:incidentId.
Marker: /admin/incident-execution.
Marker: /admin/incident-trends.
Marker: /admin/incident-trend-actions.
Marker: smoke:self-hosted-admin-incidents.
Marker: smoke:e2e:admin-incidents.
Marker: smoke:e2e:admin-incident-detail.
Marker: smoke:e2e:admin-incident-execution-queue.
Marker: admin_incidents_acknowledge=ok.
Marker: admin_incidents_assign=ok.
Marker: admin_incidents_escalate=ok.
Marker: admin_incidents_comment=ok.
Marker: admin_incidents_bulk_workflow=ok.
Marker: admin_incidents_export_json=ok.
Marker: admin_incidents_export_csv=ok.
Marker: admin_incidents_handoff_json=ok.
Marker: admin_incidents_handoff_markdown=ok.
Marker: admin_incidents_remediation_plan=ok.
Marker: admin_incidents_postmortem_json=ok.
Marker: admin_incidents_postmortem_markdown=ok.
Marker: admin_incidents_execution_plan=ok.
Marker: admin_incidents_execution_export_json=ok.
Marker: admin_incidents_execution_export_csv=ok.
Marker: admin_incidents_execution_start=ok.
Marker: admin_incidents_execution_done=ok.
Marker: admin_incidents_execution_blocked=ok.
Marker: admin_incidents_execution_note_hygiene_guard=ok.
Marker: admin_incidents_execution_missing_item_guard=ok.
Marker: admin_incidents_execution_queue=ok.
Marker: admin_incidents_execution_queue_filters=ok.
Marker: admin_incidents_execution_queue_export_json=ok.
Marker: admin_incidents_execution_queue_export_csv=ok.
Marker: admin_incidents_execution_queue_bulk=ok.
Marker: admin_incidents_execution_queue_note_hygiene_guard=ok.
Marker: admin_incidents_workload=ok.
Marker: admin_incidents_workload_filters=ok.
Marker: admin_incidents_workload_export_json=ok.
Marker: admin_incidents_workload_export_csv=ok.
Marker: admin_incidents_workload_forecast=ok.
Marker: admin_incidents_correlation=ok.
Marker: admin_incidents_trends=ok.
Marker: admin_incidents_trends_filters=ok.
Marker: admin_incidents_trends_export_json=ok.
Marker: admin_incidents_trends_export_csv=ok.
Marker: admin_incidents_trends_anomalies=ok.
Marker: admin_incidents_trends_briefing=ok.
Marker: admin_incidents_trend_actions=ok.
Marker: admin_incidents_trend_action_accept=ok.
Marker: admin_incidents_trend_action_dismiss=ok.
Marker: admin_incidents_trend_action_validation_guard=ok.
Marker: admin_incidents_trend_action_queue=ok.
Marker: admin_incidents_trend_action_queue_filters=ok.
Marker: admin_incidents_trend_action_queue_export_json=ok.
Marker: admin_incidents_trend_action_queue_export_csv=ok.
Marker: admin_incidents_trend_action_queue_bulk=ok.
Marker: admin_incidents_trend_action_queue_note_hygiene_guard=ok.
Marker: admin_incidents_note_hygiene_guard=ok.
Marker: admin_incidents_workflow_filters=ok.
Marker: admin_incidents_workflow_validation_guard=ok.
Marker: admin_incidents_bulk_workflow_validation_guard=ok.
Marker: 10,000 concurrent users.
