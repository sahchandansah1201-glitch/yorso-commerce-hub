# Self-hosted admin incidents smoke

Batch #101 adds the admin incident response console for the self-hosted YORSO
backend. It is designed as a low-frequency operator workflow under the
10,000 concurrent users production baseline.

## Scope

The smoke validates:

- `GET /v1/admin/incidents`;
- `GET /v1/admin/incidents/:incidentId`;
- `POST /v1/admin/incidents/:incidentId/acknowledge`;
- admin-only access boundaries;
- durable acknowledgement and resolution state;
- secret-safe incident payloads.

Incidents are derived from runtime diagnostics and admin audit events. The
backend stores only operator acknowledgement state in PostgreSQL through
`yorso_admin_incident_acknowledgements`.

## Command

```bash
npm run smoke:self-hosted-admin-incidents
```

For CI after `api:build`:

```bash
npm run smoke:self-hosted-admin-incidents:run
```

## Expected markers

The script must print:

- `admin_incidents_auth_guard=ok`;
- `admin_incidents_role_guard=ok`;
- `admin_incidents_list=ok`;
- `admin_incidents_summary=ok`;
- `admin_incidents_detail=ok`;
- `admin_incidents_acknowledge=ok`;
- `admin_incidents_no_secrets=ok`;
- `admin_incidents_status_filter=ok`;
- `admin_incidents_resolve=ok`;
- `admin_incidents_validation_guard=ok`;
- `self_hosted_admin_incidents_smoke=ok`.

## Production-scale notes

Read profile: low-frequency admin reads. Incident lists are bounded and derived
from runtime diagnostics plus audit summaries, not from unbounded scans.

Write profile: sparse admin acknowledgement writes. Incident acknowledgement and
resolution use a small indexed table keyed by incident id.

Cache/backpressure: no browser polling. Operators refresh explicitly. API
request guardrails, admin role checks and audit backpressure remain active.

Database strategy: `yorso_admin_incident_acknowledgements` has status and actor
indexes for durable admin state. Incident derivation remains bounded by query
limits and typed filters.

Failure mode: missing API, missing session, forbidden role and backend errors
render explicit UI states. The frontend does not fabricate incidents.

Observability: incident reads and acknowledgements emit admin audit events and
use existing request, error and metrics telemetry. Payloads must not include
emails, session ids, passwords, connection strings or storage endpoints.

Marker: Batch #101.
Marker: admin incident response.
Marker: /v1/admin/incidents.
Marker: /admin/incidents.
Marker: smoke:self-hosted-admin-incidents.
Marker: smoke:e2e:admin-incidents.
Marker: admin_incidents_acknowledge=ok.
