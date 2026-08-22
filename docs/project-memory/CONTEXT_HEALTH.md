# Context Health

Updated: 2026-08-22

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-08-22"
last_handoff_ready: true
current_project: "yorso-commerce-hub"
active_workstream: "agent_capability_foundation"
recommended_action: "Execute the initialized copywriter Stage B tasks, then collect two real independent reviewers and signed evidence; do not merge main."
why_medium: "The exact-commit Stage B workspace exists and is fail-closed, but it has 0/30 outputs, no real trusted actors, no signed reviewer sheets, no remote CI attestation and no promotion approval."
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
