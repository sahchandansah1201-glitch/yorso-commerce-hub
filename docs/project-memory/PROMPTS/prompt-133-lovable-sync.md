# Prompt #133: Lovable Sync For Public Breadcrumb Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `ca1438b`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #133, then verify the
public breadcrumb landmarks are localized on the audited public routes. This is
runtime accessibility and locale hardening for buyer trust, not a redesign.

Source of truth:
- GitHub `main`, commit `ca1438b` or newer.
- PR #185: [codex] Batch #133 public breadcrumb locale a11y.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content remains a trust/supply
  mechanism; do not shift the primary story toward suppliers.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, offer detail, supplier directory, supplier
  profile, how-it-works, blog, auth pages, registration pages, admin pages or
  shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections
  or marketing filler.
- Do not change supplier data, offer data, access gating, supplier identity
  redaction, exact-price locks, CTA labels, CTA destinations, SEO, analytics
  hooks, backend APIs, Supabase settings, database schema, account/admin
  behavior or route structure.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#132 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/Suppliers.tsx`:
   - supplier directory breadcrumb nav uses `aria-label={t.aria_breadcrumb}`;
   - no hardcoded `aria-label="Breadcrumb"` remains on the page breadcrumb.
2. `src/pages/Blog.tsx`:
   - blog index breadcrumb nav uses `aria-label={t.aria_breadcrumb}`;
   - no hardcoded `Breadcrumb` navigation label remains.
3. `src/pages/BlogArticle.tsx`:
   - blog article breadcrumb nav uses `aria-label={t.aria_breadcrumb}`;
   - no hardcoded `Breadcrumb` navigation label remains.
4. Tests and smoke wiring:
   - `src/i18n/aria-tooltips-localized.ru.test.tsx` covers RU breadcrumb
     landmark labels for Suppliers, Blog and BlogArticle;
   - `e2e/public-breadcrumb-locale-a11y.spec.ts` covers `/suppliers`, `/blog`
     and `/blog/atlantic-salmon-q1-price-pressure` at 390px;
   - `package.json` includes `smoke:e2e:public-breadcrumb-locale-a11y`,
     `smoke:e2e:public-breadcrumb-locale-a11y:run` and the spec in
     `smoke:e2e:run`.
5. `docs/backend/production-scale-baseline.md` includes Batch #133 and documents
   that this change adds no backend reads/writes, queues, polling, database
   changes or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/suppliers` renders in Russian at mobile 390px and exposes a
  navigation landmark named `Хлебные крошки`.
- Confirm `/blog` renders in Russian at mobile 390px and exposes a navigation
  landmark named `Хлебные крошки`.
- Confirm `/blog/atlantic-salmon-q1-price-pressure` renders in Russian at
  mobile 390px and exposes a navigation landmark named `Хлебные крошки`.
- Confirm no visible navigation landmark on those routes is named `Breadcrumb`
  when RU locale is active.
- Confirm there is no horizontal overflow at 390px.
- Confirm supplier directory search, sorting, pagination and profile links are
  unchanged.
- Confirm blog index filters, topic chips, article links, article route,
  in-page anchors and SEO behavior are unchanged.
- Confirm access gating, supplier identity redaction, exact-price lock,
  route-owned SEO, analytics and buyer-first public copy are unchanged.
- Confirm compact Pulse badges still follow the current contract: visible
  activity count, estimate disclosure in `aria-label` and `title`, no visible
  compact estimate chip.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm Batch #132 public offer locale/a11y hardening, Batch #131 public Pulse
  disclosure, Batch #130 supplier profile mobile accessibility, Batch #129
  offer detail mobile accessibility, Batch #128 registration accessibility,
  Batch #127 blog tap targets, Batch #126 skip-to-main behavior and Batch #125
  landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/i18n/aria-tooltips-localized.ru.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-breadcrumb-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #133: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #133: `355.47 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #133: `320.54 kB` minified and `100.99 kB` gzip.
- Suppliers route chunk after Batch #133: `36.34 kB` minified and `9.06 kB` gzip.
- Blog route chunk after Batch #133: `19.10 kB` minified and `4.84 kB` gzip.
- BlogArticle route chunk after Batch #133: `20.72 kB` minified and `5.49 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 242 tests.
- GitHub `Core Type And Build Gate` passed on PR #185 after one rerun. The
  initial failed run was an existing `suppliers-directory-paging` flake; the
  rerun passed the same browser smoke suite without code changes.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public breadcrumb locale/a11y status
5. Supplier/blog route behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
