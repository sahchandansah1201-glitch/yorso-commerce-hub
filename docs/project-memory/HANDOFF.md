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

- Batch #101 is implemented locally on branch `codex/batch101-admin-incident-response`.
- Batch #101 adds the self-hosted admin incident response workflow:
  - backend derives incidents from runtime diagnostics and bounded admin audit data;
  - `GET /v1/admin/incidents`, `GET /v1/admin/incidents/:incidentId` and `POST /v1/admin/incidents/:incidentId/acknowledge` are admin-only;
  - PostgreSQL stores durable acknowledgement/resolution state in `yorso_admin_incident_acknowledgements`;
  - frontend `/admin/incidents` renders incident filters, summary, list, notes and acknowledge/resolve actions;
  - `/admin` command center now includes incident summary, readiness and operator action links.
- Partial local validation passed: `contracts:build`, `api:build`, `test:admin-incidents-frontend`, `test:admin-operations-frontend`, targeted admin incident API tests, `smoke:self-hosted-admin-incidents:run` and `smoke:self-hosted-admin-operations:run`.
- Pending handoff steps: finish guard/docs checks, lint, tsc, e2e, ci:core, inspect diff/status, commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #101 publication:
1. run git diff --check and inspect git status -sb;
2. commit and push branch codex/batch101-admin-incident-response;
3. open PR [codex] Batch #101 admin incident response;
4. merge after checks pass;
5. give Lovable Prompt #101 to sync latest GitHub main.

Then choose Batch #102 as another larger connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
