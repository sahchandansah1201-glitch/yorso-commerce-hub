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

- Batch #102 is implemented locally on branch `codex/batch102-incident-workflow`.
- Batch #102 extends self-hosted admin incidents into an operator workflow:
  - `POST /v1/admin/incidents/:incidentId/workflow` supports assign, comment, escalate and resolve actions;
  - `POST /v1/admin/incidents/workflow/bulk` supports bounded selected-incident workflow updates;
  - `GET /v1/admin/incidents/export` supports sanitized JSON/CSV export;
  - PostgreSQL stores workflow state in `yorso_admin_incident_acknowledgements` and timeline events in `yorso_admin_incident_events`;
  - frontend `/admin/incidents` renders SLA state, due time, assignment, escalation controls, bulk workflow, runbook, workload summary and timeline preview;
  - raw user ids are accepted only in admin requests, while browser responses show hashed operator identifiers.
- Local validation passed: `contracts:build`, `api:build`, `tsc -b --noEmit`, focused admin incident API tests, `test:admin-incidents-frontend`, `test:admin-operations-frontend`, `test:db-contract`, `test:db-migrations`, `check:self-hosted-db`, `check:self-hosted-api`, `check:production-scale-baseline`, `check:engineering-lessons`, `smoke:self-hosted-admin-incidents:run`, `smoke:e2e:admin-incidents`, `smoke:e2e:admin-operations`, `ci:core` and `git diff --check`.
- Pending handoff steps: commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #102 publication:
1. commit and push branch codex/batch102-incident-workflow;
2. open PR [codex] Batch #102 admin incident workflow;
3. merge after checks pass;
4. give Lovable Prompt #102 to sync latest GitHub main.

Then choose Batch #103 as another larger connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
