# Context Health

Updated: 2026-08-23

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-08-23"
last_handoff_ready: true
current_project: "yorso-commerce-hub"
active_workstream: "agent_capability_foundation"
recommended_action: "Continue the remaining 29 isolated executor tasks and externally signed responses, then collect two real independent human reviewers and signed evidence; do not merge main."
why_medium: "The exact-commit Stage B workspace now has 1/30 immutable assignments and 1/30 valid signed outputs, but it still has no human reviewers, no signed reviewer sheets, no trusted final registry digest and no promotion approval."
```

## Confirmed Boundaries

- `main` is the server source of truth.
- Experimental work uses one branch pattern: `local-lab/<scope>`.
- Lovable may connect to the experimental branch, but its report is not
  acceptance evidence by itself.
- Current changes are governance, project skills, verification tooling and
  project-memory only. No product runtime or production deployment changes are
  part of this workstream.
- No quantified improvement claim is allowed until the Stage B pilot protocol
  passes.
- `.agents/actors.json` contains one public-key-only Codex executor and no human
  reviewers or approvers. Real independent reviewers and approvers with
  Ed25519 keys must be registered and the final registry digest must be trusted
  out-of-band before Stage B or promotion can pass.
- Stage B workspaces are ignored under `.data/stage-b/`; reviewers must receive
  only `review-packet/`, never coordinator/task arm mappings.
- Executors must receive only generated `executor-packets/<task-id>/`; they must
  not receive `coordinator.json`, raw `tasks/` arm mappings or the opposite arm.
- Every executor must be registered with role `stage-b-executor`, receive an
  immutable task assignment and sign the canonical submission payload with an
  Ed25519 private key that remains outside the repository and workspace.
- A valid Codex executor run uses an empty temporary `CODEX_HOME` and empty
  working directory. A run that reads user skills, rules, memory or repository
  files is contaminated and must be rejected without submission.

## Recovery Prompt

```text
Continue Yorso from repository files, not chat memory.
Repository: /Users/istokdmgmail.com/Documents/yorso-commerce-hub-main
Branch: local-lab/agent-capability-foundation
Read AGENTS.md, PROJECT_STATE.yaml, HANDOFF.md and NEXT_ACTIONS.md.
Verify git status and agent governance before editing.
Do not merge main. First finish exact-HEAD acceptance and push only this
experimental branch. Stage B remains the next external evidence gate.
```
