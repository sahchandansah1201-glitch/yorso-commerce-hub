# Admin Incident Trend Actions Indexing

Batch #108 introduces durable action decisions in
`yorso_admin_incident_trend_actions`.

## Table

`yorso_admin_incident_trend_actions` stores one durable decision per derived
trend action:

- `action_id`: deterministic action key from kind, window, signal and scope.
- `kind`: action family.
- `status`: `accepted` or `dismissed`.
- `related_incident_ids`: bounded incident references for drill-down.
- `decided_by_user_id`: self-hosted user reference.
- `accepted_at`, `dismissed_at`, `updated_at`: decision timestamps.

## Indexes

- `idx_yorso_admin_trend_actions_status_updated`
  supports operator review of recent accepted/dismissed decisions.
- `idx_yorso_admin_trend_actions_kind_priority`
  supports future filtering by action kind and urgency.
- `idx_yorso_admin_trend_actions_route`
  supports route-risk decisions without scanning unrelated actions.
- `idx_yorso_admin_trend_actions_related_gin`
  supports incident-to-action drill-down for bounded related incident IDs.

## 10,000 concurrent users baseline

Trend actions are admin control-plane writes. They are not on the public
catalog, supplier directory, offer detail, sign-in or access-request hot path.
The write profile is low cardinality: one row per explicit admin decision.

Backpressure strategy:

- no background polling;
- bounded query windows;
- bounded action count of 25;
- bounded related incidents of 25;
- existing request guardrails and admin-session guard remain active.

Load-test plan:

- seed 10,000+ audit-derived incidents in PostgreSQL;
- run 50 concurrent admin trend action reads;
- run 20 concurrent accept/dismiss decisions;
- verify p95 action read latency, write contention and index usage;
- verify no buyer/supplier catalog endpoint regression under concurrent load.

Marker: Batch #108.
