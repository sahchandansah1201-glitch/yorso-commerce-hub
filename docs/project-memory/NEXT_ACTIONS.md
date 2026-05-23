# Next Actions

## Current Next Action

1. Finish Batch #111 public route SEO:
   - PR: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/162`;
   - merged commit: `17fc484`;
   - status: merged to `main`, GitHub checks passed;
   - next step: run the Batch #111 Lovable sync prompt.

2. Run `docs/project-memory/PROMPTS/prompt-111-lovable-sync.md` in Lovable and record whether Lovable sync is clean or has conflicts.

3. Plan the next production-quality UX batch:
   - performance/code splitting for admin and account routes;
   - font-loading cleanup to remove blocking CSS `@import`;
   - route-level proof, metrics and trust signal review for `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.

## Latest Confirmed Main State

- `main` is at `17fc484`, `[codex] Batch #111 public route SEO`.
- PR #162 is merged for Batch #111: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/162`.
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

## Blockers

- No hard blocker confirmed.
- Known warnings remain:
  - Supabase generated types are out of sync in non-strict build mode;
  - Browserslist data is stale;
  - the main production JS chunk is large and needs code splitting.
