# Context Health

Updated: 2026-05-24

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-05-24"
last_handoff_ready: true
recommended_action: "commit and open Batch #118 PR"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch118-for-suppliers-cta-semantics"
head_commit: "2916424"
latest_merged_batch: 117
active_workstream: "batch118_for_suppliers_cta_semantics"
pull_request: "pending"
why_medium: "Batch #118 has local code, e2e and docs changes that passed validation but are not yet committed, pushed or merged."
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
Current branch: codex/batch118-for-suppliers-cta-semantics.
Current local workstream: Batch #118 for-suppliers CTA semantics on codex/batch118-for-suppliers-cta-semantics.
Batch #117 is merged to main as c2c5ff3 after GitHub Core Type And Build Gate passed in 10m54s.
Lovable sync for Batch #117 is confirmed clean with no conflicts.
Commit Batch #118, push the branch, open a draft PR, wait for GitHub Core Type And Build Gate, then merge if clean.
```
