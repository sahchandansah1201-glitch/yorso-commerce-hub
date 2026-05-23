# Next Actions

## Current Next Action

1. Finish Batch #111 public route SEO:
   - branch: `codex/batch111-public-route-seo`;
   - status: implemented locally and validation passed;
   - next steps: final git review, commit, push and open PR.

2. After Batch #111 merge, prepare the Lovable sync prompt and record whether Lovable sync is clean or has conflicts.

3. Plan the next production-quality UX batch:
   - performance/code splitting for admin and account routes;
   - font-loading cleanup to remove blocking CSS `@import`;
   - route-level proof, metrics and trust signal review for `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.

## Latest Confirmed Main State

- local branch is `codex/batch111-public-route-seo` at base `ff98940`, `[codex] Add Batch 110 Lovable sync prompt`.
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

## Blockers

- No hard blocker confirmed.
- Known warnings remain:
  - Supabase generated types are out of sync in non-strict build mode;
  - Browserslist data is stale;
  - the main production JS chunk is large and needs code splitting.
