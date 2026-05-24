# Handoff

Project: `yorso-commerce-hub`

Root: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`

## Read First

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/NEXT_ACTIONS.md`
5. `docs/project-memory/WORKLOG.md`
6. `docs/project-memory/ARTIFACTS.md`
7. `docs/project-memory/RISKS.md`

## Current Goal

Continue the next scoped public UX/UI audit and remediation work with a buyer-first B2B procurement lens: trust, clarity, scanability, conversion, SEO structure and supplier evidence as a trust mechanism.

## Current Status

- The repository is currently on branch `main`.
- Batch #122 is merged to `main` as `dc2a3ca`, `[codex] Batch #122 public CTA semantics (#173)`.
- PR #173 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/173`.
- GitHub `Core Type And Build Gate` passed on PR #173 in 11m31s.
- Batch #122 Lovable sync is confirmed clean at `98335bd5`, `[codex] Record Batch 122 merge`, with no conflicts and no local file modifications in Lovable.
- Batch #122 Lovable sync prompt is archived at `docs/project-memory/PROMPTS/prompt-122-lovable-sync.md`.
- Batch #122 fixes a concrete public CTA semantics defect found after Batch #121:
  - homepage `View all offers`, landing offer certification chips and shared info/legal back CTAs rendered nested interactive controls;
  - the homepage desktop CTA and shared info back CTA now use the existing `Button asChild` pattern;
  - landing offer certification chips render as static proof chips inside clickable offer-card links;
  - buyer-first copy, offer-card destinations, route shell, public route SEO, access gating, supplier identity redaction, price locks and visual styling are unchanged.
- Batch #122 touched `src/components/landing/LiveOffers.tsx`, `src/components/landing/OfferCard.tsx`, `src/components/CertificationBadges.tsx`, `src/components/InfoPageLayout.tsx`, added `src/pages/PublicCtaSemantics.test.tsx`, added `e2e/public-cta-semantics.spec.ts`, extended dedicated/full e2e smoke scripts, and added the Batch #122 production-scale section.
- Batch #122 validation passed:
  - pre-fix Playwright runtime scan found nested interactive controls on `/` and shared info/legal routes;
  - post-fix Playwright runtime scan confirmed zero nested controls and zero horizontal overflow on `/` and shared info/legal routes at 390px;
  - `npx vitest run src/pages/PublicCtaSemantics.test.tsx`, 2 tests;
  - `npm run smoke:e2e:public-cta-semantics`, 12 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run smoke:e2e:run`, 126 tests.
- Batch #122 build completed inside `npm run smoke:e2e:public-cta-semantics`; known Supabase type drift and Browserslist warnings remain, and the Vite large-chunk warning stayed resolved.
- Lovable confirmed `LiveOffers`, `OfferCard`, `CertificationBadges`, `InfoPageLayout`, `PublicCtaSemantics.test.tsx`, `e2e/public-cta-semantics.spec.ts`, package smoke wiring, Batch #122 production-scale notes, homepage runtime status, info/legal CTA semantics, preserved Batches #117-#121 behavior, Batch #112 code-splitting and Batch #113 RouteChunkErrorBoundary.
- The latest merged production batch is Batch #122 on `main`; Lovable sync for Batch #122 is clean.
- Historical merged state:
- Batch #117 is merged to `main` as `c2c5ff3`, `[codex] Batch #117 offers request anchor (#168)`.
- PR #168 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/168`.
- Batch #117 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-117-lovable-sync.md`.
- Lovable sync for Batch #117 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced on `main` on top of Batch #117 `c2c5ff3`, PR #168;
  - `Offers.tsx` has the stable `#request` anchor, hash-preserving URL normalization and hash-scroll effect;
  - `/how-it-works` hero and final buyer CTAs use structured React Router targets to `/offers#request`;
  - the e2e guard and smoke script wiring are present;
  - no conflicts were found and Lovable did not modify files;
  - buyer-first narrative, Batch #110 mobile fix, Batch #111 SEO, Batch #112 code-splitting, Batch #113 RouteChunkErrorBoundary, Batch #114 font loading, Batch #115 locale hardening, Batch #116 proof anchor fallback, access gating and supplier identity redaction are preserved.
- Batch #118 is merged to `main` as `f025e7b`, `[codex] Batch #118 for-suppliers CTA semantics (#169)`.
- PR #169 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/169`.
- Batch #118 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-118-lovable-sync.md`.
- Lovable sync for Batch #118 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced to `dc78e094`, `[codex] Add Batch 118 Lovable sync prompt`, on `main` and on top of Batch #118 `f025e7b`;
  - `ForSuppliers.tsx` hero and final CTAs use `Button asChild` with direct React Router links to `/register` and `/offers`;
  - analytics `supplier_page_cta_register_click` and `supplier_page_cta_requests_click` remain attached with `surface: hero|final`;
  - `ForSuppliers.test.tsx` and `e2e/for-suppliers-cta-semantics.spec.ts` are present;
  - no conflicts were found and Lovable did not modify files;
  - buyer-first narrative, Batch #110 mobile fix, Batch #111 SEO, Batch #112 code-splitting, Batch #113 RouteChunkErrorBoundary, Batch #114 font loading, Batch #115 locale hardening, Batch #116 proof anchor fallback, Batch #117 request anchor, access gating, supplier identity redaction and price lock are preserved.
- The repository is currently on branch `main`.
- Batch #119 is merged to `main` as `e17810e`, `[codex] Batch #119 offers CTA semantics (#170)`.
- PR #170 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/170`.
- Batch #119 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-119-lovable-sync.md`.
- Lovable sync for Batch #119 is confirmed clean at `851ad960`, with no conflicts and no files modified.
- Lovable confirmed `AccessLevelBanner`, `CatalogValueStrip`, `RelatedRequests`, `Offers.catalogPaging.test.tsx`, `e2e/offers-cta-semantics.spec.ts`, offers/full smoke wiring, Batch #119 production-scale notes and preservation of Batch #116-#121 safeguards.
- Batch #119 fixes a concrete `/offers` runtime semantics defect found after Batch #118:
  - locked-buyer account, value-strip and related-request CTAs rendered as nested `Link` plus `Button`, producing duplicate interactive controls in the buyer catalog;
  - CTAs now use the existing `Button asChild` pattern;
  - destinations, copy, visual styling, access gating, supplier redaction, price locks, sorting, filtering and pagination are unchanged.
- Batch #119 touched `src/components/catalog/AccessLevelBanner.tsx`, `src/components/catalog/CatalogValueStrip.tsx`, `src/components/catalog/RelatedRequests.tsx`, `src/pages/Offers.catalogPaging.test.tsx`, added `e2e/offers-cta-semantics.spec.ts`, extended offers/full e2e smoke scripts, and added the Batch #119 production-scale section.
- Batch #119 validation passed:
  - `npx vitest run src/pages/Offers.catalogPaging.test.tsx`, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4191 npx playwright test e2e/offers-cta-semantics.spec.ts --project=chromium`, 1 test;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only.
- GitHub `Core Type And Build Gate` passed on PR #170 in 11m44s.
- The repository is currently on branch `main`.
- Batch #120 is merged to `main` as `276f790`, `[codex] Batch #120 auth CTA semantics (#171)`.
- PR #171 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/171`.
- Batch #120 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-120-lovable-sync.md`.
- Lovable sync for Batch #120 is confirmed clean at `700d4484`, with no conflicts and a clean working tree.
- Batch #120 fixes a concrete public auth route semantics defect found after Batch #119:
  - `/signin` home back-link and `/reset-password` sign-in back-link rendered as nested `Link` plus `Button`, producing duplicate interactive controls;
  - both back links now use the existing `Button asChild` pattern;
  - auth copy, form behavior, redirect behavior, self-hosted API integration, Supabase prototype recovery behavior, route shell and visual styling are unchanged.
- Batch #120 touched `src/pages/SignIn.tsx`, `src/pages/ResetPassword.tsx`, added `src/pages/AuthCtaSemantics.test.tsx`, added `e2e/auth-cta-semantics.spec.ts`, extended full e2e smoke scripts, and added the Batch #120 production-scale section.
- Batch #120 validation passed:
  - `npx vitest run src/pages/AuthCtaSemantics.test.tsx`, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4192 npx playwright test e2e/auth-cta-semantics.spec.ts --project=chromium`, 2 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only.
- GitHub `Core Type And Build Gate` passed on PR #171 in 10m50s.
- Batch #121 is merged to `main` as `809d35f`, `[codex] Batch #121 offer detail CTA semantics (#172)`.
- PR #172 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/172`.
- Batch #121 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-121-lovable-sync.md`.
- Lovable sync for Batch #121 is confirmed clean at `9b8f9434`, with no conflicts and no files modified.
- Batch #121 fixes a concrete `/offers/:id` runtime semantics defect found after Batch #120:
  - load-error, not-found, locked access banner, price-lock summary and sticky mobile CTAs rendered as nested link/anchor plus `Button`, producing duplicate interactive controls;
  - CTAs now use the existing `Button asChild` pattern;
  - destinations, copy, visual styling, return-to-catalog behavior, access-request behavior, access gating, supplier identity redaction and exact-price locks are unchanged.
- Batch #121 touched `src/pages/OfferDetail.tsx`, `src/components/offer-detail/OfferSummary.tsx`, added `e2e/offer-detail-cta-semantics.spec.ts`, extended dedicated/full e2e smoke scripts, and added the Batch #121 production-scale section.
- Batch #121 validation passed:
  - pre-fix Playwright scan confirmed nested controls on anonymous, registered-locked and unknown offer detail states;
  - post-fix Playwright scan confirmed zero nested controls and zero horizontal overflow on all three states at 390px;
  - `E2E_BASE_URL=http://127.0.0.1:4193 npx playwright test e2e/offer-detail-cta-semantics.spec.ts --project=chromium`, 3 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4193 npx playwright test e2e/offer-detail-access.spec.ts e2e/offer-detail-cta-semantics.spec.ts --project=chromium`, 6 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only;
  - `npm run smoke:e2e:offer-detail-cta-semantics:run`, 3 tests;
  - `npm run smoke:e2e:run`, 114 tests.
- GitHub `Core Type And Build Gate` passed on PR #172 rerun in 10m56s. The first run failed in unrelated `account-company-edit-contract`; local isolated and full smoke passed, and the rerun passed without code changes.
- Batch #118 fixes a concrete `/for-suppliers` runtime semantics defect found after Batch #117:
  - hero and final CTAs rendered as nested `Link` plus `Button`, producing duplicate interactive controls at the same visual target;
  - CTAs now use the existing `Button asChild` pattern;
  - destinations, analytics events, visual styling, SEO, route shell, access gating and supplier redaction are unchanged.
- Batch #118 touched `src/pages/ForSuppliers.tsx`, `src/pages/ForSuppliers.test.tsx`, added `e2e/for-suppliers-cta-semantics.spec.ts`, extended `smoke:e2e:run`, and added the Batch #118 production-scale section.
- Batch #118 validation passed:
  - `npx vitest run src/pages/ForSuppliers.test.tsx`, 4 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4190 npx playwright test e2e/for-suppliers-cta-semantics.spec.ts --project=chromium`, 1 test;
  - runtime Playwright check for `/for-suppliers` at 390px confirmed zero nested interactive CTA controls, visible register/request links and zero horizontal overflow;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only.
- GitHub `Core Type And Build Gate` passed on PR #169 in 10m36s.
- Batch #117 fixes a concrete cross-route conversion defect found in runtime review:
  - `/how-it-works` buyer request-access CTAs pointed to `/offers#request`;
  - `/offers` had no `#request` anchor and catalog URL normalization stripped the hash;
  - `/offers` now exposes a stable `#request` anchor around the existing access/value strip and preserves active hashes while rewriting search params.
- Batch #117 touched `src/pages/Offers.tsx`, `src/pages/HowItWorks.tsx`, `src/components/how-it-works/FinalCTA.tsx`, added `e2e/how-it-works-request-anchor.spec.ts`, extended `smoke:e2e:run`, and added the Batch #117 production-scale section.
- Batch #117 validation passed:
  - `E2E_BASE_URL=http://127.0.0.1:4188 npx playwright test e2e/how-it-works-request-anchor.spec.ts --project=chromium`, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4188 npx playwright test e2e/offers-catalog-paging.spec.ts --project=chromium`, 4 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only.
- GitHub `Core Type And Build Gate` passed on PR #168 in 10m54s.
- Batch #116 offers proof anchor fallback is merged to `main` as `33d92c3`, `[codex] Batch #116 offers proof anchor fallback (#167)`.
- PR #167 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/167`.
- Batch #116 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-116-lovable-sync.md`.
- Lovable sync for Batch #116 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced to `3bca7961`, `[codex] Add Batch 116 Lovable sync prompt`, on top of Batch #116 `33d92c3`;
  - `TrustProofStrip` visible-anchor resolution, focused tests, mobile e2e guard, offers-catalog smoke wiring and Batch #116 production-scale notes are present;
  - no conflicts were found and no files were modified in Lovable;
  - buyer-first narrative, supplier trust mechanism, access gating, supplier identity redaction, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting, Batch #113 route chunk boundary, Batch #114 font loading and Batch #115 locale hardening are preserved;
  - `Procurement intelligence` targets `catalog-anchor-intelligence` on desktop and falls back to `catalog-anchor-results` on mobile; `Document readiness` targets `catalog-anchor-results`; telemetry sends the resolved anchor id;
  - known warnings remain: Supabase generated types drift in non-strict mode and stale Browserslist data.
- Batch #116 fixes a concrete `/offers` trust-proof navigation defect found in runtime review:
  - on mobile, `Procurement intelligence` proof no longer targets the hidden desktop-only intelligence column and falls back to visible offer evidence;
  - `Document readiness` proof now lands on offer cards where document status is visible instead of the filter bar;
  - access gating, supplier identity redaction, offer data, routes and backend APIs are unchanged.
- Batch #116 touched `src/components/catalog/TrustProofStrip.tsx`, added `src/components/catalog/TrustProofStrip.test.tsx`, added `e2e/offers-trust-proof-anchors.spec.ts`, extended `smoke:e2e:offers-catalog:run`, and added the Batch #116 production-scale section.
- GitHub `Core Type And Build Gate` passed on PR #167, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #116 validation passed:
  - `npx vitest run src/components/catalog/TrustProofStrip.test.tsx`, 3 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4187 npx playwright test e2e/offers-trust-proof-anchors.spec.ts --project=chromium`, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4187 npx playwright test e2e/offers-catalog-paging.spec.ts e2e/offers-trust-proof-anchors.spec.ts --project=chromium`, 6 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only.
- Batch #115 catalog locale hardening is merged to `main` as `eec49ec`, `[codex] Batch #115 catalog locale hardening`.
- PR #166 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/166`.
- Batch #115 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-115-lovable-sync.md`.
- Lovable sync for Batch #115 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced to `040e17b9`, `[codex] Add Batch 115 Lovable sync prompt`, on top of Batch #115 `eec49ec`;
  - `src/lib/catalog-display-labels.ts`, catalog row/card locale changes, focused regression tests, EN/RU/ES analytics keys and Batch #115 production-scale notes are present;
  - no conflicts were found and no files were modified in Lovable;
  - buyer-first narrative, supplier trust mechanism, access gating, supplier identity redaction, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting, Batch #113 route chunk boundary and Batch #114 font loading are preserved;
  - English locked offer labels render as `Exact price locked per kg` on desktop and `Exact price locked` on mobile, and legacy Russian strings do not appear in the EN UI;
  - known warnings remain: Supabase generated types drift in non-strict mode and stale Browserslist data.
- Batch #115 fixes a concrete `/offers` UX/trust defect found during the route-level proof review: English locked offer cards exposed legacy Russian labels for the price state and analytics trigger/hints.
- Batch #115 keeps buyer access gating, supplier identity redaction, Batch #112 route splitting and Batch #113 route error boundary unchanged.
- Batch #114 font-loading cleanup is merged to `main` as `df5b66f`, `[codex] Batch #114 font loading cleanup`.
- PR #165 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/165`.
- Batch #114 Lovable sync prompt is ready: `docs/project-memory/PROMPTS/prompt-114-lovable-sync.md`.
- Lovable sync for Batch #114 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced to `3be3d6d2`, `[codex] Add Batch 114 Lovable sync prompt`, on top of Batch #114 `df5b66f`;
  - `src/index.css` has no Google Fonts `@import`, while body copy still uses Inter and headings use Plus Jakarta Sans;
  - `index.html` contains Google Fonts preconnect plus the Plus Jakarta Sans and Inter stylesheet with `display=swap`;
  - `src/test/font-loading.test.ts` and the Batch #114 production-scale section are present;
  - public routes remain declared in `src/App.tsx` with lazy loading, `RouteChunkErrorBoundary` and `Suspense`;
  - no conflicts were found and no local Lovable edits were made;
  - buyer-first runtime, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting and Batch #113 route chunk boundary are preserved.
- Current merged Batch #113 commit is `9860aa3`, `[codex] Batch #113 route chunk error boundary`.
- PR #164 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/164`.
- Lovable sync for Batch #113 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced to `9d3c90d2`, including Batch #113 `9860aa3` or newer;
  - route chunk error boundary files, route-shell wiring, test coverage and production-scale notes are present;
  - no conflicts were found and nothing was overwritten;
  - buyer-first public narrative, Batch #110 mobile fixes, Batch #111 SEO and Batch #112 bundle strategy are preserved.
- Current merged Batch #112 commit is `2430fef`, `[codex] Batch #112 route code splitting`.
- PR #163 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/163`.
- Lovable sync for Batch #112 was confirmed clean by the user on 2026-05-24:
  - GitHub commit synced to `45891e11`, including Batch #112 `2430fef4`;
  - route lazy-loading, `Suspense`, eager providers, `i18n-translations` chunking and route code-splitting tests are present;
  - no conflicts were found;
  - public route runtime, buyer-first narrative, Batch #111 SEO and Batch #110 mobile fixes are preserved.
- Current merged Batch #111 commit is `17fc484`, `[codex] Batch #111 public route SEO`.
- PR #162 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/162`.
- Lovable sync for Batch #111 was confirmed clean by the user on 2026-05-23:
  - GitHub commit synced to `01734e1d`, including Batch #111 `17fc4841`;
  - route-owned SEO files, markers, JSON-LD ids and tests are present;
  - no conflicts were found;
  - public mobile UX routes render;
  - supplier company names do not leak in supplier-directory SEO.
- Current merged Batch #110 commit is `2e8fb7b`, `[codex] Batch #110 public UX mobile scan`.
- PR #161 is merged: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/161`.
- Lovable sync for Batch #110 was confirmed clean by the user on 2026-05-23:
  - GitHub commit synced to `ff989407`, including Batch #110 `2e8fb7b`;
  - `index.html`, `README.md`, public routes and migration manifest were checked;
  - no conflicts were found;
  - known warnings remain: Supabase generated types drift, stale Browserslist data and large main JS chunk.
- PR #161 CI exposed stale DB migration test expectations after Batch #109 added `0025_admin_incident_trend_action_queue`; the merged fix updates `packages/db/src/cli.test.ts` and `packages/db/src/migrator.test.ts` to expect 26 migrations and the `0025` queue migration.
- Batch #108 added admin incident trend actions.
- Batch #109 added the dedicated admin incident trend action queue.
- Lovable sync for Batch #109 was confirmed clean by the user on 2026-05-23:
  - HEAD `dc6eec10` is present;
  - `/admin/incident-trend-actions` maps to `AdminIncidentTrendActions`;
  - migration `0025_admin_incident_trend_action_queue.sql` exists and is in the manifest;
  - `/v1/admin/incidents/trend-action-queue`, `/export` and `/bulk` routes are connected;
  - `e2e/admin-incident-trend-actions.spec.ts` and `smoke:e2e:admin-incident-trend-actions` are present.
- Batch #110 public UX/UI patch is implemented and validated after the audit:
  - `index.html` no longer uses Lovable default title, description or social metadata;
  - `README.md` now describes YORSO Commerce Hub instead of the default Lovable TODO;
  - `/` and `/how-it-works` have overflow containment for mobile;
  - how-it-works comparison matrices were constrained for narrow screens;
  - mobile header, footer, breadcrumbs, supplier quick filters, supplier rows, offer filters, certification chips and public CTA controls were hardened for 44px mobile touch targets;
  - invalid `Link > Button` nesting in public CTA blocks was replaced with `Button asChild`.
- Batch #111 public route SEO patch is merged:
  - `/`, `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers` now set route-owned SEO markers;
  - those routes set canonical, Open Graph, Twitter and JSON-LD metadata;
  - global EN/RU/ES meta descriptions now use concrete buyer-first procurement language;
  - `/suppliers` metadata is covered against exact supplier company-name leakage before access;
  - homepage H1 textContent now has a readable boundary between stacked title lines.
- Batch #112 implementation:
  - `src/App.tsx` route pages are lazy-loaded through `React.lazy`;
  - routes are wrapped in `Suspense` with a lightweight skeleton fallback;
  - global providers, `LegacyOfferRedirect`, legacy redirects and `SupplierApprovalNotifier` remain eager;
  - `vite.config.ts` splits only the local `src/i18n/translations.ts` table into `i18n-translations`;
  - manual third-party vendor chunking was tested and rejected because production preview exposed React/vendor circular runtime errors;
  - `src/test/app-route-code-splitting.test.ts` guards route lazy-loading and the translation chunk rule.
- Batch #113 implementation:
  - `src/components/routing/RouteChunkErrorBoundary.tsx` adds a route-level recovery state for lazy route render or chunk-load failures;
  - `src/App.tsx` wraps lazy routes in `RouteChunkErrorBoundary`;
  - the fallback gives buyers/operators a reload action and a go-back action without changing product data;
  - `src/components/routing/RouteChunkErrorBoundary.test.tsx` covers normal render and fallback recovery;
  - `src/test/app-route-code-splitting.test.ts` now guards error-boundary wiring.
- Batch #114 implementation:
  - `src/index.css` no longer loads Google Fonts through CSS `@import`;
  - `index.html` preconnects to `fonts.googleapis.com` and `fonts.gstatic.com` and loads the existing Inter plus Plus Jakarta Sans stylesheet from the document head;
  - `src/test/font-loading.test.ts` guards against reintroducing the CSS import and keeps the body/heading font contract explicit.
  - PR #165 passed GitHub `Core Type And Build Gate` and merged to `main`.

## Confirmed Checks In This UX Pass

- `npm run lint` passed.
- `npx tsc -b --noEmit` passed.
- `npm run check:production-scale-baseline` passed.
- Before Batch #112, `npm run build` passed with known warnings:
  - non-strict Supabase generated type drift;
  - stale Browserslist data;
  - large main JS chunk.
- Playwright mobile overflow checks at 390px passed for `/`, `/how-it-works` and `/suppliers`.
- Playwright mobile audit at 390px passed with zero horizontal overflow and zero interactive targets below 44px for `/`, `/how-it-works`, `/suppliers`, `/offers` and `/for-suppliers`.
- `npx vitest run src/components/catalog/MobileOfferCard.touchTargets.test.tsx` passed, 8 tests.
- `npm run test:db-migrations` passed after the PR #161 CI migration-test fix.
- `npm run ci:core` passed after the PR #161 CI migration-test fix.
- GitHub `Core Type And Build Gate` passed on PR #161, including core CI, account reports, browser smoke, API-backed access suite and admin smoke steps.
- Batch #111 focused validation passed:
  - `npx vitest run src/pages/PublicRouteSeo.test.tsx src/i18n/locale-document-meta-ru.test.tsx src/pages/Blog.seoHardening.test.tsx src/pages/ForSuppliers.test.tsx src/pages/Suppliers.test.tsx src/pages/Offers.catalogPaging.test.tsx` passed, 53 tests;
  - `npx vitest run src/pages/PublicRouteSeo.test.tsx` passed, 9 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run build` passed with known warnings;
  - Playwright head/mobile check at 390px confirmed marker, canonical, OG/Twitter, JSON-LD and no horizontal overflow on the five public routes.
- GitHub `Core Type And Build Gate` passed on PR #162, including core CI, account reports, browser smoke, API-backed access suite, self-hosted auth/access smoke and admin smoke steps.
- Batch #112 local validation passed:
  - `npx vitest run src/test/app-route-code-splitting.test.ts`, 2 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only;
  - Vite large-chunk warning removed;
  - production entry chunk: `352.18 kB` minified, `112.99 kB` gzip;
  - `i18n-translations`: `311.45 kB` minified, `98.15 kB` gzip;
  - `E2E_BASE_URL=http://127.0.0.1:4182 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium`, 9 tests.
- GitHub `Core Type And Build Gate` passed on PR #163, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #113 focused validation passed:
  - `npx vitest run src/components/routing/RouteChunkErrorBoundary.test.tsx src/test/app-route-code-splitting.test.ts`, 4 tests;
  - `npx tsc -b --noEmit`.
- Batch #113 full local validation passed:
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only;
  - Vite large-chunk warning stayed resolved;
  - production entry chunk: `355.46 kB` minified, `114.16 kB` gzip;
  - `i18n-translations`: `311.45 kB` minified, `98.15 kB` gzip;
  - `E2E_BASE_URL=http://127.0.0.1:4183 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium`, 9 tests.
- GitHub `Core Type And Build Gate` passed on PR #164, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #114 full local validation passed:
  - `npx vitest run src/test/font-loading.test.ts`, 3 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only;
  - Vite large-chunk warning stayed resolved;
  - production entry chunk: `355.46 kB` minified, `114.16 kB` gzip;
  - CSS bundle: `125.44 kB` minified, `20.79 kB` gzip;
  - `E2E_BASE_URL=http://127.0.0.1:4184 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium`, 9 tests.
- GitHub `Core Type And Build Gate` passed on PR #165, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.
- Batch #115 local validation passed:
  - `npx vitest run src/lib/catalog-display-labels.test.ts src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/catalog/CatalogOfferRow.analyticsA11y.test.tsx src/components/catalog/MobileOfferCard.analyticsToggle.test.tsx`, 16 tests;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run check:production-scale-baseline`;
  - `npm run build` with known Supabase type drift and Browserslist warnings only;
  - production preview Playwright check for `/offers` at 1440px and 390px confirmed no horizontal overflow, no visible Russian locked-price label and no visible Russian analytics trigger/hint.
- GitHub `Core Type And Build Gate` passed on PR #166 in 10m52s, including core CI, account reports, browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps.

## Next Action

```text
Start the next scoped public UX/UI runtime audit from repository state.
Prioritize concrete route-level issues that affect buyer trust, scanability, conversion, accessibility or SEO structure.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not mix this project with `/Users/istokdmgmail.com/yorso_new` unless explicitly asked.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Preserve existing shadcn/Tailwind/component patterns unless there is a specific UX reason to change them.
