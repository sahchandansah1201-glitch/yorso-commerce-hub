# Admin Incident Trends E2E

Batch #107 adds `e2e/admin-incident-trends.spec.ts`.

## Command

```bash
npm run smoke:e2e:admin-incident-trends
```

The script builds the frontend with:

```bash
VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api
```

This keeps the API-backed route under a dedicated smoke script instead of adding
it to generic `smoke:e2e:run`.

## Coverage

The browser smoke covers:

- `/admin/incident-trends` page load;
- self-hosted session header propagation;
- trend filters;
- JSON export;
- CSV export;
- anomaly loading;
- briefing loading;
- no raw emails;
- no raw session id;
- no database URL strings;
- no Redis URL strings.

## Required Test IDs

- `admin-incident-trends-page`
- `admin-incident-trends-filters`
- `admin-incident-trends-window-filter`
- `admin-incident-trends-granularity-filter`
- `admin-incident-trends-source-filter`
- `admin-incident-trends-severity-filter`
- `admin-incident-trends-status-filter`
- `admin-incident-trends-export-json`
- `admin-incident-trends-export-csv`
- `admin-incident-trends-buckets`
- `admin-incident-trends-route-risks`
- `admin-incident-trends-anomalies`
- `admin-incident-trends-briefing`

## Guard

The e2e fixture must match the exported contract schema. Do not infer fields
from the UI. If the contract changes, update the fixture and the schema tests
together.

Marker: Batch #107 browser guard.
Marker: smoke:e2e:admin-incident-trends.
