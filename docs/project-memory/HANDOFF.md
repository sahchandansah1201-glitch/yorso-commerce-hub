# Handoff

Project: `yorso-commerce-hub`

## Read First

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/NEXT_ACTIONS.md`
5. `docs/project-memory/WORKLOG.md`
6. `docs/project-memory/ARTIFACTS.md`

## Current Goal

Continue self-hosted production backend/frontend batches for Yorso with large connected PRs and explicit quality gates.

## Current Status

- Batch #106 is implemented locally on branch `codex/batch106-incident-workload-correlation`.
- Batch #106 extends self-hosted admin incidents with a workload and correlation center:
  - `GET /v1/admin/incidents/execution-workload` lists bounded owner load, hot incidents, source mix and status mix;
  - `GET /v1/admin/incidents/execution-workload/export?format=json|csv` exports the same bounded workload shape;
  - `GET /v1/admin/incidents/execution-workload/forecast?horizonHours=24` projects bounded near-term capacity risk by owner role;
  - `GET /v1/admin/incidents/:incidentId/correlation` returns bounded audit, timeline and execution signals for one incident;
  - frontend `/admin/incident-workload` renders `admin-incident-workload-page`, filters, summary cards, export controls, owner load, capacity forecast and correlation drill-down;
  - browser/runtime payloads keep raw emails, session ids and unhashed user ids out of UI and exports;
  - routes remain behind self-hosted admin session and role guards.
- Local validation passed: `ci:core`, `contracts:build`, `api:build`, `tsc -b --noEmit`, `test:api`, `test:admin-incidents-frontend`, `test:backend-contract`, `check:self-hosted-db`, `check:self-hosted-api`, `check:production-scale-baseline`, `test:db-migrations`, `test:db-contract`, `smoke:self-hosted-admin-incidents:run`, `check:engineering-lessons`, `test:engineering-lessons`, `smoke:e2e:admin-incident-workload` and `lint`.
- Pending handoff steps: `git diff --check`, commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #106 publication:
1. run final `git diff --check` and size report;
2. commit and push branch codex/batch106-incident-workload-correlation;
3. open PR [codex] Batch #106 admin incident workload correlation;
3. merge after checks pass;
4. give Lovable Prompt #106 to sync latest GitHub main.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
