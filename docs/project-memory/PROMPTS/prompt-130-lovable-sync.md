# Prompt #130: Lovable Sync For Supplier Profile Mobile Accessibility

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `1449efa`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #130, then verify that
the supplier profile trust/supply route keeps mobile-safe 44px breadcrumb,
trust tab and not-found recovery targets while preserving the existing
access-gated buyer-first supplier trust flow. Do not change supplier data,
route behavior, buyer copy, access gating, supplier identity redaction,
approval behavior, backend APIs, Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `1449efa` or newer.
- PR #181: [codex] Batch #130 supplier profile mobile accessibility.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content remains a trust/supply
  mechanism; this batch is mobile accessibility/scanability hardening for
  `/suppliers/:id`, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier directory, supplier profile,
  offer detail, how-it-works, blog, auth pages, registration pages, admin pages
  or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections
  or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes,
  dependencies or new product behavior.
- Do not change supplier copy, CTA labels, CTA destinations, route flow,
  analytics hooks, supplier data, supplier mock data or visual styling beyond
  the synced semantic and target-size attributes.
- Do not change buyer access gating, supplier identity redaction, supplier
  approval refresh behavior or directory/profile bridge behavior.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114
  font loading, Batch #115 catalog locale hardening, Batch #116 offers proof
  anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers
  CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics,
  Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics,
  Batch #123 public input accessibility, Batch #124 public heading structure,
  Batch #125 public landmark labels, Batch #126 skip-to-main target, Batch #127
  blog mobile tap targets, Batch #128 auth/registration accessibility or
  Batch #129 offer detail mobile accessibility.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/SupplierProfile.tsx`:
   - supplier profile breadcrumb navigation uses locale-owned `t.aria_breadcrumb`
     instead of a hardcoded English aria-label;
   - breadcrumb `Home` and `Suppliers` links are mobile-safe and at least
     44px by 44px at 390px;
   - those breadcrumb links are marked with
     `data-supplier-profile-mobile-target`;
   - supplier profile tab triggers use `min-h-11` and keep the existing visual
     pill style;
   - supplier profile tab triggers are marked with
     `data-supplier-profile-mobile-target="profile-tab"`;
   - unknown supplier fallback directory recovery link is mobile-safe and marked
     with `data-supplier-profile-mobile-target="not-found-directory"`;
   - supplier profile copy, access levels, approval refresh, redaction and
     profile/catalog bridge behavior are unchanged.
2. `e2e/supplier-profile-mobile-a11y.spec.ts` exists and checks
   `/suppliers/sup-no-001` and `/suppliers/sup-not-real` at 390px:
   - supplier profile heading renders with the masked supplier name;
   - breadcrumb landmark and links are visible;
   - trust/profile tabs are visible;
   - marked supplier profile mobile targets are visible and at least
     44px by 44px;
   - zero nested interactive controls;
   - zero horizontal overflow;
   - unknown supplier fallback exposes a mobile-safe `supplier directory`
     recovery link.
3. `package.json` includes:
   - `smoke:e2e:supplier-profile-mobile-a11y`;
   - `smoke:e2e:supplier-profile-mobile-a11y:run`;
   - `e2e/supplier-profile-mobile-a11y.spec.ts` in `smoke:e2e:run`.
4. `docs/backend/production-scale-baseline.md` includes the Batch #130
   10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/suppliers/sup-no-001` or an equivalent supplier profile route
  renders at mobile 390px.
- Confirm the supplier profile breadcrumb landmark is named through the active
  locale and not hardcoded to English.
- Confirm the `Home` and `Suppliers` breadcrumb links are at least 44px by 44px
  at 390px.
- Confirm supplier profile tabs `About supplier`, `Catalog (2)`,
  `Production passport`, `Shipment reports & cases` and `FAQ` are at least
  44px tall at 390px.
- Confirm every `[data-supplier-profile-mobile-target]` on the supplier profile
  route has a box of at least 44px by 44px at 390px.
- Confirm `/suppliers/sup-not-real` shows the unknown supplier fallback and the
  `supplier directory` recovery link is mobile-safe.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm supplier profile access gating, supplier identity redaction, supplier
  approval refresh, stale identity removal, directory return behavior and
  supplier locked i18n are unchanged.
- Confirm Batch #129 offer detail mobile accessibility, Batch #128 registration
  accessibility, Batch #127 blog tap targets, Batch #126 skip-to-main behavior
  and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/supplier-profile-mobile-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #130: `126.72 kB` minified and `21.00 kB` gzip.
- Entry chunk after Batch #130: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #130: `315.30 kB` minified and `99.25 kB` gzip.
- SupplierProfile route chunk after Batch #130: `60.56 kB` minified and
  `15.45 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 235 tests.
- GitHub `Core Type And Build Gate` passed on PR #181 in 12m26s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Supplier profile mobile accessibility status
5. Supplier profile trust route scanability status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
