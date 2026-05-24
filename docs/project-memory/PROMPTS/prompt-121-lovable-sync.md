# Prompt #121: Lovable Sync For Offer Detail CTA Semantics

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `809d35f`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #121, then verify that
offer detail CTAs render as single semantic links or buttons, not nested
link/button controls. Do not change offer detail copy, supplier access logic,
price locks, supplier identity redaction, route shell, backend APIs, Supabase
settings or data models.

Source of truth:
- GitHub `main`, commit `809d35f` or newer.
- PR #172: [codex] Batch #121 offer detail CTA semantics.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Offer detail is a buyer decision surface:
  product context, access request, supplier trust and price-lock behavior must
  stay clear and trustworthy.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, offer pages, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change offer detail copy, product data, access request behavior, return-to-catalog behavior or sticky CTA behavior.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics or Batch #120 auth CTA semantics.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/OfferDetail.tsx` uses `Button asChild` for offer detail CTAs that navigate to:
   - `/offers` in the load-error fallback;
   - `/offers` in the not-found fallback;
   - `/register` in the locked anonymous access banner;
   - `#offer-supplier-access` in the registered-locked access banner;
   - `/register` in the sticky mobile anonymous CTA;
   - `#offer-supplier-access` in the sticky mobile registered-locked CTA.
2. `src/components/offer-detail/OfferSummary.tsx` uses `Button asChild` for the anonymous price-lock CTA to `/register`.
3. `e2e/offer-detail-cta-semantics.spec.ts` exists and checks mobile `/offers/:id` at 390x844:
   - anonymous buyer sees Register Free, Sign up to view exact prices and Register to Contact Supplier as links;
   - registered locked buyer gets two Open access panel hash links and lands on `#offer-supplier-access`;
   - unknown offer fallback exposes Browse all offers as one semantic link;
   - zero nested `a button` / `button a` controls;
   - no horizontal overflow.
4. `package.json` includes `e2e/offer-detail-cta-semantics.spec.ts` in:
   - `smoke:e2e:offer-detail-cta-semantics:run`;
   - `smoke:e2e:run`.
5. `docs/backend/production-scale-baseline.md` includes the Batch #121 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/offers/00000000-0000-0000-0000-000000000001` renders in English on desktop and mobile.
- On mobile around 390px, anonymous mode should show:
  - product context;
  - Register Free link;
  - Sign up to view exact prices link;
  - Register to Contact Supplier sticky link;
  - no supplier identity leakage.
- On mobile around 390px, registered-locked mode should show:
  - Open access panel links;
  - clicking the access link lands on `#offer-supplier-access`;
  - supplier access request panel remains available;
  - no supplier identity or exact price leakage.
- Confirm unknown offer route `/offers/00000000-0000-0000-0000-000000009999` shows Browse all offers as a link.
- Confirm offer detail has no nested interactive CTA controls:
  `document.querySelectorAll("a button, button a").length === 0`
- Confirm offer detail has no horizontal overflow at mobile width.
- Confirm `/offers` catalog, `/signin`, `/reset-password`, `/for-suppliers` and `/how-it-works` behavior from Batches #117-#120 is unchanged.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/offer-detail-cta-semantics.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local and GitHub validation:
- CSS bundle after Batch #121: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #121: `355.46 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #121: `313.45 kB` minified and `98.69 kB` gzip.
- OfferDetail route chunk after Batch #121: `46.93 kB` minified and `12.26 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 114 tests.
- GitHub PR #172 `Core Type And Build Gate` passed on rerun in 10m56s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Offer detail runtime status
5. Offer detail CTA semantics status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
