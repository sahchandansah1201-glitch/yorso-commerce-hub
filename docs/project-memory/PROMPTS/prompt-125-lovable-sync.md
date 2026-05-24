# Prompt #125: Lovable Sync For Public Landmark Labels

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `7196cc8`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #125, then verify that
visible public navigation and complementary landmarks have accessible names.
Do not change public copy, visual layout, blog content, how-it-works narrative,
header links, mobile menu behavior, access gating, supplier identity redaction,
backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `7196cc8` or newer.
- PR #176: [codex] Batch #125 public landmark labels.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is semantic landmark hardening, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier pages, how-it-works, blog, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change header link labels, link destinations, mobile menu behavior or header visual styling.
- Do not change how-it-works buyer CTAs, supplier trust mechanism, proof blocks or copy.
- Do not change blog article/category content, article links, newsletter behavior or sidebar visuals.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics, Batch #123 public input accessibility or Batch #124 public heading structure.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/Header.tsx` labels:
   - desktop nav with `aria-label={t.aria_mainNavigation}`;
   - open mobile nav with `aria-label={t.aria_mobileNavigation}`.
2. `src/components/landing/Header.landmarks.test.tsx` verifies named desktop and mobile Header navigation landmarks in EN/RU/ES.
3. `src/pages/HowItWorks.tsx` labels the supplier trust infrastructure aside through `aria-labelledby="how-it-works-supplier-trust-heading"`.
4. `src/components/how-it-works/BusinessOutcomes.tsx` labels the supplier outcomes aside through `aria-labelledby="business-outcomes-supplier-heading"`.
5. `src/pages/Blog.tsx` labels the blog sidebar with `t.blog_sidebarAria`.
6. `src/pages/BlogArticle.tsx` labels the article tools aside with `t.blog_articleAsideAria`.
7. `src/i18n/translations.ts` includes EN/RU/ES keys:
   - `aria_mainNavigation`;
   - `aria_mobileNavigation`;
   - `blog_sidebarAria`;
   - `blog_articleAsideAria`.
8. `src/i18n/aria-tooltips-localized.ru.test.tsx` guards against English main/mobile navigation labels leaking into Russian UI.
9. `e2e/public-landmark-labels.spec.ts` exists and checks:
   - visible `nav`, `aside`, `[role="navigation"]` and `[role="complementary"]` landmarks have `aria-label` or `aria-labelledby`;
   - mobile 390px and desktop 1024px public routes are covered;
   - the open mobile menu exposes a named `Mobile navigation` landmark.
10. `package.json` includes:
   - `smoke:e2e:public-landmark-labels`;
   - `smoke:e2e:public-landmark-labels:run`;
   - `e2e/public-landmark-labels.spec.ts` in `smoke:e2e:run`.
11. `docs/backend/production-scale-baseline.md` includes the Batch #125 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/`, `/offers`, `/suppliers`, `/how-it-works`, `/for-suppliers`, `/signin`, `/reset-password`, `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press`, `/partners`, `/blog` and `/blog/atlantic-salmon-q1-price-pressure` render in English.
- Confirm visible public `nav` and `aside` landmarks are named at mobile width around 390px and desktop width around 1024px.
- Confirm opening the mobile menu on `/` exposes a named `Mobile navigation` landmark.
- Confirm header links and mobile menu open/close behavior are unchanged.
- Confirm `/how-it-works` buyer narrative, request CTAs and supplier trust sections are visually unchanged.
- Confirm `/blog` and `/blog/atlantic-salmon-q1-price-pressure` content, links and sidebars are visually unchanged.
- Confirm `/`, `/offers`, `/suppliers`, `/signin`, `/reset-password`, `/for-suppliers`, `/how-it-works`, `/offers/:id` and `/suppliers/:id` behavior from Batches #117-#124 is unchanged.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-landmark-labels.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #125: `125.47 kB` minified and `20.80 kB` gzip.
- Entry chunk after Batch #125: `355.46 kB` minified and `114.18 kB` gzip.
- i18n-translations after Batch #125: `314.26 kB` minified and `98.98 kB` gzip.
- Header chunk after Batch #125: `49.15 kB` minified and `13.71 kB` gzip.
- Blog route chunk after Batch #125: `18.58 kB` minified and `4.64 kB` gzip.
- BlogArticle route chunk after Batch #125: `20.26 kB` minified and `5.34 kB` gzip.
- HowItWorks route chunk after Batch #125: `172.22 kB` minified and `47.09 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 176 tests.
- GitHub `Core Type And Build Gate` passed on PR #176 in 11m52s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public landmark label status
5. Header/mobile navigation status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
