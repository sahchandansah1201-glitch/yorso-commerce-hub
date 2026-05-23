# Admin Incident Trend Action Queue Indexing

Batch #109 uses the existing `yorso_admin_incident_trend_actions` table from
Batch #108 and adds queue-oriented indexes in
`0025_admin_incident_trend_action_queue`.

## Indexes

- `idx_yorso_admin_trend_actions_owner_priority`
  supports owner-role and priority queue filtering.
- `idx_yorso_admin_trend_actions_status_kind_priority`
  supports decision, action-kind and priority filtering.
- `idx_yorso_admin_trend_actions_decider_updated`
  supports review of recent operator decisions by decider.

## 10,000 Concurrent Users Baseline

The trend action queue is admin control-plane traffic. It must not create scans
that degrade buyer/supplier hot paths.

Strategy:

- bounded queue reads;
- bounded CSV/JSON export;
- no public frontend polling;
- explicit bulk writes capped at 25 actions;
- self-hosted PostgreSQL indexes for common filters.

Load-test plan:

- seed a high-cardinality incident event set and trend action decisions;
- run 50 concurrent admin queue reads;
- run 20 concurrent bulk decisions;
- keep public catalog, supplier directory and offer detail at the 10,000
  concurrent-user baseline;
- verify p95 queue read latency and no regression on public hot paths.

Marker: Batch #109.
Marker: 0025_admin_incident_trend_action_queue.
Marker: idx_yorso_admin_trend_actions_owner_priority.
Marker: idx_yorso_admin_trend_actions_status_kind_priority.
Marker: 10,000 concurrent users.
