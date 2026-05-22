# Admin Incident Trends Regression Matrix

This matrix defines what must not regress after Batch #107.

## Access Regression

- anonymous browser must not see trend data;
- signed-in non-admin must not see trend data;
- admin session must be required for all four backend routes;
- frontend must not fabricate trend rows in disabled state.

## Query Regression

- invalid `window` rejected;
- invalid `granularity` rejected;
- invalid `limit` rejected;
- invalid `source`, `severity` and `status` rejected by schema;
- export `format` limited to JSON or CSV.

## Data Regression

- no raw email in response;
- no raw session id in response;
- no database URL in response;
- no Redis URL in response;
- route risk rows remain bounded;
- bucket count remains bounded.

## UI Regression

- filters remain visible;
- summary remains visible;
- bucket table remains visible;
- anomaly panel loads explicitly;
- briefing panel loads explicitly;
- export status reports success/failure without raw internals.

## Scale Regression

- migration `0023_admin_incident_trend_analytics` remains in manifest;
- trend smoke markers remain in CI guards;
- production-scale document keeps the 10,000 concurrent users review.

Marker: Batch #107.
Marker: regression matrix.
