# Prompt #119: Lovable Sync For Offers CTA Semantics

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `e17810e`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #119, then verify that
locked-buyer `/offers` CTAs render as single semantic links, not nested
link/button controls. Do not change catalog behavior, access gating, supplier
redaction, price locks, sorting, filtering, pagination, SEO, route shell,
backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `e17810e` or newer.
- PR #170: [codex] Batch #119 offers CTA semantics.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content supports trust and supply evidence; it must not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative card grids, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change buyer access gating, supplier identity redaction or price-lock rules.
- Do not change `/offers` copy, hierarchy, spacing, colors, CTA destinations, filters, sort, page size or pagination.
- Do not change catalog data or supplier search behavior.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor or Batch #118 for-suppliers CTA semantics.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/catalog/AccessLevelBanner.tsx` anonymous locked account CTA uses `Button asChild` with a direct React Router `Link` to `/register`.
2. `src/components/catalog/CatalogValueStrip.tsx` keeps the registered buyer CTA as a normal button that opens the existing dialog.
3. `src/components/catalog/CatalogValueStrip.tsx` renders the anonymous locked value-strip CTA with `Button asChild` and a direct `Link` to `/register`.
4. `src/components/catalog/RelatedRequests.tsx` renders locked related-request `Respond` CTAs with `Button asChild` and direct links to `/register`.
5. `src/pages/Offers.catalogPaging.test.tsx` includes a regression assertion that `document.querySelectorAll("a button, button a")` has length `0`.
6. `e2e/offers-cta-semantics.spec.ts` exists and checks mobile `/offers`:
   - visible catalog result count;
   - visible value-strip `Create account` link;
   - visible related-request `Respond` link;
   - first price block remains `data-access-level="anonymous_locked"`;
   - zero nested `a button` / `button a` controls;
   - no horizontal overflow at 390px.
7. `package.json` includes `e2e/offers-cta-semantics.spec.ts` in both `smoke:e2e:offers-catalog:run` and `smoke:e2e:run`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #119 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/offers` renders in English on desktop and mobile.
- On mobile around 390px, confirm:
  - the catalog value strip shows `Create account` as a link to `/register`;
  - related request `Respond` CTAs are links to `/register`;
  - the CTAs still look like the existing YORSO buttons.
- Confirm the DOM has no nested interactive CTA controls:
  `document.querySelectorAll("a button, button a").length === 0`
- Confirm `/offers` still has no horizontal overflow at mobile width.
- Confirm anonymous locked buyers still cannot see exact prices or supplier identities.
- Confirm sorting, filtering, page-size and pagination still work on `/offers`.
- Confirm Batch #116 proof-strip behavior still lands on visible offer evidence.
- Confirm Batch #117 `/offers#request` behavior still lands on the catalog access/value strip.
- Confirm Batch #118 `/for-suppliers` CTA semantics remain present.
- Confirm SEO metadata and JSON-LD from Batch #111 remain present.
- Confirm the Batch #113 route chunk error boundary is still present.
- Confirm public pages keep the buyer-first story: buyers compare offers, evaluate supplier evidence, request access and understand the procurement workflow.
- Confirm supplier-facing content remains a trust/supply mechanism.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/pages/Offers.catalogPaging.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/offers-cta-semantics.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local and GitHub validation:
- CSS bundle after Batch #119: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #119: `355.46 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #119: `313.45 kB` minified and `98.69 kB` gzip.
- Offers route chunk after Batch #119: `72.49 kB` minified and `18.71 kB` gzip.
- GitHub PR #170 `Core Type And Build Gate` passed before merge in 11m44s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Offers CTA semantics status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
