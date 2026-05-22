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

- Batch #103 is implemented locally on branch `codex/batch103-incident-detail-handoff`.
- Batch #103 extends self-hosted admin incidents with a dedicated detail, handoff, remediation and postmortem surface:
  - `GET /v1/admin/incidents/:incidentId/handoff?format=json|markdown` exports a bounded, sanitized operator handoff;
  - `GET /v1/admin/incidents/:incidentId/remediation` returns bounded operator steps, verification checks, rollback plan and capacity notes;
  - `GET /v1/admin/incidents/:incidentId/postmortem?format=json|markdown` exports a bounded, sanitized postmortem draft;
  - frontend `/admin/incidents/:incidentId` renders snapshot, evidence, runbook, timeline, workflow actions, handoff controls, remediation controls and postmortem controls;
  - `/admin/incidents` links each incident row to its detail page;
  - workflow notes reject raw emails, UUIDs and token-like secret assignments;
  - browser-visible operator identifiers remain hashed, and admin-only routes stay behind self-hosted admin session and role guards.
- Local validation passed after remediation expansion: `lint`, `contracts:build`, `api:build`, `tsc -b --noEmit`, focused admin incident API tests, `test:admin-incidents-frontend`, `test:admin-operations-frontend`, `check:self-hosted-api`, `check:production-scale-baseline`, `smoke:self-hosted-admin-incidents:run`, `smoke:e2e:admin-incident-detail`, `smoke:e2e:admin-incidents`, and `ci:core`.
- Pending handoff steps: commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #103 publication:
1. commit and push branch codex/batch103-incident-detail-handoff;
2. open PR [codex] Batch #103 admin incident detail handoff;
3. merge after checks pass;
4. give Lovable Prompt #103 to sync latest GitHub main.

Then choose Batch #104 as another larger connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
