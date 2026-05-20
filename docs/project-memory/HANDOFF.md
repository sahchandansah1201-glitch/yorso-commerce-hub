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

Keep the Yorso commerce hub recoverable across ChatGPT/Codex context limits and continue future feature work from project files.

## Current Status

- Project-memory black box has been created.
- `AGENTS.md` has been added for project-level agent rules.
- Repository was clean before adding project-memory files.
- Detailed product/feature status should be refreshed before the next implementation task.

## Next Action

```text
Before continuing feature work, inspect git status, read AGENTS.md, and apply the Engineer Agent Action Contract.
Batch #95 must be a large connected production batch unless a concrete blocker is stated before implementation.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
