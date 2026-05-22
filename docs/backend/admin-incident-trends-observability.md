# Admin Incident Trends Observability

Batch #107 relies on existing request, error, metrics and audit pipelines. The
feature adds admin route actions and smoke markers so the trend path can be
observed without adding a new external dependency.

## Route Actions

Audit actions:

- `admin.incidents.trends.read`
- `admin.incidents.trends.export`
- `admin.incidents.trends.anomalies`
- `admin.incidents.trends.briefing`

These actions are useful for operator accountability. They should not include
raw exported payloads.

## Metrics

Expected existing metrics dimensions:

- route;
- method;
- status class;
- latency bucket;
- error class.

Trend-specific dashboards should group:

- `/v1/admin/incidents/trends`;
- `/v1/admin/incidents/trends/export`;
- `/v1/admin/incidents/trends/anomalies`;
- `/v1/admin/incidents/trends/briefing`.

## Logs

Logs may include:

- request id;
- route;
- status code;
- sanitized error code.

Logs must not include:

- emails;
- passwords;
- sessions;
- database URLs;
- full CSV payloads.

## Smoke Markers

Runtime smoke markers:

- `admin_incidents_trends=ok`
- `admin_incidents_trends_filters=ok`
- `admin_incidents_trends_export_json=ok`
- `admin_incidents_trends_export_csv=ok`
- `admin_incidents_trends_anomalies=ok`
- `admin_incidents_trends_briefing=ok`

Browser smoke marker:

- `smoke:e2e:admin-incident-trends`

Marker: Batch #107.
Marker: observability.
