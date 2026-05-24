# Context Health

Updated: 2026-05-24

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-05-24"
last_handoff_ready: true
recommended_action: "open a PR for Batch #115 catalog locale hardening"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch115-catalog-locale-hardening"
head_commit: "c181b429"
latest_merged_batch: 114
active_workstream: "batch115_catalog_locale_hardening"
pull_request: null
why_medium: "Batch #115 has local code and project-memory changes on a feature branch; PR and GitHub checks are still pending."
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
Current local workstream: Batch #115 catalog locale hardening on codex/batch115-catalog-locale-hardening.
Batch #114 Lovable sync was confirmed clean at 3be3d6d2.
Batch #115 local validation passed; open a PR, wait for GitHub checks, merge, then create the Lovable sync prompt.
```
