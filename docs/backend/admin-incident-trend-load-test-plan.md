# Admin Incident Trend Load Test Plan

This plan defines how Batch #107 should be load-tested before the trend
analytics route is treated as production-ready for the YORSO control plane.

## Baseline

Production baseline: `10,000 concurrent users`.

Admin incident trend analytics is a control-plane workload. It is not expected
to receive the same request rate as buyer catalog browsing, but it must stay
stable while the marketplace is under load.

## Scenario A: Normal Operator Shift

- 25 concurrent admin operators.
- Trend refresh every 60 seconds.
- Anomaly read every 5 minutes.
- Briefing read every 15 minutes.
- JSON export every 20 minutes.
- CSV export every 30 minutes.

Expected result:

- p95 API latency remains bounded;
- no route returns raw server internals;
- no unbounded memory growth;
- no request timeout under indexed data volume.

## Scenario B: Incident Spike

- 100 concurrent admin operators.
- Trend refresh every 30 seconds.
- Anomaly read every 2 minutes.
- Briefing read every 5 minutes.
- CSV export every 10 minutes.

Expected result:

- API request guardrails remain active;
- admin routes remain authenticated;
- trend queries use indexes from `0023_admin_incident_trend_analytics`;
- exporter response size remains bounded.

## Scenario C: Marketplace Load Plus Operators

- 10,000 concurrent marketplace users.
- 100 admin operators.
- Catalog and supplier reads continue through self-hosted APIs.
- Trend reads run in parallel.

Expected result:

- trend routes do not starve catalog routes;
- PostgreSQL connection pool remains stable;
- API continues returning readiness checks;
- route metrics show admin trend pressure separately.

## Data Volume

Test with synthetic volumes:

- 30 days of incident events;
- at least 50,000 incident timeline rows;
- at least 100,000 execution item updates;
- mixed sources: `runtime`, `audit`, `access`, `policy`, `security`;
- mixed statuses: `open`, `acknowledged`, `resolved`.

## Backpressure

Batch #107 avoids background polling. If future dashboards require live trend
refresh, add:

- short TTL Redis snapshots keyed by sanitized filter hash;
- per-admin export throttle;
- explicit max export rows;
- metrics for snapshot hit rate and stale reads.

## Exit Criteria

- no P0 access leak;
- no raw email/session/secret in trend response or browser DOM;
- p95 trend response stable under Scenario B;
- CSV export remains bounded;
- `/health/ready` stays healthy during Scenario C.

Marker: Batch #107.
Marker: 10,000 concurrent users.
Marker: 0023_admin_incident_trend_analytics.
