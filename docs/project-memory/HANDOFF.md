# Handoff

Updated: 2026-08-22

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
| Prevent evidence-only promotion | Stage B/main-promotion v5 binds each skill to signed actors, structured outputs, fixture oracle, exact commit and structured gate artifacts; metrics are recomputed and the broad governed source surface must be fresh | Register real trusted actors and produce Stage B results later | 52 governance adversarial tests |
| Protect production PRs | CI validates the PR base branch; a PR targeting `main` must satisfy main policy | Keep `main` unchanged until promotion | governance PR-target test |

## Evidence Already Established

- Governance hardening commit: `8644060a`.
- Initial provider boundary, TypeScript, lint and production build passed on the
  branch baseline.
- Stage A structural/provenance pilot passed.
- Full Stage B evidence is not complete; therefore no `30%`, `200%` or other
  quantified improvement claim is made.
- `.agents/actors.json` has no real registered humans yet; this intentionally
  keeps Stage B and promotion closed. Passed evidence additionally requires the
  out-of-band trusted registry digest `YORSO_TRUSTED_ACTOR_REGISTRY_SHA256`.
- External source metadata is pinned, but exact upstream blob-byte comparison is
  not implemented. Local Yorso adaptations are protected by project content
  hashes instead.

## Next Commands

```bash
npm run check:capability-foundation
npm run test:tooling
npx tsc -b --noEmit
npm run lint
npm run build
git diff --check
```

Then create the final hardening commit, run acceptance and independent review
of the exact committed HEAD, and push only
`local-lab/agent-capability-foundation`.
Stage B and any merge to `main` remain separate closed gates.
