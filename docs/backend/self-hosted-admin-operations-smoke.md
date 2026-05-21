# Self-hosted admin operations smoke

Batch #99 adds the admin operator hub smoke for the self-hosted YORSO backend.

## Scope

The smoke validates `GET /v1/admin/operations/overview`.

The endpoint is an admin-only aggregation path. It combines:

- sanitized runtime status;
- runtime diagnostics;
- the first 5 open supplier access review rows;
- the first 5 active access grant rows;
- the 10,000 concurrent users production baseline;
- capacity-plan copy for the operator path.

## Command

```bash
npm run smoke:self-hosted-admin-operations
```

For CI after `api:build`:

```bash
npm run smoke:self-hosted-admin-operations:run
```

## Expected markers

The script must print:

- `admin_operations_auth_guard=ok`;
- `admin_operations_role_guard=ok`;
- `admin_operations_overview=ok`;
- `admin_operations_review_summary=ok`;
- `admin_operations_grants_summary=ok`;
- `admin_operations_no_secrets=ok`;
- `self_hosted_admin_operations_smoke=ok`.

## Production-scale notes

Read profile: low-frequency admin reads. One request fans out to runtime status,
diagnostics, access review preview and grants preview.

Write profile: no writes. Decisions and revocations remain in the dedicated
access review and grants endpoints.

Cache/backpressure: no background polling. The browser must use explicit refresh.
The backend returns bounded 5-row previews and reuses request timeouts, admin auth
guards and audit backpressure.

Database strategy: the endpoint uses existing indexed admin access list paths with
`limit=5`. It must not become a generic unbounded reporting endpoint.

Failure mode: if the backend is unavailable, the frontend shows a visible error.
It must not fabricate operator data.

Observability: the endpoint emits admin audit events and uses existing request,
error and metrics telemetry. The payload must not include session ids, emails,
passwords, connection strings or storage endpoints.
