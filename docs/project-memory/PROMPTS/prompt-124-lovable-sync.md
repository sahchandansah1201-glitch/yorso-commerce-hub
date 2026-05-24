# Prompt #124: Lovable Sync For Public Heading Structure

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `fdaf76a`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #124, then verify that
public routes have a sequential heading outline. Do not change public copy,
visual layout, footer link destinations, supplier directory behavior, access
gating, supplier identity redaction, backend APIs, Supabase settings or data
models.

Source of truth:
- GitHub `main`, commit `fdaf76a` or newer.
- PR #175: [codex] Batch #124 public heading structure.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is semantic heading structure hardening, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier pages, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change footer link labels, link destinations, footer analytics or footer visual styling.
- Do not change supplier directory search, sort, page-size, pagination, selection, profile links or API/fallback behavior.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics or Batch #123 public input accessibility.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/Footer.tsx` renders footer columns as named `<nav aria-label="...">` groups, with visible `<p>` labels instead of H4 page headings.
2. `src/components/landing/Footer.test.tsx` verifies the Company footer group remains present, contains `/for-suppliers`, and no longer exposes the Company label as a page heading.
3. `src/pages/Suppliers.tsx` adds `aria-labelledby="supplier-directory-results-heading"` to the results section and an H2 with id `supplier-directory-results-heading`.
4. `src/i18n/translations.ts` includes EN/RU/ES `suppliersPage_resultsHeading`.
5. `src/pages/Suppliers.test.tsx` verifies the `Supplier results` H2 exists before supplier rows.
6. `e2e/public-heading-structure.spec.ts` exists and checks:
   - `/`, `/offers`, `/suppliers`, `/how-it-works`, `/for-suppliers`, `/signin` and `/reset-password` keep sequential heading outlines at 390px;
   - footer contributes zero H1-H6 headings;
   - `/suppliers` places supplier rows under the `Supplier results` H2.
7. `package.json` includes:
   - `smoke:e2e:public-heading-structure`;
   - `smoke:e2e:public-heading-structure:run`;
   - `e2e/public-heading-structure.spec.ts` in `smoke:e2e:run`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #124 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/`, `/offers`, `/suppliers`, `/how-it-works`, `/for-suppliers`, `/signin` and `/reset-password` render in English on mobile around 390px.
- Confirm those routes have no heading level skips.
- Confirm the footer has no `footer h1`, `footer h2`, `footer h3`, `footer h4`, `footer h5` or `footer h6`.
- Confirm footer columns are still visible and still grouped as Platform, Company and Legal navigation groups.
- Confirm the Company footer group still contains the `/for-suppliers` link and the Platform group does not duplicate that link.
- Confirm `/suppliers` heading outline begins `H1 Seafood suppliers`, `H2 Supplier results`, then H3 supplier result cards.
- Confirm supplier directory search, filters, sorting, page-size, pagination, selected-supplier preview and supplier profile links still work.
- Confirm `/`, `/offers`, `/suppliers`, `/signin`, `/reset-password`, `/for-suppliers`, `/how-it-works` and `/offers/:id` behavior from Batches #117-#123 is unchanged.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-heading-structure.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #124: `125.47 kB` minified and `20.80 kB` gzip.
- Entry chunk after Batch #124: `355.46 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #124: `313.75 kB` minified and `98.77 kB` gzip.
- Footer chunk after Batch #124: `2.33 kB` minified and `0.86 kB` gzip.
- Suppliers route chunk after Batch #124: `36.32 kB` minified and `9.05 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 137 tests.
- GitHub `Core Type And Build Gate` passed on PR #175 in 11m28s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public heading structure status
5. Supplier directory heading status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
