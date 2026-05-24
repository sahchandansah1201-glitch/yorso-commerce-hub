# Context Health

Updated: 2026-05-24

## Current Status

```yaml
context_risk: "low"
last_checkpoint: "2026-05-24"
last_handoff_ready: true
recommended_action: "continue route-level UX/trust review"
current_project: "yorso-commerce-hub"
active_branch: "main"
head_commit: "f9ab991"
latest_merged_batch: 117
active_workstream: "post_batch117_route_ux_review"
pull_request: "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/168"
why_low: "Batch #117 is merged, Lovable sync is confirmed clean, and project-memory is being updated from explicit user confirmation."
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
Current branch: main.
Current local workstream: post-Batch #117 route-level UX/trust review.
Batch #117 is merged to main as c2c5ff3 after GitHub Core Type And Build Gate passed in 10m54s.
Lovable sync for Batch #117 is confirmed clean with no conflicts.
Next: continue route-level UX/trust review and keep changes narrow.
```
