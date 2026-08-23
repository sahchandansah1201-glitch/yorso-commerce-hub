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
recommended_action: "Register real executors, assign all 30 tasks and collect Ed25519-signed copywriter responses through the packet/submission CLI, then collect two real independent reviewers and signed evidence; do not merge main."
why_medium: "The exact-commit Stage B workspace and signed executor transport exist and fail closed, but the real pilot has 0/30 assignments, 0/30 outputs, no real trusted actors, no signed reviewer sheets and no promotion approval."
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
- `.agents/actors.json` is intentionally empty; real independent reviewers and
  approvers with Ed25519 keys must be registered and the registry digest must
  be trusted out-of-band before Stage B or promotion can pass.
- Stage B workspaces are ignored under `.data/stage-b/`; reviewers must receive
  only `review-packet/`, never coordinator/task arm mappings.
- Executors must receive only generated `executor-packets/<task-id>/`; they must
  not receive `coordinator.json`, raw `tasks/` arm mappings or the opposite arm.
- Every executor must be registered with role `stage-b-executor`, receive an
  immutable task assignment and sign the canonical submission payload with an
  Ed25519 private key that remains outside the repository and workspace.

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
