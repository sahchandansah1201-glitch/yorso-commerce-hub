# Admin incident workload and correlation

Batch: #106.

This document describes the self-hosted admin workload/correlation slice added
for incident operators.

## Purpose

Operators need a consolidated view of open execution pressure before opening
individual incident details. The workload center answers:

- Which incidents are currently hot?
- Which owner role is overloaded or blocked?
- Which owner role is forecast to breach capacity in the next 24 hours?
- Which audit, timeline and execution signals explain the incident state?

## Frontend

- Route: `/admin/incident-workload`.
- Page: `src/pages/admin/AdminIncidentWorkload.tsx`.
- Hook: `src/lib/use-admin-incident-workload.ts`.
- API client: `src/lib/admin-incidents-api.ts`.
- Navigation: `AdminOperatorNav` link `Workload`.

The page supports disabled, session-required, forbidden, loading, ready and
error states. It does not poll automatically.

## Backend

- `GET /v1/admin/incidents/execution-workload`.
- `GET /v1/admin/incidents/execution-workload/export?format=json|csv`.
- `GET /v1/admin/incidents/execution-workload/forecast?horizonHours=24`.
- `GET /v1/admin/incidents/:incidentId/correlation`.

All routes use the same self-hosted admin session authority as the other admin
incident endpoints.

## Data protection

The response keeps raw user IDs, emails and session IDs out of browser-rendered
payloads. User references remain hashed. Exports use sanitized incident and
execution fields only.

## Capacity forecast

The workload forecast is deterministic and bounded. It uses only the current
execution workload page, owner load, overdue work, blocked work, immediate
priority and breached SLA incidents. It does not scan unbounded logs and it does
not predict marketplace demand.

Forecast output is operator guidance:

- projected open items;
- projected overdue items;
- owner-level capacity risk;
- one recommended action per owner role;
- explicit assumptions rendered in the UI.

## Production scale

The route is control-plane, not marketplace hot path. It is designed for
bounded operator reads at the 10,000 concurrent-user production baseline.

Database support:

- `idx_yorso_admin_incident_execution_status_updated`;
- `idx_yorso_admin_incident_execution_owner_status_due`;
- `idx_yorso_admin_incident_execution_source_status_due`;
- `idx_yorso_admin_incident_execution_incident_source_status`;
- `idx_yorso_admin_incident_events_incident_recent`;
- `idx_yorso_admin_incident_events_type_recent`.

## Validation

- `npm run test:admin-incidents-frontend`;
- `npm run smoke:self-hosted-admin-incidents`;
- `npm run smoke:e2e:admin-incident-workload`;
- `npm run check:self-hosted-api`;
- `npm run check:self-hosted-db`;
- `npm run check:production-scale-baseline`.
