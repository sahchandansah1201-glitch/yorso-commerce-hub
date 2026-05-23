# Prompt #112: Lovable Sync For Batch #112

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `2430fef`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #112, then verify that
the frontend route code-splitting patch is present without changing the product
experience, visual system, copy, routes, auth, data models, Supabase settings or
backend behavior.

Source of truth:
- GitHub `main`, commit `2430fef` or newer.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier UI should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, admin pages or shared components.
- Do not add generic AI-looking loading screens, hero sections, decorative cards or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes, dependencies or new features.
- Do not manually split third-party vendor chunks. Batch #112 intentionally avoids manual vendor chunks because production preview exposed React/vendor circular runtime errors during validation.
- Do not remove the public route SEO work from Batch #111 or the mobile UX fixes from Batch #110.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/App.tsx` lazy-loads route page components with `React.lazy`.
2. `src/App.tsx` wraps route rendering in `Suspense` with a lightweight skeleton fallback.
3. Global providers, `LegacyOfferRedirect`, legacy redirects and `SupplierApprovalNotifier` remain eager.
4. `vite.config.ts` splits only the local `src/i18n/translations.ts` table into a named `i18n-translations` chunk.
5. `vite.config.ts` keeps third-party package chunking under Rollup control. There should be no manual `vendor-react`, `vendor-charts`, `vendor-supabase` or generic vendor chunk rule.
6. `src/test/app-route-code-splitting.test.ts` exists and guards route lazy-loading plus the translation chunk rule.
7. Project-memory and production-scale notes mention Batch #112 and the 10,000 concurrent-user frontend capacity review.

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
- If Lovable can run a production build, confirm the previous Vite large-chunk warning is gone.

Expected build measurement from GitHub validation:
- Previous single entry chunk before route splitting: about `2.69 MB` minified and `734 kB` gzip.
- Current entry chunk after Batch #112: `352.18 kB` minified and `112.99 kB` gzip.
- `i18n-translations` chunk: `311.45 kB` minified and `98.15 kB` gzip.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public route runtime status
5. Bundle/code-splitting status
6. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
- A custom route chunk error boundary is still a follow-up hardening item.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
