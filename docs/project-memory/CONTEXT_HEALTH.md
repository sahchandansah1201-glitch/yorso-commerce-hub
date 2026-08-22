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
recommended_action: "Run exact-HEAD acceptance and independent review, then push only the local-lab branch; do not merge main."
why_medium: "Governance now binds signed reviewers to exact output hashes, separates candidate freshness from evidence attestations, covers the tracked candidate repository surface and fingerprints ignored regular files, but no real trusted actors are registered and Stage B, exact upstream blob verification, remote CI attestation and promotion approval remain open."
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
