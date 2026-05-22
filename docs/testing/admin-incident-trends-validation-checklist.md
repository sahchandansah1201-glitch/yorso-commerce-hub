# Admin Incident Trends Validation Checklist

Use this checklist before publishing Batch #107.

## Size Gate

- Batch #106 baseline confirmed from git.
- Batch #107 changed file count is at least 47.
- Batch #107 insertion count is at least 4647.
- Size report includes untracked files before staging.

## Backend Contract

- trend query schema accepts only supported windows;
- trend query schema accepts only supported granularity;
- trend limit is capped;
- export format is only JSON or CSV;
- anomaly severity is bounded;
- briefing sections are bounded.

## Backend Runtime

- `/v1/admin/incidents/trends` requires admin session;
- `/v1/admin/incidents/trends/export` requires admin session;
- `/v1/admin/incidents/trends/anomalies` requires admin session;
- `/v1/admin/incidents/trends/briefing` requires admin session;
- non-admin session cannot read trend analytics;
- invalid query cannot trigger broad repository reads.

## Frontend Runtime

- disabled state works without API URL;
- session-required state works without self-hosted session;
- forbidden state works for admin role failure;
- loading state appears during request;
- ready state renders summary;
- error state renders bounded copy;
- export success is visible;
- export failure is bounded.

## Browser Smoke

- page opens at `/admin/incident-trends`;
- filters update request URL;
- JSON export calls export endpoint;
- CSV export calls export endpoint;
- anomaly loader calls anomalies endpoint;
- briefing loader calls briefing endpoint;
- `x-yorso-user-id` is sent;
- `x-yorso-session-id` is sent.

## Data Hygiene

- no raw email in DOM;
- no raw session id in DOM;
- no `postgres://` in DOM;
- no `redis://` in DOM;
- no token-like secret in export fixture;
- route paths are allowed only in admin trend context.

## Production-Scale Review

- read/write profile is documented;
- cache/backpressure strategy is documented;
- indexing strategy is documented;
- failure mode is documented;
- observability plan is documented;
- load-test plan references 10,000 concurrent users.

## Publication

- all validation commands pass;
- `git diff --check` passes;
- Batch Size Report is included in final response;
- PR title uses `[codex] Batch #107 admin incident trend analytics`;
- Lovable sync prompt is numbered as Prompt #107.

Marker: Batch #107.
Marker: admin incident trend analytics.
Marker: validation checklist.
