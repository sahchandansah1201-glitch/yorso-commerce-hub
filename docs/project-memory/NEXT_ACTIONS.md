# Next Actions

## Current Next Action

1. Finish Batch #112 route code splitting:
   - branch: `codex/batch112-route-code-splitting`;
   - status: implemented locally and validated;
   - next step: stage, commit, push and open a PR.

2. After Batch #112 PR checks pass, merge and create the Batch #112 Lovable sync prompt.

3. Plan the next production-quality UX batch:
   - font-loading cleanup to remove blocking CSS `@import`;
   - route-level proof, metrics and trust signal review for `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.

## Latest Confirmed Main State

- `main` is at `17fc484`, `[codex] Batch #111 public route SEO`.
- PR #162 is merged for Batch #111: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/162`.
- User confirmed Lovable sync for Batch #111 is clean at `01734e1d`, with no conflicts.
- `main` includes Batch #110 commit `2e8fb7b`, `[codex] Batch #110 public UX mobile scan`, plus the Batch #110 Lovable sync prompt commit.
- Batch #108, Batch #109 and Batch #110 are merged to `main`.
- Lovable sync for Batch #109 and Batch #110 is confirmed clean with no conflicts.
- Project-memory has been corrected from the stale Batch #107 checkpoint.
- Public UX/UI patch is locally validated. Playwright mobile audit at 390px reports zero overflow and zero interactive targets below 44px on `/`, `/how-it-works`, `/suppliers`, `/offers` and `/for-suppliers`.
- PR #161 is merged for Batch #110 public UX mobile scan.
- CI fix for PR #161 updates DB migration tests to include `0025_admin_incident_trend_action_queue`; `npm run test:db-migrations`, local `npm run ci:core` and GitHub `Core Type And Build Gate` pass.
- Batch #111 local validation passed:
  - route-owned SEO marker, canonical, OG/Twitter and JSON-LD on `/`, `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`;
  - `npx vitest run src/pages/PublicRouteSeo.test.tsx` passed, 9 tests;
  - `npm run lint`, `npx tsc -b --noEmit` and `npm run build` passed with known warnings.
- GitHub `Core Type And Build Gate` passed on PR #162, including browser smoke, API-backed access suite, self-hosted auth/access and admin smoke steps.
- Batch #112 local validation passed:
  - `npx vitest run src/test/app-route-code-splitting.test.ts` passed, 2 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run build` passed with the previous large-chunk warning removed;
  - production preview Playwright smoke passed for `e2e/smoke-core.spec.ts` and `e2e/suppliers-no-horizontal-overflow-375.spec.ts`, 9 tests.

## Blockers

- No hard blocker confirmed.
- Known warnings remain:
  - Supabase generated types are out of sync in non-strict build mode;
  - Browserslist data is stale.
- Residual Batch #112 risk:
  - lazy route chunk failures still use default browser/React behavior; a custom route chunk error boundary is not included in this batch.
