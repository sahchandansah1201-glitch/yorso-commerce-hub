# Admin Incident Trends Failure Modes

Batch #107 failure handling must be explicit. The page must not silently invent
trend data and the API must not leak raw internals.

## Frontend Failure Modes

Disabled:

- `VITE_YORSO_API_URL` is missing.
- The page explains that self-hosted API configuration is required.

Session required:

- no self-hosted buyer/admin session in browser storage;
- operator must sign in through the self-hosted auth flow.

Forbidden:

- API returns admin role failure;
- page must not retry in a loop.

Error:

- API returns unexpected failure;
- page shows bounded error copy.

Export failed:

- export buttons must show a bounded export status;
- no raw stack or response body is rendered.

## Backend Failure Modes

Validation failure:

- invalid window, granularity, limit, source, severity or status;
- return validation error, not a broad query.

Auth failure:

- missing or invalid session;
- return the same admin boundary behavior as other admin incident routes.

Repository pressure:

- queries remain bounded by contract limit;
- indexes from `0023_admin_incident_trend_analytics` support the common paths.

## Graceful Degradation

Operators can still use:

- `/admin/incidents`;
- `/admin/incident-workload`;
- `/admin/incident-execution`;
- `/admin/audit`.

Trend analytics is useful for shift planning but is not the only incident
response path.

Marker: Batch #107.
Marker: failure mode.
Marker: graceful degradation.
