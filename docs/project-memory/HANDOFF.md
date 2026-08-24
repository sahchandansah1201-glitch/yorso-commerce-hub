# Handoff

Updated: 2026-08-25

Project: `yorso-commerce-hub`

Root: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Active branch: `local-lab/agent-capability-foundation`

Production branch: `main` (server source of truth; do not merge without a
separate accepted promotion gate).

## Current Goal

Validate and publish the project-wide role and skill capability foundation on
the experimental branch. It includes 13
accountable roles, 17 registered skills, immutable skill hashes, source and
license provenance, independent reviewers, routing documentation, a
multilingual UX copywriter, a persistent Lovable quality lifecycle and
non-mutating verification gates.

## Plan / Fact

| Plan | Fact | Remaining | Verification |
|---|---|---|---|
| Isolate experiments | `local-lab/agent-capability-foundation` created from `origin/main` at `0f71847b` and published independently of `main` | Keep all new work on this branch until promotion | `git merge-base --is-ancestor origin/main HEAD` |
| Define accountable team | 13 role profiles created | Independent exact-HEAD review and later promotion review | `npm run check:agent-governance` |
| Register project-wide skills | 17 skills registered and locked; the new adversarial test reviewer remains experimental and role-inactive | Blind Stage B qualification and feature-specific adoption tests | governance tests |
| Make Lovable quality reproducible | Project Knowledge is present in the connected Lovable project; the four Quality Pack workspace skills are present; Lovable verified P1S.1 exact implementation SHA `4f5b393ad7c62531a7c93f5b787526eb9654675b` with a clean tree and zero edits | Run fresh exact-HEAD CI after the next checkpoint commit | plugin evidence plus `npm run check:lovable-quality` |
| Add copywriter | EN/RU/ES-ES UX copy gate is active on `local-lab/*` after owner-directed Stage B qualification | Independent review only if measured uplift or main promotion is pursued | owner directive plus pilot evidence |
| Prevent silent gate mutation | cleanup removed from prehooks; mutation checker covers HEAD, branch, all refs, tracked/untracked files, ignored provider scaffold, symlinks and special files | Keep verification commands observer-only | `check:governance-gates-nonmutating` |
| Protect handoff state | compact structural memory and freshness checker added | Semantic accuracy still requires review | `check:project-memory` |
| Preserve prior evidence | Expanded state and handoff archives are checksum-bound and compared with their recorded source commit | Keep archives immutable | `check:project-memory` |
| Prevent evidence-only promotion | Stage B/main-promotion v5 plus reviewer-sheet v4 bind each skill to signed actors, structured outputs, fixture oracle, exact commit, each output SHA and structured gate artifacts; the tracked candidate surface is fresh while evidence/project-memory use later attestations | Register real trusted actors and produce Stage B results later | governance adversarial and real-Git integration tests |
| Protect production PRs | CI validates the PR base branch; a PR targeting `main` must satisfy main policy | Keep `main` unchanged until promotion | governance PR-target test |
| Validate experimental pushes | GitHub CI runs for `local-lab/**`; run `32651568454` passed on exact SHA `4121018533ac444218ac269bdce95ead60542d98` | Re-run after every new commit | GitHub Actions exact-SHA evidence |
| Make Stage B executable | CLI supports both strict independent review and owner-directed operational qualification with different claim boundaries | Preserve fail-closed mode-specific evidence | `npm run test:agent-governance`; `docs/agents/stage-b-operator-runbook.md` |
| Initialize the first real workspace | `copywriter-2026-08` contains 30 tasks bound to exact commit `dc86aae5331d84836ab428929ba602d0420f35a9`; reviewer queue omits arm mappings | Preserve ignored runtime evidence | owner qualification evidence |
| Make executor runs reproducible | `stage-b:next` immutably assigns an arm-isolated exact-commit packet to a registered executor; `stage-b:prepare-submission` emits a canonical payload; `stage-b:submit-output` verifies an Ed25519 signature and binds assignment, packet, response and payload hashes | Preserve the completed execution evidence | `npm run test:agent-governance`; signature/tamper tests; fail-closed pilot status |
| Complete the Stage B execution campaign | `codex-local-executor-a` produced 30/30 immutable, externally signed and valid outputs; 6 blocked responses are recorded; one contaminated attempt was rejected before signing | None for owner-directed operational use | owner evidence binds all 30 assignments and outputs |
| Make human review executable | Blind drafts contain only `reviewItemId` decisions; `stage-b:prepare-review-submission` freezes complete drafts into output-bound reviewer-sheet-v4 payloads; `stage-b:submit-review` verifies the registered human's detached Ed25519 signature and status rejects later drift | Two real humans must independently complete, sign and submit their sheets | focused reviewer workflow tests cover incomplete/leaking drafts, wrong identities/signatures, overwrite and post-submit tampering |
| Qualify operational Stage B | Project-owner directive activated the copywriter for experimental work; governance records `owner-directive` mode and exact negative claim boundary | Use it in feature work; independent review is optional until uplift/main is pursued | 30/30 signed outputs, 0 invalid, 6 blocked; checksum-bound directive/evidence |
| Repeat role/skill discovery | All 13 roles searched through Exa and Codex skills; GitHub license and full-SHA evidence recorded | Pilot only the selected QA and logistics candidates | `docs/agents/research/role-skill-deep-search-2026-08-23.md` |
| Register the selected QA pilot | `yorso-adversarial-test-review-pilot` is a narrow MIT-licensed adaptation pinned to `petrkindlmann/qa-skills@b3bb61bd268b147476252c6ed5a0440c87b97441`; Stage A and governance pass, but no role activation occurred | Execute blind Stage B and review evidence before activation or uplift claims | official skill validator plus 71/71 governance tests |
| Make the development cycle executable | Safe allowlisted runner evaluates repository, branch, base, scope, automated checks, human QA and release evidence | Supply real Gates 4-7 evidence only when promotion is requested | `npm run test:local-lab-cycle`; `npm run check:local-lab-cycle` |
| Test the cycle against real CI | Run `32650214185` exposed a supplier pagination debounce race; the fixed exact SHA passed run `32651568454` end to end | Preserve the failed and passing runs as before/after evidence | GitHub Actions plus focused Chrome 5/5 |
| Keep the latest test UI reachable | A macOS LaunchAgent serves the active working tree at `http://127.0.0.1:3300/`, restarts Vite after failure and exposes a three-flow Playwright acceptance command | Keep the Mac user session active; run the browser verification after UI changes | `npm run local-lab:status`; `npm run local-lab:verify` |
| Keep Stage B in its proper role | Copywriter owner-directed qualification is complete with 30/30 valid signed outputs; the adversarial QA pilot remains deferred | Two reviewer sheets and the trusted digest are needed only for independent uplift or `main` promotion, not current product work | owner evidence plus `docs/agents/skill-pilot-protocol.md` |

## Evidence Already Established

- Governance hardening commit: `8644060a`.
- Initial provider boundary, TypeScript, lint and production build passed on the
  branch baseline.
- Stage A structural/provenance pilot passed.
- Stage B operational qualification is complete in `owner-directive` mode.
  No `30%`, `200%` or other quantified improvement claim is made.
- The real pilot has `30/30` immutable assignments, `30/30` valid signed
  outputs, `0` invalid signed outputs, `1` registered executor, `0/2`
  reviewers and `0/2` signed sheets. Contaminated attempts were rejected before
  signing; accepted runs used fresh isolated homes and physically separated
  executor/operator roots.
- The blind reviewer packet contains 30 outputs and its manifest exposes no
  candidate skill, baseline/arm, run key, evaluated commit or candidate hash.
- `.agents/actors.json` contains one public-key-only Codex executor and no real
  registered humans. Owner-directed operational Stage B does not require those
  reviewers. Independent quality measurement and promotion still require two
  reviewers and the out-of-band trusted registry digest.
- External source metadata is pinned, but exact upstream blob-byte comparison is
  not implemented. Local Yorso adaptations are protected by project content
  hashes instead.
- Remote CI has been executed successfully for exact SHA
  `4121018533ac444218ac269bdce95ead60542d98` in run `32651568454`. This is a
  candidate signal, not permission to merge `main`; Gates 4-7 remain separate.
- The local-lab runner has seven passing positive/adversarial tests. A real dirty
  working-tree run produced `VALIDATED_LOCAL` for Gates 0-3. Gate 3 is now a
  mandatory human-like browser gate because this workstream includes a supplier
  UI fix. Release mode is
  expected to return `NO-GO` until independent review, Lovable same-HEAD, PR and
  server proof are supplied.
- Remote run `32650214185` failed one of 287 browser cases after all core gates
  passed. The cycle therefore prevented a false completion claim. Root cause was
  a delayed initial search debounce resetting supplier pagination; the focused
  unit regression and real system-Chrome suite now pass locally.
- Remote run `32651568454` then passed the complete job on the fixed exact SHA,
  including core CI, account report checks, browser smoke, API-backed access,
  provider-free and self-hosted auth checks, and all admin runtime browser
  suites.
- No external candidate found in the repeated search was installed wholesale.
  A narrow local adaptation of `petrkindlmann/qa-skills` is now registered as
  `experimental` and locked to the exact upstream SHA. It is not assigned to an
  active role; this is Stage A registration, not adoption or a quality-uplift
  claim.
- Lovable verified P1S.1 on exact implementation SHA
  `4f5b393ad7c62531a7c93f5b787526eb9654675b`. The verification changed zero
  files, retained a clean working tree and confirmed the provider-free
  boundary. Per-project skill toggle enumeration remains unavailable; the
  supported evidence is workspace skill presence plus Project Knowledge
  routing.

## Next Commands

```bash
npm run check:capability-foundation
npm run local-lab:status
npm run local-lab:verify
npm run check:local-lab-cycle:working-tree
node scripts/stage-b-pilot.mjs --help
npm run test:tooling
npx tsc -b --noEmit
npm run lint
npm run build
git diff --check
```

The Stage B pilot remains initialized from clean exact HEAD `dc86aae5`; the
executor packet/submission workflow was added later on the experimental branch.
Execution and owner-directed operational qualification are complete. The skill
is active for experimental project work. Independent reviewer scores were not
generated, so measured uplift is not claimed. Any merge to `main` remains a
separate closed gate requiring independent evidence and promotion approval.

The persistent local product stand is independent of that promotion gate. It
serves the latest experimental working tree at `http://127.0.0.1:3300/` and is
the default place for immediate human and Playwright verification.
