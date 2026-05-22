# Decision: Batch #107 Admin Incident Trend Analytics

Date: 2026-05-22

## Decision

Batch #107 continues the self-hosted admin operator sequence with admin incident
trend analytics instead of starting a new product area.

## Reason

Batch #106 added workload and correlation. The next connected production step is
trend analytics:

- bucketed incident pressure;
- route risk review;
- SLA posture;
- anomaly review;
- operator briefing;
- JSON/CSV export.

This keeps the batch focused on one operator surface while still touching
backend, frontend, contracts, DB, tests, smoke, docs, guards and CI.

## Constraint

The batch must be at least 20 percent larger than Batch #106 by changed file
count and inserted-line count unless a blocker is stated before implementation.

Batch #106 baseline:

- 39 files changed;
- 3872 insertions;
- 48 deletions.

Batch #107 minimum target:

- 47 files changed;
- 4647 insertions.

## Production Position

Self-hosted PostgreSQL remains the production database target. Supabase and
hosted BaaS products are not production runtime dependencies.

## Capacity Position

The feature is production-facing admin control plane work and must be reviewed
against the 10,000 concurrent users baseline.
