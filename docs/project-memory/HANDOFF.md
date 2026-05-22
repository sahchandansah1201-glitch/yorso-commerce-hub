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

- Batch #104 is implemented locally on branch `codex/batch104-incident-remediation-execution`.
- Batch #104 extends self-hosted admin incidents with an execution tracker and export:
  - `GET /v1/admin/incidents/:incidentId/execution` returns bounded execution items derived from remediation/postmortem data;
  - `GET /v1/admin/incidents/:incidentId/execution/export?format=json|csv` exports the bounded execution plan for handoff/offline review;
  - `POST /v1/admin/incidents/:incidentId/execution/:itemId` updates one execution item to `open`, `in_progress`, `done`, `blocked` or `skipped`;
  - `packages/db/migrations/0021_admin_incident_execution.sql` stores execution state in `yorso_admin_incident_execution_items` with indexed status/source/assignee reads;
  - frontend `/admin/incidents/:incidentId` renders `admin-incident-detail-execution`, explicit load controls, execution plan/status and item actions;
  - note hygiene rejects raw emails, UUIDs and token-like secret assignments before execution updates;
  - routes remain behind self-hosted admin session and role guards.
- Local validation passed after execution export expansion: `contracts:build`, `api:build`, focused admin incident API tests, `test:admin-incidents-frontend`, `check:self-hosted-db`, `check:self-hosted-api`, `check:production-scale-baseline`, `smoke:self-hosted-admin-incidents:run`, `smoke:e2e:admin-incident-detail`, `lint`, `tsc -b --noEmit` and `ci:core`.
- Pending handoff steps: commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #104 publication:
1. commit and push branch codex/batch104-incident-remediation-execution;
2. open PR [codex] Batch #104 admin incident execution;
3. merge after checks pass;
4. give Lovable Prompt #104 to sync latest GitHub main.

Then choose Batch #105 as another larger connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
