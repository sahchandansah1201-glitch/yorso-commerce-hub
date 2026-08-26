# Next Actions

Updated: 2026-08-26

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Current Product Priority

0. Keep the local integration stand healthy before each product batch:
   `npm run local-lab:status` must report HTTP 200 for YORSO UI and YORSO API.
   Twenty must also report HTTP 200 when CRM is in scope; otherwise the stand
   must report explicit degradation while the core UI/API remain available.
   Use `npm run local-lab:restart` to reconcile the LaunchAgent and
   repository-owned Compose stack without deleting volumes. Keep local
   credentials only in ignored `local-lab-auth.local`; never commit or log
   their values.
1. Use the persistent `http://127.0.0.1:3300/` local-lab stand for the latest
   working-tree UI. After every user-visible change, run
   `npm run local-lab:verify` before reporting the result.
2. Continue scoped product work on `local-lab/agent-capability-foundation` and
   push only verified checkpoints. Keep `main` unchanged.
3. Keep `yorso-adversarial-test-review-pilot` registered but deferred. It is
   not a product-development gate. Run its Stage B only when explicitly
   activating that skill, measuring uplift or preparing promotion evidence.
4. No user action is required for the existing copywriter Stage B: its
   owner-directed operational qualification already has 30/30 valid signed
   outputs. Two reviewer sheets and a trusted registry digest apply only to
   independent uplift and `main` promotion claims.

## Immediate

0. Treat `/crm` as a protected handoff to a separate self-hosted application,
   not as proof of SSO. Keep the explicit Twenty-login message until a real
   identity contract is designed and tested. Keep production CRM promotion
   closed until `docs/backend/crm-integration.md` gates are satisfied: HTTPS,
   tenant isolation, role mapping, secret management, telemetry and
   10,000-user load evidence with graceful degradation. The local defect where
   stale YORSO sessions appeared as a CRM outage is closed; preserve its
   re-authentication and `/crm` redirect regression coverage.
1. Preserve the completed P1S.1 Lovable verification for implementation SHA
   `4f5b393ad7c62531a7c93f5b787526eb9654675b`: Lovable confirmed the same
   `local-lab/agent-capability-foundation` revision, a clean tree, zero product
   edits and the provider-free boundary.
2. Preserve the confirmed Lovable Project Knowledge and four workspace Quality
   Pack skills. The current plugin cannot enumerate per-project skill toggles,
   so treat workspace presence plus explicit Project Knowledge routing as the
   supported evidence boundary.
3. Run fresh GitHub CI on the next exact branch HEAD. Treat GitHub Actions run
   `32651568454` on exact SHA
   `4121018533ac444218ac269bdce95ead60542d98` as the green remote candidate
   signal for its historical SHA only; preserve failed run `32650214185` as
   evidence that the cycle caught the supplier pagination race before
   acceptance.
4. Use `npm run check:local-lab-cycle:working-tree` during implementation and
   `npm run check:local-lab-cycle` on the clean candidate commit. Gate 3 now
   requires the recorded real-Chrome flow. Do not call the branch release-ready
   while Gates 4-7 remain pending.
5. Preserve the registered experimental
   `yorso-adversarial-test-review-pilot`, adapted from
   `petrkindlmann/qa-skills` at exact upstream commit
   `b3bb61bd268b147476252c6ed5a0440c87b97441`. Do not add it to the QA role or
   claim uplift until a separately requested Stage B evaluates defect recall,
   false positives, runtime cost and overlap with current Yorso QA skills.
6. Keep `affaan-m/ECC` as the next logistics research candidate only; audit the
   exact customs/logistics content before any local adaptation.
7. Preserve the completed `.data/stage-b/copywriter-2026-08` execution
   workspace: 30/30 immutable assignments, 30/30 valid signed outputs, 0
   invalid outputs and 6 recorded blocked responses.
8. Use `yorso-multilingual-ux-copywriter-agent` as an active project-wide skill
   for experimental `local-lab/*` work and run feature-specific tests for every
   product-code change it influences.
9. Keep the owner directive and generated evidence checksum-bound; governance
   must fail if either artifact, the candidate hash, fixture oracle, evaluated
   commit or signed run set drifts.
10. Continue only on `local-lab/agent-capability-foundation` and keep `main`
   unchanged until the separate production promotion gate passes. Any new
   commit invalidates the exact-SHA remote evidence and requires a fresh CI run.
11. The exact-SHA Lovable sync requirement for P1S.1 is closed. Continue the
    next scoped product stage only after its task frame and acceptance checks
    are recorded. Independent review may still be added later to measure
    quality uplift, but it is not a blocker for experimental operational use.

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
