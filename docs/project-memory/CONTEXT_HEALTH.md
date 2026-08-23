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
recommended_action: "Run the next product scope through the executable local-lab cycle, pilot the QA/release candidate narrowly, and keep release Gates 4-7 closed until exact evidence exists."
why_medium: "All 13 roles were researched and local cycle Gates 0-3 are executable and tested, but independent review, Lovable exact-HEAD verification, PR approval and server proof are still absent."
```

## Confirmed Boundaries

- `main` is the server source of truth.
- Experimental work uses one branch pattern: `local-lab/<scope>`.
- Lovable may connect to the experimental branch, but its report is not
  acceptance evidence by itself.
- Current changes are governance, project skills, verification tooling and
  project-memory only. No product runtime or production deployment changes are
  part of this workstream.
- Deep search was repeated for all 13 accountable roles through Exa and the
  Codex skills index. Candidates are references or pilots until their exact
  content passes Yorso-specific evaluation; popularity is not an install gate.
- `check:local-lab-cycle:working-tree` is the implementation-time check;
  `check:local-lab-cycle` requires a clean candidate; release mode fails closed
  while Gates 4-7 lack evidence.
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
Do not merge main. Run the local-lab cycle before accepting feature work.
Stage B operational qualification is complete for the experimental branch;
release Gates 4-7 still require independent, exact-HEAD and server evidence.
```
