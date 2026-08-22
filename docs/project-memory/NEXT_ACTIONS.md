# Next Actions

Updated: 2026-08-22

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Immediate

1. Use the initialized `.data/stage-b/copywriter-2026-08` workspace, which is
   bound to candidate commit `dc86aae5331d84836ab428929ba602d0420f35a9`.
2. Assign real canonical executors and use `npm run stage-b:next -- --pilot
   copywriter-2026-08` to issue one arm-isolated, exact-commit packet at a time.
3. Submit each raw executor response only through `npm run
   stage-b:submit-output -- --pilot copywriter-2026-08 --task <task-id>
   --executor <executor-id> --response-file <path>`. The command records the
   packet and response SHA-256 and rejects unknown executors, duplicate outputs
   and tampered packets.
4. Register two real reviewers from distinct independence groups using only
   their Ed25519 public keys; retain private keys outside the repository.
5. Prepare the blind review packet after all outputs exist and collect two
   signed reviewer sheets.
6. Record schema-version-5 evidence only after the score/recall/agreement gates
   pass; do not infer or fabricate missing results.
7. Push only `local-lab/agent-capability-foundation`, verify remote CI and keep
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
