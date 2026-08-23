# Handoff

Updated: 2026-08-23

Project: `yorso-commerce-hub`

Root: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Active branch: `local-lab/agent-capability-foundation`

Production branch: `main` (server source of truth; do not merge without a
separate accepted promotion gate).

## Current Goal

Validate and publish the project-wide role and skill capability foundation on
the experimental branch. It includes 13
accountable roles, 11 registered skills, immutable skill hashes, source and
license provenance, independent reviewers, routing documentation, a
multilingual UX copywriter and non-mutating verification gates.

## Plan / Fact

| Plan | Fact | Remaining | Verification |
|---|---|---|---|
| Isolate experiments | `local-lab/agent-capability-foundation` created from `origin/main` at `0f71847b` | Push branch after exact-HEAD acceptance | `git merge-base --is-ancestor origin/main HEAD` |
| Define accountable team | 13 role profiles created | Independent exact-HEAD review and later promotion review | `npm run check:agent-governance` |
| Register project-wide skills | 11 skills registered and locked | Stage B comparative pilots | governance tests |
| Add copywriter | EN/RU/ES-ES UX copy gate with independent human review | Pilot with real interface strings | pilot protocol |
| Prevent silent gate mutation | cleanup removed from prehooks; mutation checker covers HEAD, branch, all refs, tracked/untracked files, ignored provider scaffold, symlinks and special files | Keep verification commands observer-only | `check:governance-gates-nonmutating` |
| Protect handoff state | compact structural memory and freshness checker added | Semantic accuracy still requires review | `check:project-memory` |
| Preserve prior evidence | Expanded state and handoff archives are checksum-bound and compared with their recorded source commit | Keep archives immutable | `check:project-memory` |
| Prevent evidence-only promotion | Stage B/main-promotion v5 plus reviewer-sheet v4 bind each skill to signed actors, structured outputs, fixture oracle, exact commit, each output SHA and structured gate artifacts; the tracked candidate surface is fresh while evidence/project-memory use later attestations | Register real trusted actors and produce Stage B results later | governance adversarial and real-Git integration tests |
| Protect production PRs | CI validates the PR base branch; a PR targeting `main` must satisfy main policy | Keep `main` unchanged until promotion | governance PR-target test |
| Validate experimental pushes | GitHub CI now runs for `local-lab/**` pushes | Verify remote workflow result after first push | `.github/workflows/ci.yml` |
| Make Stage B executable | CLI creates 30 randomized tasks, validates identity-bound outputs, builds a blind reviewer packet, enrols public keys only and fails closed until real evidence exists | Collect signed independent review | `npm run test:agent-governance`; `docs/agents/stage-b-operator-runbook.md` |
| Initialize the first real workspace | `copywriter-2026-08` contains 30 tasks bound to exact commit `dc86aae5331d84836ab428929ba602d0420f35a9`; reviewer queue omits arm mappings | Enrol two real reviewers | `npm run stage-b:status -- --pilot copywriter-2026-08` returns blocked exit 2 only for human review/trust gates |
| Make executor runs reproducible | `stage-b:next` immutably assigns an arm-isolated exact-commit packet to a registered executor; `stage-b:prepare-submission` emits a canonical payload; `stage-b:submit-output` verifies an Ed25519 signature and binds assignment, packet, response and payload hashes | Preserve the completed execution evidence | `npm run test:agent-governance`; signature/tamper tests; fail-closed pilot status |
| Complete the Stage B execution campaign | `codex-local-executor-a` produced 30/30 immutable, externally signed and valid outputs; one shared-parent attempt was rejected before signing and rerun with physically separated roots | Obtain two independent human reviews and the out-of-band trusted registry digest | status reports 30/30 assignments, 30/30 outputs and 0 invalid signatures; blind manifest contains 30 items |
| Make human review executable | Blind drafts contain only `reviewItemId` decisions; `stage-b:prepare-review-submission` freezes complete drafts into output-bound reviewer-sheet-v4 payloads; `stage-b:submit-review` verifies the registered human's detached Ed25519 signature and status rejects later drift | Two real humans must independently complete, sign and submit their sheets | focused reviewer workflow tests cover incomplete/leaking drafts, wrong identities/signatures, overwrite and post-submit tampering |

## Evidence Already Established

- Governance hardening commit: `8644060a`.
- Initial provider boundary, TypeScript, lint and production build passed on the
  branch baseline.
- Stage A structural/provenance pilot passed.
- Full Stage B evidence is not complete; therefore no `30%`, `200%` or other
  quantified improvement claim is made.
- The real pilot has `30/30` immutable assignments, `30/30` valid signed
  outputs, `0` invalid signed outputs, `1` registered executor, `0/2`
  reviewers and `0/2` signed sheets. Contaminated attempts were rejected before
  signing; accepted runs used fresh isolated homes and physically separated
  executor/operator roots.
- The blind reviewer packet contains 30 outputs and its manifest exposes no
  candidate skill, baseline/arm, run key, evaluated commit or candidate hash.
- `.agents/actors.json` contains one public-key-only Codex executor and no real
  registered humans. This intentionally keeps Stage B and promotion closed.
  Passed evidence additionally requires two independent human reviewers and
  the out-of-band trusted registry digest
  `YORSO_TRUSTED_ACTOR_REGISTRY_SHA256`.
- External source metadata is pinned, but exact upstream blob-byte comparison is
  not implemented. Local Yorso adaptations are protected by project content
  hashes instead.
- Local promotion-gate fixtures prove validation logic, not that GitHub CI was
  executed. Verifiable remote CI attestation remains required before `main`.

## Next Commands

```bash
npm run check:capability-foundation
npm run test:tooling
npx tsc -b --noEmit
npm run lint
npm run build
git diff --check
```

The Stage B pilot remains initialized from clean exact HEAD `dc86aae5`; the
executor packet/submission workflow was added later on the experimental branch.
Execution is complete. Stage B stays blocked until two registered independent
reviewers, exactly two valid signed sheets and the out-of-band trusted
actor-registry digest exist. Any merge to `main` remains a separate closed gate.
Reviewer tooling is now complete, but no reviewer, score or signature was
generated by the agent: both blind drafts and private-key signatures remain
human/external inputs.
