# Admin Incident Trends Contract Tests

Batch #107 adds frontend and backend contract coverage for trend analytics.

## Frontend Tests

`src/lib/admin-incidents-trends-api.test.ts`

- verifies trend query parameters;
- verifies JSON export route;
- verifies CSV export route;
- verifies anomaly route;
- verifies briefing route;
- verifies session headers;
- rejects invalid response shapes.

`src/lib/use-admin-incident-trends.test.tsx`

- verifies disabled state when API URL is missing;
- verifies session-required state;
- verifies ready state;
- verifies export methods;
- verifies anomaly and briefing loading.

`src/pages/admin/AdminIncidentTrends.test.tsx`

- verifies page states;
- verifies filter controls;
- verifies summary rendering;
- verifies route risk and SLA panels;
- verifies export status;
- verifies anomaly and briefing controls.

## Backend Tests

`apps/api/src/modules/admin-incidents/service.test.ts`

- verifies trend aggregation;
- verifies anomaly detection;
- verifies briefing generation;
- verifies JSON and CSV export;
- verifies no raw identity values in output.

`src/test/self-hosted-admin-incident-trends-contract.test.ts`

- verifies contract fixtures;
- rejects stale trend fixture fields;
- verifies briefing capacity review includes the 10,000 concurrent users
  baseline.

## Guard Principle

The contract schema owns the response shape. Browser and smoke tests must use
the same fields as the schema, not UI-inferred aliases.

Marker: Batch #107.
Marker: test:admin-incidents-frontend.
