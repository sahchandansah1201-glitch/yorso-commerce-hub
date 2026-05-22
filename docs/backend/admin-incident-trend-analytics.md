# Admin Incident Trend Analytics

Batch #107 adds the admin incident trend analytics surface for the self-hosted
YORSO operator console. The feature turns the incident response stream into a
bounded trend view, anomaly review and operator briefing without adding a hosted
BaaS dependency.

## Production Purpose

The operator team already has incident list, detail, execution, queue and
workload views. Those views answer "what is open now". Trend analytics answers
"what is getting worse", "which routes are absorbing capacity", and "what should
be handed to the next operator shift".

The page is intentionally admin-only. It is not a marketplace buyer or supplier
feature, and it must never expose raw user identifiers, emails, sessions,
connection strings or secret-like notes.

## Routes

- Frontend: `/admin/incident-trends`
- Trends: `GET /v1/admin/incidents/trends`
- Export: `GET /v1/admin/incidents/trends/export?format=json|csv`
- Anomalies: `GET /v1/admin/incidents/trends/anomalies`
- Briefing: `GET /v1/admin/incidents/trends/briefing`

All backend routes are protected by the self-hosted admin session boundary. A
missing session returns a session error. A non-admin user returns
`admin_role_required`. Anonymous public traffic must not reach the trend data.

## Data Shape

Trend analytics uses these contract groups:

- `adminIncidentTrendQuerySchema`
- `adminIncidentTrendExportQuerySchema`
- `adminIncidentTrendResponseSchema`
- `adminIncidentTrendAnomaliesResponseSchema`
- `adminIncidentTrendBriefingResponseSchema`

The response is intentionally aggregate-first:

- buckets by hour or day;
- source, status and severity dimensions;
- route risk rows;
- SLA posture;
- anomaly rows;
- operator briefing sections.

The response does not include raw incident notes, raw actors or raw sessions.

## Operator Workflow

1. Operator opens `/admin/incident-trends`.
2. Page loads disabled, session-required, forbidden, loading, error or ready
   state.
3. Operator selects window, granularity, source, severity and status.
4. Page loads bounded trend data.
5. Operator can export JSON or CSV for shift handoff.
6. Operator can explicitly load anomalies.
7. Operator can explicitly load briefing.

There is no background polling in Batch #107. Refresh, export, anomaly and
briefing reads are deliberate operator actions.

## Scale Contract

This is a control-plane workload under the `10,000 concurrent users` production
baseline. It is expected to be low-frequency compared with marketplace catalog
traffic:

- 100 concurrent operators at peak is an upper planning bound.
- One trend refresh per operator per 30 seconds is the load-test scenario.
- One export per operator per 10 minutes is the export scenario.
- Anomaly and briefing reads are explicit and are not polled.

## Database Support

Migration `0023_admin_incident_trend_analytics` adds indexes for:

- incident event time buckets;
- incident event type drill-down;
- acknowledgement status and escalation scans;
- execution status/source trend reads;
- execution incident trend reads;
- open execution priority reviews.

These indexes are intended to keep trend reads bounded when marketplace runtime
traffic scales independently.

## Failure Mode

- If API URL is missing, the page renders disabled state.
- If session is missing, it renders session-required state.
- If role is not admin, it renders forbidden state.
- If the API fails, it renders a bounded error state.
- If export fails, it renders export status instead of leaking raw exception
  internals.

## Validation

Required validation:

- `npm run test:admin-incidents-frontend`
- `npm run smoke:self-hosted-admin-incidents`
- `npm run smoke:e2e:admin-incident-trends`
- `npm run check:self-hosted-api`
- `npm run check:self-hosted-db`
- `npm run check:production-scale-baseline`

Marker: Batch #107.
Marker: admin incident trend analytics.
Marker: /admin/incident-trends.
Marker: /v1/admin/incidents/trends.
Marker: /v1/admin/incidents/trends/export.
Marker: /v1/admin/incidents/trends/anomalies.
Marker: /v1/admin/incidents/trends/briefing.
Marker: 0023_admin_incident_trend_analytics.
Marker: 10,000 concurrent.
