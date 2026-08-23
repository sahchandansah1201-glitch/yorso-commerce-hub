# Next Actions

Updated: 2026-08-23

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Immediate

1. Preserve the completed `.data/stage-b/copywriter-2026-08` execution
   workspace: 30/30 immutable assignments, 30/30 valid signed outputs and 0
   invalid signed outputs.
2. Register two real reviewers from distinct independence groups using only
   their Ed25519 public keys; retain private keys outside the repository.
3. Give reviewers only `.data/stage-b/copywriter-2026-08/review-packet/` and an
   external copy of `review-draft.template.json`. Each human completes all 30
   decisions keyed only by `reviewItemId`. Never disclose coordinator, task arm
   mappings, candidate identity or executor/operator artifacts.
4. After each blind draft is final, freeze and sign it with the supported flow:
   `stage-b:prepare-review-submission`, external Ed25519 signing, then
   `stage-b:submit-review`. Drafts, payloads, signatures and private keys stay
   outside both repository and pilot workspace.
5. Collect exactly two valid sheets from distinct groups and re-run
   `npm run stage-b:status -- --pilot copywriter-2026-08`; any signature,
   packet, output or sheet drift must fail closed.
6. Store the accepted actor-registry SHA-256 out of band and provide it through
   `YORSO_TRUSTED_ACTOR_REGISTRY_SHA256` only during qualification.
7. Record schema-version-5 evidence only after score, critical-recall,
   agreement and overhead gates pass; do not infer or fabricate missing
   results.
8. Push only `local-lab/agent-capability-foundation`, verify remote CI and keep
   `main` unchanged until Stage B and separate promotion approval pass.

## Required Before Main Promotion

1. Execute the Stage B protocol in `docs/agents/skill-pilot-protocol.md`:
   five fixtures, two arms, three repeats, blind independent review.
2. Register real reviewers and promotion approvers in `.agents/actors.json`;
   reviewers and approvers must have the required role, Ed25519 key and
   distinct canonical independence groups. Store the accepted actor-registry
   SHA-256 outside the repository and provide it through
   `YORSO_TRUSTED_ACTOR_REGISTRY_SHA256` during qualification.
3. Record raw outcomes and reviewer disagreements against the immutable fixture
   oracle; each structured output must identify the defects it found and every
   reviewer sheet and promotion approval must have a valid actor signature.
4. Require critical finding recall of 100%, score at least 85, inter-reviewer
   agreement at least 0.75 and bounded overhead.
5. Run a real product-code pilot for every experimental skill promoted to
   active.
6. Obtain a separate user-approved merge decision.
7. Replace synthetic promotion gate fixtures with verifiable exact-commit CI
   attestation and real independent-review artifacts.

## Explicit Non-Goals

- Do not create `lovable/test/*` or `codex/*` branch layers.
- Do not merge or push directly to `main` in this workstream.
- Do not claim a measured improvement before Stage B evidence exists.
- Do not let checks delete or rewrite files as a hidden side effect.
- Do not accept generic log files as promotion evidence; gate artifacts must
  bind the exact commit, command, zero exit status and stdout digest.
