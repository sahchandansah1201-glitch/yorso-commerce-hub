# Prompt #138: Lovable Sync For Public Info Route SEO

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `7eea5ce`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #138, then verify that
the shared public info/legal trust routes own localized route SEO metadata.
This is buyer trust/legal SEO structure hardening, not a visual redesign.

Source of truth:
- GitHub `main`, commit `7eea5ce` or newer.
- PR #190: [codex] Batch #138 public info route SEO.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers, suppliers,
  partners and legal/compliance reviewers.
- Narrative priority: buyer-first. Supplier content remains a trust/supply
  mechanism; do not shift the primary story toward suppliers.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, offer detail, supplier directory, supplier
  profile, how-it-works, blog, auth pages, registration pages, admin pages or
  shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections
  or marketing filler.
- Do not change visible info/legal page copy, CTA destinations, header/footer
  behavior, skip links, landmarks, route structure, access gating, supplier
  identity redaction, exact-price locks, analytics hooks, backend APIs,
  Supabase settings, database schema, account/admin behavior or offer/supplier
  data.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#137 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/InfoPageLayout.tsx`:
   - imports SEO helpers and shared public route SEO image/locale helpers;
   - accepts `description`, `canonicalPath` and optional `schemaType`;
   - applies route-owned localized title, description, canonical URL,
     OG/Twitter metadata and JSON-LD;
   - restores global SEO and previous canonical state on unmount;
   - preserves `<Header showSkipLink />`, `<main id="main">`, the shared
     `Back to homepage` link and visual layout.
2. Info/legal pages:
   - `src/pages/About.tsx` passes `description={t.info_about_intro}`,
     `canonicalPath="/about"` and `schemaType="AboutPage"`;
   - `src/pages/Contact.tsx` passes `description={t.info_contact_intro}`,
     `canonicalPath="/contact"` and `schemaType="ContactPage"`;
   - `src/pages/Terms.tsx`, `Privacy.tsx`, `Cookies.tsx`, `GDPR.tsx`,
     `AntiFraud.tsx`, `Careers.tsx`, `Press.tsx` and `Partners.tsx` pass their
     existing localized intro copy as `description` and the correct canonical
     path.
3. `src/pages/InfoPageSeo.test.tsx`:
   - covers all 10 info/legal routes;
   - verifies title, description, canonical URL, OG/Twitter metadata and
     JSON-LD;
   - verifies RU direct entry uses localized route metadata, not the global
     site metadata fallback.
4. `src/i18n/locale-document-meta-ru.test.tsx`:
   - now covers only global-meta routes without route-owned SEO;
   - no longer treats info/legal routes as generic global metadata pages.
5. `e2e/public-info-route-seo.spec.ts`:
   - covers `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`,
     `/anti-fraud`, `/careers`, `/press`, `/partners` at 390px;
   - verifies route-owned title, description, canonical URL, social metadata,
     JSON-LD, direct back-to-home link, zero nested controls and zero
     horizontal overflow;
   - verifies RU direct entry on `/anti-fraud` keeps localized route SEO.
6. `package.json`:
   - includes `smoke:e2e:public-info-route-seo`;
   - includes `smoke:e2e:public-info-route-seo:run`;
   - includes `e2e/public-info-route-seo.spec.ts` in `smoke:e2e:run`.
7. `docs/backend/production-scale-baseline.md`:
   - includes Batch #138 and documents that this frontend-only metadata
     hardening adds no backend reads/writes, queues, polling, database changes
     or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`,
  `/anti-fraud`, `/careers`, `/press` and `/partners` render unchanged
  visually.
- Confirm each route sets a route-owned title in the form `{page title} | YORSO`.
- Confirm each route sets a canonical URL matching its path.
- Confirm each route sets `meta[name="description"]` from its localized intro
  copy, not the generic global site description.
- Confirm each route has `meta[name="x-route-seo"]`.
- Confirm each route sets OG/Twitter title and description.
- Confirm each route has one `script[data-jsonld="info-page-*"]`.
- Confirm `/about` uses `AboutPage` JSON-LD and `/contact` uses `ContactPage`
  JSON-LD; the other info/legal routes use `WebPage`.
- Confirm direct RU entry on `/anti-fraud` uses:
  `Политика противодействия мошенничеству | YORSO`,
  localized RU description and `og:locale=ru_RU`, not the generic global RU
  metadata fallback.
- Confirm the shared `Back to homepage` CTA remains a single direct link to `/`.
- Confirm there is no horizontal overflow at 390px on all checked info routes.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm Batch #137 offer-detail decision support, Batch #136 supplier trust,
  Batch #135 supplier profile logo, Batch #134 supplier directory locale,
  Batch #133 breadcrumbs, Batch #132 offer locale, Batch #131 Pulse disclosure,
  Batch #130 supplier profile mobile accessibility, Batch #129 offer detail
  mobile accessibility, Batch #128 registration accessibility, Batch #127 blog
  tap targets, Batch #126 skip-to-main behavior and Batch #125 landmark labels
  are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/pages/InfoPageSeo.test.tsx src/i18n/locale-document-meta-ru.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-info-route-seo.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #138: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #138: `355.53 kB` minified and `114.18 kB` gzip.
- i18n-translations after Batch #138: `340.35 kB` minified and `106.73 kB`
  gzip.
- InfoPageLayout chunk after Batch #138: `2.13 kB` minified and `1.13 kB`
  gzip.
- Info page chunks after Batch #138: `1.19-1.80 kB` minified.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 261 tests.
- GitHub `Core Type And Build Gate` passed on PR #190 in 12m42s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public info/legal route SEO status
5. Info route mobile/CTA semantics status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
