# Prompt #116: Lovable Sync For Offers Proof Anchor Fallback

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `33d92c3`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #116, then verify that
the /offers trust proof-strip anchor fallback is present without changing
product behavior, access gating, supplier redaction, route shell, visual
system, backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `33d92c3` or newer.
- PR #167: [codex] Batch #116 offers proof anchor fallback.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change buyer access gating, supplier identity redaction or price-lock rules.
- Do not change catalog data, offer sorting, filtering, pagination or supplier search.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading or Batch #115 catalog locale hardening.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/catalog/TrustProofStrip.tsx` resolves a visible scroll target before calling `scrollIntoView`.
2. `Procurement intelligence` still targets `catalog-anchor-intelligence` on desktop when visible, but falls back to `catalog-anchor-results` when the primary target is hidden on mobile.
3. `Document readiness` now targets `catalog-anchor-results` so buyers land on offer cards where document status is visible, not the procurement filter bar.
4. Existing `catalog_trust_proof_click` telemetry remains in place and sends the resolved anchor id.
5. `src/components/catalog/TrustProofStrip.test.tsx` exists and covers:
   - hidden intelligence target fallback to offer results;
   - visible desktop intelligence target still used;
   - document-readiness proof targets offer results, not filters.
6. `e2e/offers-trust-proof-anchors.spec.ts` exists and checks mobile `/offers` proof-strip clicks land on visible offer evidence.
7. `package.json` extends `smoke:e2e:offers-catalog:run` to include both:
   - `e2e/offers-catalog-paging.spec.ts`;
   - `e2e/offers-trust-proof-anchors.spec.ts`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #116 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/offers` renders in English on desktop and mobile.
- On mobile `/offers` around 390px:
  - tap `Procurement intelligence` in the trust proof strip;
  - confirm the page scrolls to visible offer evidence, not a hidden/blank desktop-only panel;
  - confirm the first offer card and the mobile trend analytics trigger are visible after the jump.
- On mobile `/offers` around 390px:
  - tap `Document readiness`;
  - confirm the page scrolls to offer cards with document readiness status, not only to the filter bar.
- Confirm `/offers` still has no horizontal overflow at mobile width.
- Confirm buyer access gating still hides exact price and supplier identity before approval.
- Confirm Batch #115 locale hardening is still present: English `/offers` must not show `Цена по запросу`, `Аналитика цен`, `Показать аналитику` or `Разворачивает`.
- Confirm public pages keep the buyer-first story: buyers compare offers, evaluate supplier trust, request access and understand procurement workflow.
- Confirm supplier-facing content remains a trust/supply mechanism.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/catalog/TrustProofStrip.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/offers-trust-proof-anchors.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from GitHub validation:
- CSS bundle after Batch #116: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #116: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #116: `313.45 kB` minified and `98.69 kB` gzip.
- GitHub PR #167 `Core Type And Build Gate` passed before merge.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Offers proof anchor fallback status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
