# Prompt #117: Lovable Sync For Offers Request Anchor

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `c2c5ff3`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #117, then verify that
the /how-it-works request-access CTAs land on a real /offers request section
without changing product behavior, access gating, supplier redaction, route
shell, visual system, backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `c2c5ff3` or newer.
- PR #168: [codex] Batch #117 offers request anchor.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change buyer access gating, supplier identity redaction or price-lock rules.
- Do not change catalog data, offer sorting, filtering, pagination or supplier search.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening or Batch #116 offers proof anchor fallback.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/Offers.tsx` exposes a stable `id="request"` anchor around the existing catalog access/value strip.
2. `/offers` catalog URL normalization preserves the active `location.hash` while it rewrites search params for filters, sort, rows and page state.
3. `/offers` runs a hash-scroll effect after catalog render so direct `/offers#request` entry lands on the request/value strip.
4. `src/pages/HowItWorks.tsx` uses a structured React Router target for the hero request-access CTA: `{ pathname: "/offers", hash: "#request" }`.
5. `src/components/how-it-works/FinalCTA.tsx` uses the same structured target for the final buyer request-access CTA.
6. `e2e/how-it-works-request-anchor.spec.ts` exists and covers:
   - the `/how-it-works` hero request CTA landing on `/offers#request`;
   - direct `/offers#request` entry preserving the hash through catalog URL normalization.
7. `package.json` includes `e2e/how-it-works-request-anchor.spec.ts` in `smoke:e2e:run`.
8. `docs/backend/production-scale-baseline.md` includes the Batch #117 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/how-it-works` renders in English on desktop and mobile.
- On mobile around 390px:
  - tap the hero `Request access to a supplier` CTA;
  - confirm the URL is `/offers#request`;
  - confirm the catalog access/value strip is visible after the route transition.
- Directly open `/offers#request` on mobile around 390px:
  - confirm the URL still includes `#request` after catalog search params normalize;
  - confirm the request/value strip is visible.
- Confirm `/offers` still has no horizontal overflow at mobile width.
- Confirm buyer access gating still hides exact price and supplier identity before approval.
- Confirm Batch #116 proof-strip behavior is still present: `Procurement intelligence` falls back to visible offer evidence on mobile and `Document readiness` lands on offer cards.
- Confirm Batch #115 locale hardening is still present: English `/offers` must not show `Цена по запросу`, `Аналитика цен`, `Показать аналитику` or `Разворачивает`.
- Confirm public pages keep the buyer-first story: buyers compare offers, evaluate supplier trust, request access and understand procurement workflow.
- Confirm supplier-facing content remains a trust/supply mechanism.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/how-it-works-request-anchor.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from GitHub validation:
- CSS bundle after Batch #117: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #117: `355.46 kB` minified and `114.15 kB` gzip.
- i18n-translations after Batch #117: `313.45 kB` minified and `98.69 kB` gzip.
- Offers route chunk after Batch #117: `72.49 kB` minified and `18.71 kB` gzip.
- HowItWorks route chunk after Batch #117: `172.03 kB` minified and `47.05 kB` gzip.
- GitHub PR #168 `Core Type And Build Gate` passed before merge in 10m54s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Offers request anchor status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
