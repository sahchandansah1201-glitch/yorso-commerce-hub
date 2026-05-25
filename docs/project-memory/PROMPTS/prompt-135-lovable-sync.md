# Prompt #135: Lovable Sync For Supplier Profile Logo Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `eb23d5f`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #135, then verify that
the public supplier profile no longer exposes mixed-language supplier logo
accessible names. This is supplier trust-route locale/accessibility hardening,
not a redesign.

Source of truth:
- GitHub `main`, commit `eb23d5f` or newer.
- PR #187: [codex] Batch #135 supplier profile logo locale a11y.
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
- Do not change supplier profile tabs, approval refresh, directory/profile
  bridge, profile routing or locked/unlocked supplier identity behavior.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#134 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/SupplierProfile.tsx`:
   - `SupplierLogoCard` uses `useLanguage()` and derives `logoLabel` with:
     `interpolate(t.supplier_logo_aria, { name: nameForLabel })`;
   - the logo wrapper uses `aria-label={logoLabel}`;
   - the logo image uses `alt={logoLabel}`;
   - the previous hardcoded Russian `Логотип ...` wrapper label and English
     `... logo` image alt suffix are gone.
2. `src/pages/__tests__/SupplierProfile.i18n.test.tsx`:
   - guards EN/RU/ES supplier logo accessible names and image alt text;
   - ensures English does not expose `Логотип`;
   - ensures Russian does not expose `Nordfjord Sjømat AS logo`.
3. `e2e/supplier-profile-logo-locale-a11y.spec.ts`:
   - covers `/suppliers/sup-no-001` at 390px in EN/RU/ES;
   - verifies locale-owned supplier logo labels;
   - verifies no wrong-locale logo label leakage, no nested controls and no
     horizontal overflow.
4. `package.json`:
   - includes `smoke:e2e:supplier-profile-logo-locale-a11y`;
   - includes `smoke:e2e:supplier-profile-logo-locale-a11y:run`;
   - includes the spec in `smoke:e2e:run`.
5. `docs/backend/production-scale-baseline.md`:
   - includes Batch #135 and documents that this frontend-only semantic change
     adds no backend reads/writes, queues, polling, database changes or new
     runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/suppliers/sup-no-001` renders in English, Russian and Spanish.
- Confirm the supplier profile logo accessible name follows active locale:
  - EN: `Norwegian salmon producer · NO-114 logo`
  - RU: `Логотип Норвежский производитель лосося · NO-114`
  - ES: `Logotipo de Productor noruego de salmón · NO-114`
- Confirm the hardcoded wrong-locale logo labels do not appear in the wrong
  locale:
  - EN should not expose `Логотип Norwegian salmon producer`;
  - RU should not expose `Норвежский производитель лосося · NO-114 logo`;
  - ES should not expose `Productor noruego de salmón · NO-114 logo`.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm supplier profile access gating, supplier identity redaction, approval
  refresh, profile tabs, directory/profile bridge, route-owned SEO and
  buyer-first trust copy are unchanged.
- Confirm Batch #134 supplier directory locale/a11y, Batch #133 breadcrumb
  locale/a11y, Batch #132 public offer locale/a11y, Batch #131 Pulse disclosure,
  Batch #130 supplier profile mobile accessibility, Batch #129 offer detail
  mobile accessibility, Batch #128 registration accessibility, Batch #127 blog
  tap targets, Batch #126 skip-to-main behavior and Batch #125 landmark labels
  are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/pages/__tests__/SupplierProfile.i18n.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/supplier-profile-logo-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #135: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #135: `355.47 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #135: `321.51 kB` minified and `101.25 kB` gzip.
- SupplierProfile route chunk after Batch #135: `60.58 kB` minified and
  `15.43 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 246 tests.
- GitHub `Core Type And Build Gate` passed on PR #187 in 12m21s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Supplier profile logo locale/a11y status
5. Supplier profile behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
