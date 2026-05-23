# Admin Incident Trend Action Queue

Batch #109 promotes the Batch #108 inline trend action panel into a dedicated
operator queue. The page is `/admin/incident-trend-actions`; the backend route
family is `/v1/admin/incidents/trend-action-queue`.

This remains a self-hosted YORSO feature. It uses the Node API, self-hosted
sessions, self-hosted PostgreSQL, existing audit and metrics paths, and no
Supabase, Firebase, Appwrite, Clerk, Auth0 or hosted BaaS production runtime.

## Runtime Shape

- `GET /v1/admin/incidents/trend-action-queue` lists bounded trend action
  proposals and durable decisions with filters.
- `GET /v1/admin/incidents/trend-action-queue/export?format=json|csv` exports
  the same bounded queue.
- `POST /v1/admin/incidents/trend-action-queue/bulk` applies accept or dismiss
  decisions to selected actions.
- `/admin/incident-trend-actions` renders filters, summary cards, selection,
  JSON/CSV export and bulk accept/dismiss controls.

## 10,000 Concurrent Users Baseline

This is an admin control-plane workload. It is not on the public catalog,
supplier directory, offer detail, sign-in or buyer access-request hot path.

Read profile:

- admin-only queue reads;
- bounded `window`, `limit`, `offset`, `decision`, `kind`, `priority` and
  `ownerRole` filters;
- no automatic polling from the browser.

Write profile:

- explicit bulk decisions only;
- one durable decision per selected action;
- accepted decisions update a bounded set of related incident workflow rows;
- dismissed decisions do not mutate incident workflow.

Failure mode:

- missing API renders disabled state;
- missing session renders session-required state;
- non-admin session renders forbidden state;
- export or bulk failures leave the queue in its previous safe state.

Marker: Batch #109.
Marker: trend action queue.
Marker: /admin/incident-trend-actions.
Marker: /v1/admin/incidents/trend-action-queue.
Marker: /v1/admin/incidents/trend-action-queue/export.
Marker: /v1/admin/incidents/trend-action-queue/bulk.
Marker: 10,000 concurrent users.
