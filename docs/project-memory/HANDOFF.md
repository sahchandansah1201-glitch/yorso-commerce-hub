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

- Batch #98 is implemented locally on branch `codex/batch98-engineering-lessons-guards`.
- Batch #98 converts concrete Batch #96/#97 mistakes into durable engineering rules:
  - AGENTS Failure Learning Contract;
  - project-memory engineering lessons;
  - API-backed e2e script policy;
  - stable memory-repository smoke assertion policy;
  - release checks and Vitest guard suite.
- Local validation passed: `check:engineering-lessons`, `test:engineering-lessons`, `check:self-hosted-api`, `check:production-scale-baseline` and `ci:core`.
- Pending handoff steps: commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #98 publication:
1. run final diff/status checks;
2. run npm run check:engineering-lessons and npm run test:engineering-lessons;
3. run npm run check:self-hosted-api, npm run check:production-scale-baseline and npm run ci:core;
4. commit and push branch codex/batch98-engineering-lessons-guards;
5. open PR [codex] Batch #98 engineering lessons guards;
6. merge after checks pass;
7. give Lovable Prompt #98 to sync latest GitHub main.

Then choose Batch #99 as another large connected production batch.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
