# Prompt #118: Lovable Sync For For-Suppliers CTA Semantics

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `f025e7b`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #118, then verify that
the /for-suppliers supplier CTAs render as single semantic links, not nested
link/button controls, without changing copy, layout, visual style, route shell,
analytics intent, access gating, supplier redaction, backend APIs, Supabase
settings or data models.

Source of truth:
- GitHub `main`, commit `f025e7b` or newer.
- PR #169: [codex] Batch #118 for-suppliers CTA semantics.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change buyer access gating, supplier identity redaction or price-lock rules.
- Do not change `/for-suppliers` copy, hierarchy, spacing, colors or CTA destinations.
- Do not change catalog data, offer sorting, filtering, pagination or supplier search.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback or Batch #117 offers request anchor.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/ForSuppliers.tsx` hero `Register as supplier` CTA uses `Button asChild` with a direct React Router `Link` to `/register`.
2. `src/pages/ForSuppliers.tsx` hero `See buyer requests` CTA uses `Button asChild` with a direct React Router `Link` to `/offers`.
3. `src/pages/ForSuppliers.tsx` final `Register as supplier` CTA uses the same semantic pattern.
4. `src/pages/ForSuppliers.tsx` final `See buyer requests` CTA uses the same semantic pattern.
5. Existing analytics events remain attached to the same CTA clicks:
   - `supplier_page_cta_register_click`;
   - `supplier_page_cta_requests_click`.
6. `src/pages/ForSuppliers.test.tsx` includes a regression assertion that `document.querySelectorAll("a button, button a")` has length `0`.
7. `e2e/for-suppliers-cta-semantics.spec.ts` exists and checks mobile `/for-suppliers`:
   - visible `Register as supplier` link;
   - visible `See buyer requests` link;
   - zero nested `a button` / `button a` controls;
   - no horizontal overflow at 390px.
8. `package.json` includes `e2e/for-suppliers-cta-semantics.spec.ts` in `smoke:e2e:run`.
9. `docs/backend/production-scale-baseline.md` includes the Batch #118 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/for-suppliers` renders in English on desktop and mobile.
- On mobile around 390px, confirm:
  - `Register as supplier` is visible as a link to `/register`;
  - `See buyer requests` is visible as a link to `/offers`;
  - the CTAs still look like the existing YORSO buttons.
- Confirm the DOM has no nested interactive CTA controls:
  `document.querySelectorAll("a button, button a").length === 0`
- Confirm `/for-suppliers` still has no horizontal overflow at mobile width.
- Confirm SEO metadata and JSON-LD from Batch #111 remain present for `/for-suppliers`.
- Confirm buyer access gating, supplier identity redaction and catalog price-lock behavior are unchanged.
- Confirm Batch #117 `/offers#request` behavior is still present.
- Confirm Batch #116 proof-strip behavior is still present on `/offers`.
- Confirm public pages keep the buyer-first story: buyers compare offers, evaluate supplier trust, request access and understand procurement workflow.
- Confirm supplier-facing content remains a trust/supply mechanism.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/pages/ForSuppliers.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/for-suppliers-cta-semantics.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from GitHub validation:
- CSS bundle after Batch #118: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #118: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #118: `313.45 kB` minified and `98.69 kB` gzip.
- ForSuppliers route chunk after Batch #118: `59.73 kB` minified and `17.05 kB` gzip.
- GitHub PR #169 `Core Type And Build Gate` passed before merge in 10m36s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. For-suppliers CTA semantics status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
