# Admin Incident Trend Actions

Batch #108 closes the loop between admin incident trend analytics and operator
execution. Batch #107 made trends readable; Batch #108 turns the highest-signal
trend findings into bounded action proposals that an admin can accept or
dismiss.

The feature is part of the self-hosted YORSO backend. It does not depend on
Supabase, hosted BaaS auth, hosted queues or external incident tooling.

## Runtime Shape

- `GET /v1/admin/incidents/trends/actions` derives proposals from the same
  bounded incident trend query used by `/v1/admin/incidents/trends`.
- `POST /v1/admin/incidents/trends/actions/:actionId/decision` stores an
  explicit admin decision.
- Accepted actions update related incident workflow state and append sanitized
  timeline events.
- Dismissed actions are recorded as durable operator decisions but do not
  change incident workflow.

## Action Kinds

- `sla_recovery`: critical or breached incidents need operator recovery.
- `capacity_rebalance`: trend pressure is rising and owner load must be
  rebalanced.
- `route_risk_review`: incidents concentrate on a route or runtime surface.
- `anomaly_follow_up`: trend anomaly evidence needs explicit follow-up.

## 10,000 Concurrent Users Baseline

This is an admin control-plane workload, not a buyer/supplier hot path. It is
safe for the 10,000 concurrent users baseline because:

- reads are bounded by `window`, `limit` and admin session guard;
- writes happen only on explicit operator decision;
- decisions write one row per action and at most 25 related incident references;
- accepted decisions update a bounded set of related incidents;
- no polling loop is added to the public marketplace frontend.

## Failure Mode

If action derivation fails, the trend analytics page can still show buckets,
route risk, anomalies and briefing. If decision persistence fails, the action
remains proposed and the operator can retry. The UI does not invent accepted
state locally without a successful backend response.

Marker: Batch #108.
Marker: trend action loop.
