# Prompt #114: Lovable Sync For Font Loading Cleanup

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `df5b66f`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #114, then verify that
the font-loading cleanup is present without changing the product experience,
public copy, visual system, routes, auth, data models, Supabase settings or
backend behavior.

Source of truth:
- GitHub `main`, commit `df5b66f` or newer.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier UI should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove the public route SEO work from Batch #111 or the mobile UX fixes from Batch #110.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/index.css` no longer starts with a Google Fonts CSS `@import`.
2. `src/index.css` still keeps the existing typography contract:
   - body copy uses `Inter`, `system-ui`, `sans-serif`;
   - headings use `Plus Jakarta Sans`, `system-ui`, `sans-serif`.
3. `index.html` includes document-head font loading:
   - preconnect to `https://fonts.googleapis.com`;
   - preconnect to `https://fonts.gstatic.com` with `crossorigin`;
   - stylesheet request for `Plus Jakarta Sans` weights `400,500,600,700,800`;
   - stylesheet request for `Inter` weights `400,500,600`;
   - `display=swap`.
4. `src/test/font-loading.test.ts` exists and guards the no-CSS-import loading path plus the body/heading font contract.
5. `docs/backend/production-scale-baseline.md` includes the Batch #114 10,000 concurrent-user capacity review.

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
- Confirm the route chunk error boundary from Batch #113 is still present.
- If Lovable can run tests, run or confirm `src/test/font-loading.test.ts`.
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from GitHub validation:
- CSS bundle after Batch #114: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #114: `355.46 kB` minified and `114.16 kB` gzip.
- GitHub PR #165 `Core Type And Build Gate` passed before merge.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Font-loading status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
