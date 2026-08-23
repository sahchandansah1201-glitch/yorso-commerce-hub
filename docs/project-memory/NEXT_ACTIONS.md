# Next Actions

Updated: 2026-08-23

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Immediate

1. Preserve the completed `.data/stage-b/copywriter-2026-08` execution
   workspace: 30/30 immutable assignments, 30/30 valid signed outputs, 0
   invalid outputs and 6 recorded blocked responses.
2. Use `yorso-multilingual-ux-copywriter-agent` as an active project-wide skill
   for experimental `local-lab/*` work and run feature-specific tests for every
   product-code change it influences.
3. Keep the owner directive and generated evidence checksum-bound; governance
   must fail if either artifact, the candidate hash, fixture oracle, evaluated
   commit or signed run set drifts.
4. Push only `local-lab/agent-capability-foundation`, verify remote CI and keep
   `main` unchanged until the separate production promotion gate passes.
5. Continue the next product implementation stage instead of waiting for
   external reviewers. Independent review may be added later to measure quality
   uplift, but it is not a blocker for experimental operational use.

## Required Before Main Promotion

1. Execute the independent-review path in
   `docs/agents/skill-pilot-protocol.md`: five fixtures, two arms, three repeats
   and blind independent review. Existing valid signed executor outputs may be
   reused when their bindings remain valid.
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
- Do not claim measured improvement from owner-directive evidence; that claim
  requires independent-review evidence.
- Do not let checks delete or rewrite files as a hidden side effect.
- Do not accept generic log files as promotion evidence; gate artifacts must
  bind the exact commit, command, zero exit status and stdout digest.
