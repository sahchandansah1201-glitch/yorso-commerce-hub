# Context Health

Updated: 2026-05-23

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-05-23"
last_handoff_ready: true
recommended_action: "push the PR #161 CI migration-test fix, recheck GitHub checks, then merge after green"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch110-public-ux-mobile-scan"
head_commit: "e1653cb before local CI migration-test fix"
latest_merged_batch: 109
active_workstream: "batch110_public_ux_trust_mobile_scan"
pull_request: "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/161"
why_medium: "Project memory was stale on Batch #107 while main already includes Batch #109; PR #161 also needed a CI migration-test fixture fix after Batch #109 added migration 0025."
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
```
