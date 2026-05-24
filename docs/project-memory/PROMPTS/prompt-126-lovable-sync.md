# Prompt #126: Lovable Sync For Public Skip-To-Main Target

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `c1ebd76`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #126, then verify that
public routes expose a reliable keyboard skip-to-main path and a stable
`main#main` target. Do not change public copy, visual layout, route behavior,
access gating, supplier identity redaction, backend APIs, Supabase settings or
data models.

Source of truth:
- GitHub `main`, commit `c1ebd76` or newer.
- PR #177: [codex] Batch #126 public skip-to-main target.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is keyboard scanability hardening, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier pages, how-it-works, blog, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change public route copy, CTA labels, link destinations, SEO ownership or visual styling.
- Do not change header visual styling, header links, language selector, notifications, auth controls or mobile menu behavior.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics, Batch #123 public input accessibility, Batch #124 public heading structure or Batch #125 public landmark labels.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/Header.tsx` supports:
   - `showSkipLink?: boolean`;
   - `mainId?: string`;
   - an opt-in skip link with text from `t.aria_skipToMain`;
   - click handling that focuses and scrolls the target and updates the URL hash to `#main`.
2. `src/components/landing/Header.landmarks.test.tsx` verifies the optional skip link in EN/RU/ES.
3. `src/i18n/translations.ts` includes EN/RU/ES `aria_skipToMain`.
4. `src/i18n/aria-tooltips-localized.ru.test.tsx` guards against English `Skip to main content` leaking into Russian UI.
5. Public route shells opt into the skip link and expose exactly one `main#main`, including:
   - `/`;
   - `/offers`;
   - `/offers/:id`;
   - `/suppliers`;
   - `/suppliers/:supplierId`;
   - `/how-it-works`;
   - `/for-suppliers`;
   - `/signin`;
   - `/reset-password`;
   - shared info/legal routes through `InfoPageLayout`;
   - `/blog`;
   - `/blog/:slug`;
   - `/404` / `NotFound`.
6. `e2e/public-skip-main-target.spec.ts` exists and checks:
   - exactly one `main#main`;
   - exactly one `Skip to main content` link;
   - zero `main:not(#main)`;
   - no horizontal overflow at mobile 390px and desktop 1024px;
   - activating the skip link moves focus to `main#main` and keeps the route with `#main`.
7. `package.json` includes:
   - `smoke:e2e:public-skip-main-target`;
   - `smoke:e2e:public-skip-main-target:run`;
   - `e2e/public-skip-main-target.spec.ts` in `smoke:e2e:run`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #126 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/`, `/offers`, `/offers/1`, `/suppliers`, `/suppliers/sup-no-001`, `/how-it-works`, `/for-suppliers`, `/signin`, `/reset-password`, `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press`, `/partners`, `/blog` and `/blog/atlantic-salmon-q1-price-pressure` render in English.
- Confirm each listed route has exactly one `main#main`.
- Confirm each listed route has one hidden-until-focused `Skip to main content` link.
- Confirm activating the skip link on `/` focuses `main#main` and updates the URL to `/#main`.
- Confirm there is no horizontal overflow at 390px.
- Confirm public page layout, copy, CTAs and route behavior are visually unchanged.
- Confirm Batch #125 public landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-skip-main-target.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #126: `126.51 kB` minified and `20.97 kB` gzip.
- Entry chunk after Batch #126: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #126: `314.40 kB` minified and `99.06 kB` gzip.
- Header chunk after Batch #126: `49.82 kB` minified and `14.01 kB` gzip.
- Index route chunk after Batch #126: `35.75 kB` minified and `10.11 kB` gzip.
- OfferDetail route chunk after Batch #126: `47.03 kB` minified and `12.27 kB` gzip.
- SupplierProfile route chunk after Batch #126: `59.95 kB` minified and `15.37 kB` gzip.
- Offers route chunk after Batch #126: `72.52 kB` minified and `18.72 kB` gzip.
- HowItWorks route chunk after Batch #126: `172.25 kB` minified and `47.11 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 219 tests.
- GitHub `Core Type And Build Gate` passed on PR #177 in 11m54s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public skip-to-main target status
5. Main landmark and mobile scanability status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
