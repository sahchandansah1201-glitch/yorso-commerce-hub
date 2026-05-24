# Context Health

Updated: 2026-05-24

## Current Status

```yaml
context_risk: "low"
last_checkpoint: "2026-05-24"
last_handoff_ready: true
recommended_action: "sync Lovable with Batch #119 using docs/project-memory/PROMPTS/prompt-119-lovable-sync.md"
current_project: "yorso-commerce-hub"
active_branch: "main"
head_commit: "e17810e"
latest_merged_batch: 119
active_workstream: "batch119_lovable_sync"
pull_request: "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/170"
why_low: "Batch #119 is merged to main, GitHub Core Type And Build Gate passed, and the Lovable sync prompt is recorded."
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
Current workstream: Batch #119 Lovable sync.
Batch #119 is merged to main as e17810e via PR #170.
GitHub Core Type And Build Gate passed in 11m44s.
Use docs/project-memory/PROMPTS/prompt-119-lovable-sync.md to sync Lovable, then record the user's sync report.
```
