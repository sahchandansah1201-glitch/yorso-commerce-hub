# Prompt #115: Lovable Sync For Catalog Locale Hardening

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `eec49ec`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #115, then verify that
the catalog locale hardening is present without changing product behavior,
public copy outside this fix, visual system, routes, auth, data models,
Supabase settings or backend behavior.

Source of truth:
- GitHub `main`, commit `eec49ec` or newer.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier UI should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change buyer access gating, supplier identity redaction or price-lock rules.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove the public route SEO work from Batch #111, the mobile UX fixes from Batch #110 or the font-loading cleanup from Batch #114.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/lib/catalog-display-labels.ts` exists and maps legacy redacted price labels into the active locale display label.
2. `src/components/catalog/CatalogOfferRow.tsx` renders locked desktop catalog price and analytics trigger copy from the active locale.
3. `src/components/catalog/MobileOfferCard.tsx` renders locked mobile catalog price and trend analytics labels from the active locale.
4. `src/i18n/translations.ts` includes EN/RU/ES keys for:
   - catalog row analytics title;
   - show/hide labels;
   - show/hide labels with product name;
   - closed/open screen-reader hints;
   - analytics region heading.
5. Regression tests exist:
   - `src/lib/catalog-display-labels.test.ts`;
   - `src/components/catalog/CatalogOfferRow.locale.test.tsx`;
   - updated `CatalogOfferRow.analyticsA11y.test.tsx`;
   - updated `MobileOfferCard.analyticsToggle.test.tsx`.
6. `docs/backend/production-scale-baseline.md` includes the Batch #115 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/offers` renders in English on desktop and mobile.
- Confirm English `/offers` no longer shows these Russian strings in visible or accessible catalog controls:
  - `Цена по запросу`
  - `Аналитика цен`
  - `Показать аналитику`
  - `Разворачивает`
- Confirm locked price labels read as active-locale copy:
  - English desktop: `Exact price locked per kg`;
  - English mobile: `Exact price locked`.
- Confirm analytics controls read as active-locale copy:
  - desktop row trigger: `Price & market analytics`;
  - mobile trend trigger aria/title: `Show price analytics`.
- Confirm `/offers` at 390px has no horizontal overflow.
- Confirm buyer access gating still hides exact price and supplier identity before approval.
- Confirm public pages keep the buyer-first story: buyers compare offers, evaluate supplier trust, request access and understand procurement workflow.
- Confirm supplier-facing content remains a trust/supply mechanism, not the primary narrative.
- Confirm the route chunk error boundary from Batch #113 is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/lib/catalog-display-labels.test.ts src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/catalog/CatalogOfferRow.analyticsA11y.test.tsx src/components/catalog/MobileOfferCard.analyticsToggle.test.tsx`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from GitHub validation:
- CSS bundle after Batch #115: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #115: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #115: `313.45 kB` minified and `98.69 kB` gzip.
- GitHub PR #166 `Core Type And Build Gate` passed before merge.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Catalog locale hardening status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
