# Context Health

Updated: 2026-05-23

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-05-23"
last_handoff_ready: true
recommended_action: "open a PR for Batch #112 route code splitting after final checks"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch112-route-code-splitting"
head_commit: "01734e1"
latest_merged_batch: 111
active_workstream: "batch112_route_code_splitting"
pull_request: null
why_medium: "Batch #112 is implemented locally on a dirty worktree and validated, but not yet committed, pushed or opened as a PR."
```

## Risk Levels

`low`: short chat, local task, project memory was updated recently and matches git state.

`medium`: long chat, several tasks, dirty worktree, or project memory was stale and has just been corrected.

`high`: compact or stream failure, assistant mixes projects, `PROJECT_STATE.yaml` is stale, or the next step is not written down.

## When To Update Checkpoint

- before a large new task;
- after a completed feature or audit;
- before moving to a new chat;
- if the assistant starts mixing `yorso-commerce-hub` with `yorso_new`;
- after a compact, stream disconnect or similar failure;
- after any meaningful production, frontend, backend, persistence or runtime change.

## Recovery Prompt

```text
Continue the Yorso commerce hub project from repository files, not from old chat memory.

Read first:
1. AGENTS.md
2. docs/project-memory/CONTEXT_HEALTH.md
3. docs/project-memory/PROJECT_STATE.yaml
4. docs/project-memory/HANDOFF.md
5. docs/project-memory/NEXT_ACTIONS.md
6. docs/project-memory/WORKLOG.md

Use /Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub as the project root.
Do not mix this with /Users/istokdmgmail.com/yorso_new unless explicitly asked.
Current local workstream: Batch #112 route code splitting on branch codex/batch112-route-code-splitting.
```
