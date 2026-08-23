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
recommended_action: "Use the owner-qualified copywriter skill in local-lab product work with feature-specific verification; keep independent quality measurement and main promotion as separate gates."
why_medium: "Stage B operational qualification is complete from 30/30 valid signed outputs and a checksum-bound owner directive, but independent quality uplift and production promotion are intentionally not established."
```

## Confirmed Boundaries

- `main` is the server source of truth.
- Experimental work uses one branch pattern: `local-lab/<scope>`.
- Lovable may connect to the experimental branch, but its report is not
  acceptance evidence by itself.
- Current changes are governance, project skills, verification tooling and
  project-memory only. No product runtime or production deployment changes are
  part of this workstream.
- Owner-directive Stage B qualification authorizes operational use only on the
  experimental branch. It does not establish a quantified improvement.
- `.agents/actors.json` contains one public-key-only Codex executor and no human
  reviewers or approvers. Real independent reviewers and approvers with
  Ed25519 keys must be registered and the final registry digest must be trusted
  out-of-band before independent-review evidence or promotion can pass.
- Stage B workspaces are ignored under `.data/stage-b/`; reviewers must receive
  only `review-packet/`, never coordinator/task arm mappings.
- Each reviewer fills an external copy of `review-draft.template.json` keyed
  only by `reviewItemId`. Candidate/run mappings are added by tooling only after
  the human decisions are frozen; payloads, signatures and private keys remain
  outside the repository and pilot workspace.
- Executors must receive only generated `executor-packets/<task-id>/`; they must
  not receive `coordinator.json`, raw `tasks/` arm mappings or the opposite arm.
- Every executor must be registered with role `stage-b-executor`, receive an
  immutable task assignment and sign the canonical submission payload with an
  Ed25519 private key that remains outside the repository and workspace.
- A valid Codex executor run uses an empty temporary `CODEX_HOME` and empty
  working directory. A run that reads user skills, rules, memory or repository
  files is contaminated and must be rejected without submission.
- Executor work, temporary `CODEX_HOME` and operator logs/signing artifacts use
  separate physical roots. One shared-parent attempt was rejected before
  signing after its event trace showed access to operator files.

## Recovery Prompt

```text
Continue Yorso from repository files, not chat memory.
Repository: /Users/istokdmgmail.com/Documents/yorso-commerce-hub-main
Branch: local-lab/agent-capability-foundation
Read AGENTS.md, PROJECT_STATE.yaml, HANDOFF.md and NEXT_ACTIONS.md.
Verify git status and agent governance before editing.
Do not merge main. Stage B operational qualification is complete for the
experimental branch. Continue feature work with exact-HEAD acceptance and keep
independent quality measurement plus production promotion as separate gates.
```
