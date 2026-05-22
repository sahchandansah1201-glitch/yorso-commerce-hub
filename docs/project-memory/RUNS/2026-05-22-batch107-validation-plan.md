# Run: Batch #107 Validation Plan

Date: 2026-05-22

## Required Checks

Run before commit:

```bash
npm run contracts:build
npm run api:build
npm run test:api
npm run test:admin-incidents-frontend
npm run test:backend-contract
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
npm run test:db-migrations
npm run test:db-contract
npm run smoke:self-hosted-admin-incidents:run
npx tsc -b --noEmit
npm run lint
npm run smoke:e2e:admin-incident-trends
npm run ci:core
git diff --check
```

## Expected Risk Areas

- contract mismatch between trend schemas and browser fixture;
- page using fields not exported by `AdminIncidentTrend*` types;
- smoke assertions checking non-existent response fields;
- docs guard failing due missing Batch #107 markers;
- package script exact-string guard failure;
- migration manifest order failure.

## Publication Rule

Do not publish if:

- size gate is below target;
- TypeScript fails;
- backend contract tests fail;
- self-hosted API guard fails;
- production-scale guard fails;
- browser smoke fails.
