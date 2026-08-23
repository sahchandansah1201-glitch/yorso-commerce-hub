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
recommended_action: "Continue the next scoped product change through the validated local-lab cycle or run the narrow QA-skill Stage B pilot; keep main unchanged until Gates 4-7 close."
why_medium: "Exact SHA 4121018533ac444218ac269bdce95ead60542d98 passed GitHub Actions run 32651568454 after the cycle caught and fixed a real browser regression, but independent review, Lovable same-branch verification, PR acceptance and server proof remain absent."
```

## Confirmed Boundaries

- `main` is the server source of truth.
- Experimental work uses one branch pattern: `local-lab/<scope>`.
- Lovable may connect to the experimental branch, but its report is not
  acceptance evidence by itself.
- Current changes include governance, project skills, verification tooling and
  one supplier-directory pagination race fix found by remote CI. No production
  deployment is part of this workstream.
- GitHub Actions run `32651568454` passed on exact SHA
  `4121018533ac444218ac269bdce95ead60542d98`, including core CI, browser smoke,
  API-backed access, provider-free, self-hosted auth and admin runtime suites.
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
