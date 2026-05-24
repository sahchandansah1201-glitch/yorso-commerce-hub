# Prompt #122: Lovable Sync For Public CTA Semantics

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `dc2a3ca`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #122, then verify that
homepage and shared info/legal page CTAs render as single semantic links, not
nested link/button controls. Do not change buyer-first copy, public route SEO,
offer-card destinations, information page content, access gating, supplier
identity redaction, backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `dc2a3ca` or newer.
- PR #173: [codex] Batch #122 public CTA semantics.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  homepage offer cards must help buyers inspect market availability without
  creating confusing interactive targets.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, offer pages, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change homepage copy, offer-card destinations, information page content, route shell or SEO behavior.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics or Batch #121 offer detail CTA semantics.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/LiveOffers.tsx` uses `Button asChild` for the desktop `View all offers` CTA to `/offers`.
2. `src/components/landing/OfferCard.tsx` passes `interactive={false}` to `CertificationBadges` so certification chips inside clickable landing offer cards render as static proof chips.
3. `src/components/CertificationBadges.tsx` supports an `interactive` prop:
   - default `interactive=true` keeps existing button/dialog behavior everywhere else;
   - `interactive=false` renders static chips and does not mount the certification dialog.
4. `src/components/InfoPageLayout.tsx` uses `Button asChild` for the shared `Back to homepage` CTA to `/`.
5. `src/pages/PublicCtaSemantics.test.tsx` exists and checks homepage and info page nested-control regressions.
6. `e2e/public-cta-semantics.spec.ts` exists and checks:
   - homepage mobile around 390px has zero nested controls and zero horizontal overflow;
   - homepage desktop `View all offers` is a direct link;
   - `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press` and `/partners` have direct back links with zero nested controls and zero horizontal overflow.
7. `package.json` includes:
   - `smoke:e2e:public-cta-semantics`;
   - `smoke:e2e:public-cta-semantics:run`;
   - `e2e/public-cta-semantics.spec.ts` in `smoke:e2e:run`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #122 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/` renders in English on desktop and mobile.
- Confirm homepage `View all offers` links to `/offers` and is not `a > button`.
- Confirm landing offer cards link to offer detail pages and certification chips inside those cards are static proof chips, not child buttons.
- Confirm `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press` and `/partners` each expose `Back to homepage` as one direct link to `/`.
- Confirm:
  `document.querySelectorAll("a button, button a, a a, button button").length === 0`
  on `/` and on the shared info/legal routes above.
- Confirm no horizontal overflow around 390px on the checked routes.
- Confirm `/offers`, `/signin`, `/reset-password`, `/for-suppliers`, `/how-it-works` and `/offers/:id` behavior from Batches #117-#121 is unchanged.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-cta-semantics.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #122: `125.47 kB` minified and `20.80 kB` gzip.
- Entry chunk after Batch #122: `355.46 kB` minified and `114.15 kB` gzip.
- i18n-translations after Batch #122: `313.45 kB` minified and `98.69 kB` gzip.
- Index route chunk after Batch #122: `35.58 kB` minified and `10.05 kB` gzip.
- InfoPageLayout chunk after Batch #122: `1.16 kB` minified and `0.61 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 126 tests.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Homepage runtime status
5. Info/legal CTA semantics status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
