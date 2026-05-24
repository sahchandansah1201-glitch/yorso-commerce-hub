# Prompt #113: Lovable Sync For Batch #113

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `9860aa3`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #113, then verify that
the route chunk error boundary is present without changing the product
experience, public copy, visual system, routes, auth, data models, Supabase
settings or backend behavior.

Source of truth:
- GitHub `main`, commit `9860aa3` or newer.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier UI should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking loading screens, decorative cards, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the public route SEO work from Batch #111 or the mobile UX fixes from Batch #110.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/routing/RouteChunkErrorBoundary.tsx` exists.
2. `src/App.tsx` imports `RouteChunkErrorBoundary`.
3. The lazy route shell is wrapped as:
   - `<RouteChunkErrorBoundary>`
   - `<Suspense fallback={<RouteFallback />}>`
   - `<Routes>...</Routes>`
4. Global providers, `LegacyOfferRedirect`, legacy redirects and `SupplierApprovalNotifier` remain eager.
5. The fallback state uses `data-testid="route-chunk-error"`.
6. The fallback gives the user two actions:
   - `Reload page`
   - `Go back`
7. The fallback copy says the screen itself does not change the YORSO session, access requests or workspace data.
8. `src/components/routing/RouteChunkErrorBoundary.test.tsx` exists and covers normal render plus fallback recovery.
9. `src/test/app-route-code-splitting.test.ts` still guards lazy route loading and now also guards error-boundary wiring.
10. `docs/backend/production-scale-baseline.md` includes the Batch #113 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm these routes still render:
  - `/`
  - `/offers`
  - `/suppliers`
  - `/suppliers/sup-no-001`
  - `/blog`
  - `/for-suppliers`
  - `/account/personal`
- Confirm `/suppliers` at 375px has no horizontal overflow.
- Confirm public pages keep the buyer-first story: buyers compare offers, evaluate supplier trust, request access and understand the procurement workflow.
- Confirm supplier-facing content remains a trust/supply mechanism, not the primary narrative.
- If Lovable can run tests, run or confirm the route chunk boundary test and app route code-splitting guard.
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from GitHub validation:
- Entry chunk after Batch #113: `355.46 kB` minified and `114.16 kB` gzip.
- `i18n-translations` chunk: `311.45 kB` minified and `98.15 kB` gzip.
- GitHub PR #164 `Core Type And Build Gate` passed before merge.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Route chunk error boundary status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
