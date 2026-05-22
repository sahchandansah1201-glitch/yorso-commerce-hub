# Admin Incident Trend Actions API Contract

Batch #108 adds a self-hosted API contract for trend-derived operator actions.
The API is protected by the same admin session and role guard used by the rest
of the admin incident console.

## Endpoints

### GET /v1/admin/incidents/trends/actions

Returns derived trend action proposals for the selected trend window.

Query parameters are the existing trend query contract:

- `window`: `24h`, `7d`, `30d`
- `granularity`: `hour`, `day`
- `limit`: 1 to 50
- `severity`, `source`, `status`, `includeResolved`

Response schema:

- `adminIncidentTrendActionsResponseSchema`
- `actions[]`: `adminIncidentTrendActionSchema`
- `summary`: total, proposed, accepted, dismissed, immediate, related incidents

### POST /v1/admin/incidents/trends/actions/:actionId/decision

Stores a durable decision for one derived action.

Request schema:

- `adminIncidentTrendActionDecisionRequestSchema`
- `decision`: `accept` or `dismiss`
- `note`: optional sanitized admin note

Response schema:

- `adminIncidentTrendActionDecisionResponseSchema`
- `action`: the accepted/dismissed action with sanitized actor hash
- `affectedIncidents`: bounded related incidents changed by accepted decisions
- `timelineEventsCreated`: count of appended timeline events

## Security Contract

- No raw admin email, session ID, UUID or secret is returned in action notes.
- `decidedByUserHash` uses the existing admin audit hash format.
- Dismissed decisions do not modify incident workflow.
- Accepted decisions create bounded timeline events for related incidents only.

## Frontend Contract

The admin trend page renders:

- `admin-incident-trends-actions`
- `admin-incident-trends-actions-load`
- `admin-incident-trend-action-accept-{actionId}`
- `admin-incident-trend-action-dismiss-{actionId}`

Marker: Batch #108.
