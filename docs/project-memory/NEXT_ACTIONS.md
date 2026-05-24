# Next Actions

## Current Next Action

1. Continue the route-level proof, metrics and trust signal review for `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.

2. If the review finds a concrete buyer-facing issue, implement the narrowest connected UX/UI batch with:
   - runtime evidence from the route;
   - focused tests or e2e coverage;
   - `docs/backend/production-scale-baseline.md` notes for 10,000 concurrent users;
   - project-memory updates and a Lovable sync prompt.

## Latest Confirmed Main State

- `main` is at `3bca796`, `[codex] Add Batch 116 Lovable sync prompt`.
- Lovable sync for Batch #116 is confirmed clean at `3bca7961`, with no conflicts.
- PR #167 is merged for Batch #116: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/167`.
- Batch #116 fixes a `/offers` trust-proof navigation defect: on mobile, `Procurement intelligence` no longer targets the hidden desktop-only intelligence column and falls back to visible offer evidence; `Document readiness` now lands on offer cards instead of the filter bar.
- Batch #116 added `src/components/catalog/TrustProofStrip.test.tsx` and `e2e/offers-trust-proof-anchors.spec.ts`.
- `smoke:e2e:offers-catalog:run` now includes both `e2e/offers-catalog-paging.spec.ts` and `e2e/offers-trust-proof-anchors.spec.ts`.
- Lovable confirmed `TrustProofStrip` visible-anchor resolution, resolved-anchor telemetry, mobile proof evidence landing, Batch #116 tests, e2e guard, production-scale notes and public route declarations are present.
- Buyer-first narrative, supplier trust mechanism, access gating, supplier identity redaction, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting, Batch #113 route chunk boundary, Batch #114 font loading and Batch #115 locale hardening are preserved.
- GitHub `Core Type And Build Gate` passed on PR #167, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #116 local validation passed:
  - `npx vitest run src/components/catalog/TrustProofStrip.test.tsx`, 3 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4187 npx playwright test e2e/offers-trust-proof-anchors.spec.ts --project=chromium`, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4187 npx playwright test e2e/offers-catalog-paging.spec.ts e2e/offers-trust-proof-anchors.spec.ts --project=chromium`, 6 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build`.
- Known warnings remain during build: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Lovable sync for Batch #115 is confirmed clean at `040e17b9`, with no conflicts.
- PR #166 is merged for Batch #115: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/166`.
- Batch #115 fixes English `/offers` locked offer card labels so legacy Russian fallback data no longer appears in buyer-facing price or analytics controls.
- Lovable confirmed `src/lib/catalog-display-labels.ts`, catalog row/card changes, active-locale analytics keys, focused regression tests, Batch #115 production-scale notes and public route declarations are present.
- Buyer-first narrative, supplier trust mechanism, access gating, supplier identity redaction, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting, Batch #113 route chunk boundary and Batch #114 font loading are preserved.
- Lovable sync for Batch #114 is confirmed clean at `3be3d6d2`, with no conflicts.
- PR #165 is merged for Batch #114: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/165`.
- Batch #114 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-114-lovable-sync.md`.
- Batch #114 moves Google Fonts discovery from CSS `@import` to document-head preconnect and stylesheet links without changing the typography contract.
- Lovable confirmed `src/index.css`, `index.html`, `src/test/font-loading.test.ts`, Batch #114 production-scale notes, route declarations, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting and Batch #113 RouteChunkErrorBoundary are present.
- GitHub `Core Type And Build Gate` passed on PR #165, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- `main` also includes `946ff9a`, `[codex] Record Batch 113 Lovable sync`.
- User confirmed Lovable sync for Batch #113 is clean at `9d3c90d2`, with no conflicts.
- PR #164 is merged for Batch #113: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/164`.
- Batch #113 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-113-lovable-sync.md`.
- GitHub `Core Type And Build Gate` passed on PR #164, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #112 merged commit is `2430fef`, `[codex] Batch #112 route code splitting`.
- PR #163 is merged for Batch #112: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/163`.
- User confirmed Lovable sync for Batch #112 is clean at `45891e11`, with no conflicts.
- Batch #111 merged commit is `17fc484`, `[codex] Batch #111 public route SEO`.
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
- GitHub `Core Type And Build Gate` passed on PR #163, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #112 local validation passed:
  - `npx vitest run src/test/app-route-code-splitting.test.ts` passed, 2 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run build` passed with the previous large-chunk warning removed;
  - production preview Playwright smoke passed for `e2e/smoke-core.spec.ts` and `e2e/suppliers-no-horizontal-overflow-375.spec.ts`, 9 tests.
- Batch #113 focused validation passed:
  - `npx vitest run src/components/routing/RouteChunkErrorBoundary.test.tsx src/test/app-route-code-splitting.test.ts` passed, 4 tests;
  - `npx tsc -b --noEmit` passed.
- Batch #113 full local validation passed:
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with the known Supabase type drift and Browserslist warnings only;
  - Vite large-chunk warning stayed resolved;
  - production preview Playwright smoke passed for `e2e/smoke-core.spec.ts` and `e2e/suppliers-no-horizontal-overflow-375.spec.ts`, 9 tests.
- Batch #114 full local validation passed:
  - `npx vitest run src/test/font-loading.test.ts` passed, 3 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only;
  - Vite large-chunk warning stayed resolved;
  - production CSS bundle is `125.44 kB` minified and `20.79 kB` gzip;
  - production entry chunk is `355.46 kB` minified and `114.16 kB` gzip;
  - production preview Playwright smoke passed for `e2e/smoke-core.spec.ts` and `e2e/suppliers-no-horizontal-overflow-375.spec.ts`, 9 tests.
- Batch #115 local validation passed:
  - `npx vitest run src/lib/catalog-display-labels.test.ts src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/catalog/CatalogOfferRow.analyticsA11y.test.tsx src/components/catalog/MobileOfferCard.analyticsToggle.test.tsx` passed, 16 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only;
  - production preview Playwright check passed for `/offers` desktop and mobile: no horizontal overflow and no visible Russian locked-price or analytics labels.
- GitHub `Core Type And Build Gate` passed on PR #166 in 10m52s, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.

## Blockers

- No hard blocker confirmed.
- Known warnings remain:
  - Supabase generated types are out of sync in non-strict build mode;
  - Browserslist data is stale.
