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

- Batch #97 is implemented locally on branch `codex/batch97-admin-access-grants-console`.
- Batch #97 adds a self-hosted admin access grants console for active/expired supplier-access grants and revocation.
- Confirmed implementation surfaces:
  - `GET /v1/admin/access-grants`;
  - `POST /v1/admin/access-grants/:grantId/revoke`;
  - `/admin/access-grants` frontend page;
  - `0018_admin_access_grants_console` DB indexes;
  - contracts, memory/PostgreSQL repositories, service/routes, admin UI, browser e2e, runtime smoke, guard scripts, docs and CI wiring.
- Pending handoff steps: commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #97 publication:
1. run final diff/status checks;
2. commit and push branch codex/batch97-admin-access-grants-console;
3. open PR [codex] Batch #97 admin access grants console;
4. merge after checks pass;
5. give Lovable Prompt #97 to sync latest GitHub main.

Then choose Batch #98 as another large connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
