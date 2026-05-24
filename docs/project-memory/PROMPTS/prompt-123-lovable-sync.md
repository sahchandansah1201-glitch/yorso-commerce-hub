# Prompt #123: Lovable Sync For Public Input Accessibility

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `5105f3c`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #123, then verify that
homepage and public sign-in inputs have programmatic accessible names. Do not
change homepage search behavior, auth runtime behavior, buyer-first public copy,
visual layout, public route SEO, access gating, supplier identity redaction,
backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `5105f3c` or newer.
- PR #174: [codex] Batch #123 public input accessibility.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is an accessibility hardening pass, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, auth pages, offer pages, supplier pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change homepage search routing, sign-in submit handlers, forgot-password behavior, phone input value handling or buyer-session behavior.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics or Batch #122 public CTA semantics.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/Hero.tsx` gives the homepage offer search input:
   - a stable `id="home-offer-search"`;
   - a sr-only label from the active locale.
2. `src/i18n/translations.ts` includes EN/RU/ES `hero_searchLabel`.
3. `src/pages/SignIn.tsx` connects visible labels to:
   - `signin-email`;
   - `signin-phone`;
   - `signin-password`;
   - `signin-forgot-email`.
4. `src/components/registration/CountryPhoneInput.tsx` supports:
   - `inputId`;
   - optional input/country/search aria-label overrides;
   - a named country selector;
   - a named country search input;
   - a named mobile close control.
5. `src/pages/PublicInputA11y.test.tsx` exists and checks homepage search, sign-in email mode, sign-in phone mode and forgot-password email labels.
6. `e2e/public-input-a11y.spec.ts` exists and checks:
   - homepage search is reachable as `Search seafood offers`;
   - `/signin` email and phone modes expose named fields;
   - forgot-password email remains named;
   - checked mobile states have zero visible unnamed controls and zero horizontal overflow.
7. `package.json` includes:
   - `smoke:e2e:public-input-a11y`;
   - `smoke:e2e:public-input-a11y:run`;
   - `e2e/public-input-a11y.spec.ts` in `smoke:e2e:run`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #123 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/` renders in English on desktop and mobile.
- Confirm the homepage search input is reachable by label `Search seafood offers`.
- Confirm submitting homepage search still routes to `/offers` or `/offers?q=...`.
- Confirm `/signin` email mode exposes named `Email` and `Password` fields.
- Confirm `/signin` phone mode exposes named `Phone number` and `Password` fields.
- Confirm forgot-password mode exposes a named `Email` field.
- Confirm:
  `document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"]')`
  has no visible unnamed controls on `/` and the checked `/signin` states.
- Confirm no horizontal overflow around 390px on `/` and `/signin`.
- Confirm `/offers`, `/suppliers`, `/for-suppliers`, `/how-it-works`, `/offers/:id`, `/signin` and `/reset-password` behavior from Batches #117-#122 is unchanged.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-input-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #123: `125.47 kB` minified and `20.80 kB` gzip.
- Entry chunk after Batch #123: `355.46 kB` minified and `114.15 kB` gzip.
- i18n-translations after Batch #123: `313.60 kB` minified and `98.72 kB` gzip.
- Index route chunk after Batch #123: `35.70 kB` minified and `10.09 kB` gzip.
- SignIn route chunk after Batch #123: `9.16 kB` minified and `2.81 kB` gzip.
- CountryPhoneInput chunk after Batch #123: `8.12 kB` minified and `2.95 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 129 tests.
- GitHub `Core Type And Build Gate` passed on PR #174 in 11m31s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Homepage input accessibility status
5. Public auth input accessibility status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
