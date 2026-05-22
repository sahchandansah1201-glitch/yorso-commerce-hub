# Admin Incident Trend API Contract

Batch #107 uses typed contracts from `packages/contracts/src/admin-incidents.ts`.
The API surface is deliberately small and bounded.

## Query Parameters

Shared trend query:

- `window`: `24h`, `7d`, `30d`
- `granularity`: `hour`, `day`
- `source`: optional incident source
- `severity`: optional incident severity
- `status`: optional incident status
- `includeResolved`: boolean
- `limit`: integer from 1 to 50

Export query adds:

- `format`: `json` or `csv`

The service must not interpolate raw user-provided sort keys or SQL fragments.
All filters pass through the Zod contract before service execution.

## GET /v1/admin/incidents/trends

Returns:

- `buckets`: bounded bucket series, max 60;
- `sourceMix`: source dimensions;
- `statusMix`: status dimensions;
- `severityMix`: severity dimensions;
- `routeRisks`: bounded route-risk rows;
- `sla`: SLA posture;
- `summary`: total, critical, breached, peak bucket and direction.

The response is aggregate-only. Raw user email, session id and secret-like
values are not part of the contract.

## GET /v1/admin/incidents/trends/export

`format=json` returns the same typed trend response.

`format=csv` returns a bounded CSV table with bucket-level aggregates. CSV
export is not a data lake dump. It is a handoff artifact for operators.

## GET /v1/admin/incidents/trends/anomalies

Returns anomaly rows with:

- `signal`
- `severity`
- `baseline`
- `current`
- `deltaPct`
- `evidence`
- `recommendedAction`

This route helps operators decide where to inspect next. It does not decide
business policy automatically.

## GET /v1/admin/incidents/trends/briefing

Returns shift-briefing sections:

- headline summary;
- operator actions;
- capacity review;
- risk register;
- narrative sections.

Briefing text must remain sanitized. It can mention route names and aggregate
counts, but not raw actor details.

## Access Control

Every route is admin-session protected. The API requires:

- valid `x-yorso-user-id`;
- valid `x-yorso-session-id`;
- admin role.

The frontend stores and forwards the self-hosted session headers through
`createAdminIncidentsApiClient`.

## Error Contract

Known failures should remain machine-readable:

- missing self-hosted API URL on frontend -> disabled state;
- missing session -> session-required state;
- non-admin session -> forbidden state;
- invalid query -> validation error;
- backend error -> bounded error state.

Marker: Batch #107.
Marker: adminIncidentTrendResponseSchema.
Marker: adminIncidentTrendAnomaliesResponseSchema.
Marker: adminIncidentTrendBriefingResponseSchema.
