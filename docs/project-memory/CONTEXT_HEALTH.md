# Context Health

Updated: 2026-08-25

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Current Status

```yaml
context_risk: "medium"
last_checkpoint: "2026-08-25"
last_handoff_ready: true
current_project: "yorso-commerce-hub"
active_workstream: "agent_capability_foundation"
recommended_action: "Continue scoped product development on the persistent local-lab stand, run npm run local-lab:verify after UI changes and push verified checkpoints to the experimental branch; keep main unchanged."
why_medium: "The persistent local stand and owner-directed copywriter qualification are operational and do not block product work. Risk remains medium because the latest branch HEAD still needs fresh remote CI, accepted promotion review and post-merge server proof before any main or production claim."
```

## Confirmed Boundaries

- `main` is the server source of truth.
- Experimental work uses one branch pattern: `local-lab/<scope>`.
- The current experimental branch is served persistently at
  `http://127.0.0.1:3300/`; `npm run local-lab:verify` is the required local
  browser smoke after UI changes.
- Lovable may connect to the experimental branch, but its report is not
  acceptance evidence by itself.
- The repository contains a bounded Lovable Project Knowledge block and five
  lifecycle skills for discovery, UI build, browser acceptance, visual critique
  and sync verification. The connected Lovable workspace exposes the four
  Quality Pack skills required by Project Knowledge. The plugin does not expose
  per-project skill toggles, so no stronger activation claim is allowed.
- The adversarial test-review adaptation is registered and locked as
  `experimental` only. It is not role-active and cannot be treated as qualified
  until blind Stage B evidence passes.
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
- Stage B is skill-governance evidence, not a prerequisite for ordinary
  `local-lab` product development. The copywriter already has 30/30 valid
  signed outputs. Two independent reviewer sheets and the trusted registry
  digest are required only for an independent uplift claim or promotion to
  `main`; the user has no action to take for current product work.
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
Verify git status, npm run local-lab:status and agent governance before editing.
Do not merge main. Run the local-lab cycle before accepting feature work.
Use http://127.0.0.1:3300/ for the latest working-tree UI and run
npm run local-lab:verify after UI changes.
Stage B operational qualification is complete for the experimental branch;
the adversarial QA pilot is deferred and does not block product work. Release
Gates 4-7 still require independent, exact-HEAD and server evidence.
```
