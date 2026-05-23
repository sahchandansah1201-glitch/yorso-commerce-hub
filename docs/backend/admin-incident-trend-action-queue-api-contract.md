# Admin Incident Trend Action Queue API Contract

Batch #109 adds a dedicated self-hosted API contract for the admin incident
trend action queue. All endpoints are protected by the same self-hosted admin
session and role guard used by the existing incident console.

## GET /v1/admin/incidents/trend-action-queue

Returns a bounded queue response.

Query parameters:

- `window`: `24h`, `7d`, `30d`
- `granularity`: `hour`, `day`
- `limit`: 1 to 100
- `offset`: 0 or greater
- `decision`: `all`, `proposed`, `accepted`, `dismissed`
- `kind`: `all`, `anomaly_follow_up`, `route_risk_review`, `sla_recovery`,
  `capacity_rebalance`
- `priority`: `all`, `immediate`, `next`, `follow_up`
- `ownerRole`: `all`, `operator`, `engineering`, `security`, `founder`

Response schema:

- `adminIncidentTrendActionQueueResponseSchema`
- `actions[]`: `adminIncidentTrendActionSchema`
- `summary`: total, proposed, accepted, dismissed, immediate, related incidents
- `limit` and `offset`

## GET /v1/admin/incidents/trend-action-queue/export

Exports the same filtered queue.

Supported formats:

- `format=json`
- `format=csv`

## POST /v1/admin/incidents/trend-action-queue/bulk

Applies a bounded bulk decision.

Request schema:

- `adminIncidentTrendActionQueueBulkDecisionRequestSchema`
- `actionIds`: 1 to 25 deterministic action IDs
- `decision`: `accept` or `dismiss`
- `note`: optional sanitized admin note

Response schema:

- `adminIncidentTrendActionQueueBulkDecisionResponseSchema`
- `updatedActions`
- `succeeded`
- `failed`
- `timelineEventsCreated`

Security contract:

- raw admin email is never returned;
- raw session ID is never returned;
- UUIDs, tokens, database URLs and Redis URLs must not be rendered in UI;
- unsafe notes are rejected before persistence.

Marker: Batch #109.
Marker: GET /v1/admin/incidents/trend-action-queue.
Marker: GET /v1/admin/incidents/trend-action-queue/export.
Marker: POST /v1/admin/incidents/trend-action-queue/bulk.
Marker: adminIncidentTrendActionQueueResponseSchema.
Marker: adminIncidentTrendActionQueueBulkDecisionRequestSchema.
