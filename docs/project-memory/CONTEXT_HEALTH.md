# Context Health

Updated: 2026-05-24

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-05-24"
last_handoff_ready: true
recommended_action: "stage, commit, push and open a PR for Batch #113 route chunk error boundary"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch113-route-chunk-error-boundary"
head_commit: "45891e1"
latest_merged_batch: 112
active_workstream: "batch113_route_chunk_error_boundary"
pull_request: null
why_medium: "Batch #113 is implemented locally on a dirty worktree with full local validation passed and still needs commit, push and PR."
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
Current local workstream: Batch #113 route chunk error boundary on codex/batch113-route-chunk-error-boundary.
```
