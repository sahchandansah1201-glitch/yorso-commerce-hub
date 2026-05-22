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

- Batch #105 is implemented locally on branch `codex/batch105-incident-execution-queue`.
- Batch #105 extends self-hosted admin incidents with a cross-incident execution queue:
  - `GET /v1/admin/incidents/execution-queue` lists bounded execution items across incidents;
  - `GET /v1/admin/incidents/execution-queue/export?format=json|csv` exports the current bounded queue page;
  - `POST /v1/admin/incidents/execution-queue/bulk` bulk-updates at most 50 selected `(incidentId, itemId)` refs;
  - frontend `/admin/incident-execution` renders `admin-incident-execution-queue-page`, filters, summary cards, export controls and bulk action panel;
  - notes, evidence and blocked reasons reuse hygiene guards against raw emails, UUIDs, session ids and token-like secrets;
  - routes remain behind self-hosted admin session and role guards.
- Local validation passed: `contracts:build`, `api:build`, `tsc -b --noEmit`, `test:api`, `test:admin-incidents-frontend`, `check:self-hosted-api`, `check:production-scale-baseline`, `smoke:self-hosted-admin-incidents:run`, `smoke:e2e:admin-incident-execution-queue`, `lint` and `ci:core`.
- Pending handoff steps: commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #105 publication:
1. commit and push branch codex/batch105-incident-execution-queue;
2. open PR [codex] Batch #105 admin incident execution queue;
3. merge after checks pass;
4. give Lovable Prompt #105 to sync latest GitHub main.

Then choose Batch #106 as another larger connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
