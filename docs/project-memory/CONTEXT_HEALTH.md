# Context Health

Updated: 2026-05-24

## Current Status

```yaml
context_risk: "low"
last_checkpoint: "2026-05-24"
last_handoff_ready: true
recommended_action: "run docs/project-memory/PROMPTS/prompt-114-lovable-sync.md in Lovable"
current_project: "yorso-commerce-hub"
active_branch: "main"
head_commit: "df5b66f"
latest_merged_batch: 114
active_workstream: "post_batch114_lovable_sync"
pull_request: "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/165"
why_low: "Batch #114 is merged to main, GitHub Core Type And Build Gate passed, and only the Lovable sync confirmation remains."
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
Current local workstream: Batch #114 Lovable sync confirmation after merge to main at df5b66f.
Run docs/project-memory/PROMPTS/prompt-114-lovable-sync.md in Lovable, then record the sync result in project-memory.
```
