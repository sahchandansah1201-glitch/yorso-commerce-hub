# Prompt #127: Lovable Sync For Public Blog Mobile Tap Targets

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `3aed8dd`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #127, then verify that
the public insights/blog surfaces keep mobile-safe tap targets at 390px. Do not
change public copy, article content, routes, SEO metadata, buyer narrative,
access gating, supplier identity redaction, backend APIs, Supabase settings or
data models.

Source of truth:
- GitHub `main`, commit `3aed8dd` or newer.
- PR #178: [codex] Batch #127 public blog mobile tap targets.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is mobile scanability hardening for insights routes, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier pages, how-it-works, blog, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change public route copy, article copy, CTA labels, link destinations, SEO ownership or visual styling beyond the synced tap-target classes.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics, Batch #123 public input accessibility, Batch #124 public heading structure, Batch #125 public landmark labels or Batch #126 skip-to-main target.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/Blog.tsx` defines mobile target helper classes and applies them to:
   - the Home breadcrumb link, with `data-blog-mobile-target="breadcrumb-home"`;
   - the featured article `Read article` action, with `data-blog-mobile-target="featured-read-article"`;
   - category filter chips, with `data-blog-mobile-target="filter-chip"`;
   - article-card `Read article` links, with `data-blog-mobile-target="read-article"`;
   - popular topic chips, with `data-blog-mobile-target="topic-chip"`;
   - the `See all updates` action, with `data-blog-mobile-target="see-all-updates"`.
2. `src/pages/BlogArticle.tsx` defines mobile target helper classes and applies them to:
   - Home and Blog breadcrumb links, with `article-breadcrumb-home` and `article-breadcrumb-blog` markers;
   - the mobile TOC summary, with `data-blog-mobile-target="mobile-toc-summary"`;
   - mobile TOC links, with `data-blog-mobile-target="mobile-toc-link"`;
   - FAQ summaries and the back-to-index CTA through `min-h-11`;
   - desktop TOC links keep normal behavior and gain a small rounded/py target improvement.
3. `e2e/blog-mobile-tap-targets.spec.ts` exists and checks `/blog` and
   `/blog/atlantic-salmon-q1-price-pressure` at 390px:
   - every `[data-blog-mobile-target]` is visible;
   - every marked target is at least 44px wide and 44px tall;
   - there is no horizontal overflow.
4. `package.json` includes:
   - `smoke:e2e:blog-mobile-tap-targets`;
   - `smoke:e2e:blog-mobile-tap-targets:run`;
   - `e2e/blog-mobile-tap-targets.spec.ts` in `smoke:e2e:run`.
5. `docs/backend/production-scale-baseline.md` includes the Batch #127 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/blog` and `/blog/atlantic-salmon-q1-price-pressure` render in English at mobile 390px.
- Confirm blog filter chips, topic chips, read links, breadcrumbs and article mobile TOC links are easy to tap and do not overlap neighboring content.
- Confirm every `[data-blog-mobile-target]` on those two routes has a box of at least 44px by 44px at 390px.
- Confirm there is no horizontal overflow at 390px.
- Confirm blog/article copy, article content, route behavior, breadcrumbs, filters, topic interactions, in-page TOC anchors and SEO metadata are unchanged.
- Confirm Batch #126 skip-to-main behavior is still present.
- Confirm Batch #125 public landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/blog-mobile-tap-targets.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #127: `126.67 kB` minified and `20.99 kB` gzip.
- Entry chunk after Batch #127: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #127: `314.40 kB` minified and `99.06 kB` gzip.
- Blog route chunk after Batch #127: `19.10 kB` minified and `4.83 kB` gzip.
- BlogArticle route chunk after Batch #127: `20.71 kB` minified and `5.48 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 221 tests.
- GitHub `Core Type And Build Gate` passed on PR #178 in 12m16s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public blog mobile tap-target status
5. Blog/article mobile scanability status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
