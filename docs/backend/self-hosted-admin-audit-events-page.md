# Self-hosted admin audit events page

Batch #100 adds `/admin/audit` as the browser operator page for the existing
self-hosted admin audit read/export boundary.

## Scope

The page is a read-only operator console. It uses:

- `GET /v1/admin/audit-events`;
- `GET /v1/admin/audit-events/export?format=csv`;
- self-hosted account session headers;
- the same owned `admin` role boundary as `/admin/runtime`, `/admin/access-*`
  and `/admin`.

The page must not use Supabase, Firebase, Appwrite, Clerk, Auth0 or another
hosted BaaS/SaaS backend as a production data source.

## Commands

```bash
npm run test:admin-audit-frontend
npm run smoke:e2e:admin-audit-events
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

## Browser behavior

The page renders explicit states:

- self-hosted API disabled;
- self-hosted session required;
- admin role required;
- loading;
- error;
- ready list.

The ready state includes bounded filters for `outcome`, `statusClass` and
`route`, plus a CSV export link. The frontend never fabricates audit rows from a
mock when the self-hosted API is configured.

## 10,000 concurrent users baseline

Expected read/write profile: low-frequency admin reads. The page performs a
bounded list read and optional CSV export. It does not write production data.

Cache, queue and backpressure strategy: no browser polling. Operators refresh
manually. Backend request guardrails, session validation, admin role checks,
audit retention limits and export-window limits provide pressure control.

Database indexing and pagination strategy: the endpoint uses the admin audit
indexes introduced in the durable audit and admin audit hardening batches. UI
filters map only to supported backend query parameters. Exports remain bounded
by backend window and limit guards.

Failure mode and graceful degradation: missing API, missing session, forbidden
role or backend errors render visible states. The page does not leak session
ids, emails, connection strings, passwords or storage endpoints.

Observability and load-test plan: coverage comes from
`test:admin-audit-frontend`, `smoke:e2e:admin-audit-events`,
`check:self-hosted-api` and `check:production-scale-baseline`. Load testing
should exercise bounded audit list reads and CSV export windows separately from
normal buyer catalog traffic because this is an operator-only path.
