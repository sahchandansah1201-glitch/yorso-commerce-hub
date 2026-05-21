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

- Batch #100 is implemented locally on branch `codex/batch100-admin-operations-command-center`.
- Batch #100 expands the self-hosted admin operations hub:
  - `GET /v1/admin/operations/overview` now includes audit summary, readiness and operator actions;
  - frontend `/admin` renders audit card, readiness checklist, operator actions and recent audit feed;
  - frontend `/admin/audit` renders bounded admin audit events from the self-hosted API;
  - admin audit API adapter, hook, page tests, API-backed browser smoke, docs and guard-script coverage were added.
- Local validation passed: `test:admin-operations-frontend`, `test:admin-audit-frontend`, `api:build`, `check:self-hosted-api`, `check:production-scale-baseline`, `smoke:self-hosted-admin-operations:run`, `lint`, `tsc -b --noEmit`, `smoke:e2e:admin-operations`, `smoke:e2e:admin-audit-events` and `ci:core`.
- Pending handoff steps: inspect diff/status, commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #100 publication:
1. run git diff --check and inspect git status -sb;
2. commit and push branch codex/batch100-admin-operations-command-center;
3. open PR [codex] Batch #100 admin command center;
4. merge after checks pass;
5. give Lovable Prompt #100 to sync latest GitHub main.

Then choose Batch #101 as another large connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
