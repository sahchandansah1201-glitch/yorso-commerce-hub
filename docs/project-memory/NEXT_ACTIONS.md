# Next Actions

## Current Next Action

1. Run the Batch #110 Lovable sync prompt:
   - file: `docs/project-memory/PROMPTS/prompt-110-lovable-sync.md`;
   - expected source commit: `2e8fb7b` or newer on GitHub `main`;
   - record whether Lovable sync is clean or has conflicts.

2. Plan the next production-quality UX batch:
   - route-level SEO metadata and structured snippets for public buyer pages;
   - performance/code splitting for admin and account routes;
   - font-loading cleanup to remove blocking CSS `@import`;
   - route-level proof, metrics and trust signal review for `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.

## Latest Confirmed Main State

- `main` is at `2e8fb7b`, `[codex] Batch #110 public UX mobile scan`.
- Batch #108, Batch #109 and Batch #110 are merged to `main`.
- Lovable sync for Batch #109 is confirmed clean with no conflicts.
- Project-memory has been corrected from the stale Batch #107 checkpoint.
- Public UX/UI patch is locally validated. Playwright mobile audit at 390px reports zero overflow and zero interactive targets below 44px on `/`, `/how-it-works`, `/suppliers`, `/offers` and `/for-suppliers`.
- PR #161 is merged for Batch #110 public UX mobile scan.
- CI fix for PR #161 updates DB migration tests to include `0025_admin_incident_trend_action_queue`; `npm run test:db-migrations`, local `npm run ci:core` and GitHub `Core Type And Build Gate` pass.

## Blockers

- No hard blocker confirmed.
- Known warnings remain:
  - Supabase generated types are out of sync in non-strict build mode;
  - Browserslist data is stale;
  - the main production JS chunk is large and needs code splitting.
