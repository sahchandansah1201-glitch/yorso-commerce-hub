# YORSO Twenty CRM Integration

Status: local-lab integration implemented; production rollout gated

## Purpose

Twenty is the default CRM workspace for YORSO operators and company
administrators. YORSO remains the system of record for marketplace accounts,
companies, offers, supplier access and authorization. Twenty is a separate
self-hosted application used for CRM workflows.

## Runtime Topology

- YORSO UI: `http://127.0.0.1:3300/`
- YORSO API: `http://127.0.0.1:3000/`
- Twenty CRM: `http://127.0.0.1:3020/`
- Twenty Compose project: `yorso-twenty`
- Compose files: `infra/twenty/docker-compose.yml` and
  `infra/twenty/docker-compose.local.yml`
- Persistent Docker volumes: `yorso-twenty_db-data`,
  `yorso-twenty_redis-data`, `yorso-twenty_server-local-data`

Start or reconcile the complete local runtime:

```bash
npm run local-lab:restart
npm run local-lab:status
```

Inspect Twenty directly:

```bash
docker compose --env-file infra/twenty/.env \
  -f infra/twenty/docker-compose.yml \
  -f infra/twenty/docker-compose.local.yml ps
curl --fail http://127.0.0.1:3020/healthz
```

Do not use `docker compose down --volumes` for routine restarts. That command
would delete persistent CRM data.

## Application Contract

1. Signed-in users see a CRM entry in the desktop and mobile account menus.
2. `/crm` requests `GET /v1/crm/full-ui` from the self-hosted YORSO API.
3. The API returns the configured Twenty URL only to an authenticated `admin`
   or `company_admin` session.
4. Before returning the URL, the API checks Twenty `/healthz`. Local defaults
   use a 1 second timeout and cache the result for 5 seconds.
5. CRM access is disabled unless all three server-side runtime settings are
   present: `YORSO_CRM_ENABLED=true`,
   `YORSO_CRM_TENANT_ISOLATION_ENABLED=true` and a valid
   `TWENTY_PUBLIC_CRM_URL`. The local-lab runtime sets all three explicitly.
6. The browser opens Twenty as a separate application. Twenty has its own
   login until a real, reviewed single-sign-on integration is implemented.
7. YORSO does not embed Twenty in an iframe and does not expose server CRM
   configuration through frontend environment variables.
8. If the local YORSO session is stale or lacks the self-hosted session
   identifiers, `/crm` asks the user to sign in again and preserves `/crm` as
   the post-login destination. This is not reported as Twenty downtime.
9. If Twenty is unavailable, `/crm` shows a localized retryable error while
   the rest of YORSO remains usable.

Run the deterministic CRM acceptance as two isolated Playwright processes:

```bash
npm run smoke:e2e:crm-acceptance
```

The account-menu and CRM specs intentionally run sequentially. Reusing one
Playwright worker for both specs can leave a macOS FSEvents watcher alive after
all assertions pass; process isolation keeps the acceptance command bounded
without forcing `process.exit` or hiding product failures.

## Security Boundary

- Authorization is enforced by the YORSO API, not only by menu visibility.
- The CRM URL is read from server configuration and validated as HTTP/HTTPS.
- Production configuration requires HTTPS.
- The endpoint response contains only `ok`, `crmUrl` and `requestId`.
- No YORSO session token is forwarded to Twenty.
- No automatic account provisioning or tenant mapping is claimed by this
  integration.
- Production rollout remains blocked until tenant isolation, user lifecycle
  and audit requirements are independently reviewed.

## Baseline Scale Contract (10,000 Concurrent Users)

### Read and Write Profile

- One protected read of `/v1/crm/full-ui` occurs when a user opens `/crm`.
- A user retry creates one additional protected read.
- Each protected read performs one indexed `exists` query against
  `yorso_user_roles` for the authenticated user and the allowed CRM roles.
- This integration performs no CRM writes and no YORSO database writes.
- Subsequent CRM traffic goes directly to the self-hosted Twenty deployment.

### Cache, Queue and Backpressure

- The frontend does not persist or cache the CRM URL.
- Twenty availability is cached in each API process for 5 seconds. Concurrent
  cache misses for the same URL share one in-flight `/healthz` request.
- The health probe is aborted after 1 second, so a stalled Twenty instance does
  not consume API capacity indefinitely.
- Authentication fails closed, but this endpoint does not yet have a dedicated
  rate limiter. Production rollout at 10,000 concurrent users requires an
  edge/API request budget and a shared availability cache or health worker so
  every API process does not probe Twenty independently.
- No queue is needed for this read-only handoff. Future synchronization jobs
  must use an explicit queue with retries, idempotency and dead-letter handling.

### Database, Indexing and Pagination

- The handoff endpoint reuses `yorso_user_roles` and performs one membership
  query. Its `(user_id, role)` primary key supports this user-first lookup;
  `idx_yorso_user_roles_role_user` supports role-first administrative access.
- The endpoint returns one launch resource, so pagination is not applicable.
- Twenty owns indexing and pagination inside its CRM data model.
- Any future YORSO-to-Twenty synchronization must document indexed tenant and
  external-id keys before production use.

### Failure and Graceful Degradation

- Missing authorization returns `403` without exposing the CRM URL.
- Missing or stale YORSO sessions return `401`; the UI offers a new sign-in and
  redirects back to `/crm` after authentication.
- Disabled or invalid CRM configuration and a failed Twenty health probe return
  `503`.
- Twenty downtime does not block the YORSO UI, API, catalog or account pages.
- The CRM page retains a retry action and a link is rendered only after a
  successful protected response.

### Observability and Load Test Plan

- Correlate `/v1/crm/full-ui` responses through `requestId`.
- Monitor endpoint request rate, latency and `403`/`503` ratios.
- Monitor Twenty server, worker, PostgreSQL and Redis health separately.
- Before production rollout, load-test the protected handoff at the 10,000
  concurrent-user baseline and test Twenty capacity independently with a
  representative CRM workload.

## Production Gates

- HTTPS public Twenty URL and managed secrets.
- Tenant isolation proven for every YORSO company.
- User provisioning, suspension and removal lifecycle.
- Auditable role mapping between YORSO and Twenty.
- Backup and restore drill for Twenty PostgreSQL and file storage.
- Capacity and failure-injection tests at the production baseline.
- Explicit decision on single sign-on; separate login remains the truthful
  default until that work is completed.
