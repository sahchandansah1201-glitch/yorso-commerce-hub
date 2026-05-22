# Admin Incident Trends Runtime Smoke

Batch #107 extends `scripts/smoke-self-hosted-admin-incidents.mjs` with trend
analytics checks.

## Command

```bash
npm run smoke:self-hosted-admin-incidents
```

For CI after API build:

```bash
npm run smoke:self-hosted-admin-incidents:run
```

## Markers

Expected trend markers:

- `admin_incidents_trends=ok`
- `admin_incidents_trends_filters=ok`
- `admin_incidents_trends_export_json=ok`
- `admin_incidents_trends_export_csv=ok`
- `admin_incidents_trends_anomalies=ok`
- `admin_incidents_trends_briefing=ok`

## What It Proves

The smoke proves that:

- the admin route is reachable with a valid admin session;
- the trend response is aggregate and bounded;
- filter parameters are accepted;
- JSON export returns typed trend response;
- CSV export returns bounded bucket rows;
- anomalies return bounded rows;
- briefing contains operator actions and capacity review;
- sensitive raw identity fields do not appear in trend payloads.

## What It Does Not Prove

It is not a full load test. It does not prove p95 latency under 10,000
concurrent marketplace users. That remains a separate load-test plan.

Marker: Batch #107.
Marker: admin_incidents_trends=ok.
