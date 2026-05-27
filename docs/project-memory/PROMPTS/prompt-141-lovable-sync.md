# Prompt #141: Lovable Sync For Public Sheet Close Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `5eafcb7`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #141, then verify that
public catalog sheet/drawer close controls expose localized programmatic names
in RU/ES. This is public UX/a11y hardening, not a visual redesign.

Source of truth:
- GitHub `main`, commit `5eafcb7` or newer.
- PR #193: [codex] Batch #141 public sheet close locale a11y.
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
- Do not change visible catalog drawer layout, offer comparison behavior, route
  structure, public SEO, access gating, supplier identity redaction,
  exact-price locks, analytics hooks, backend APIs, Supabase settings, database
  schema, account/admin behavior or offer/supplier data.
- Do not change language selector behavior or `localStorage["yorso-lang"]`.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#140 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/ui/sheet.tsx`:
   - `SheetContent` accepts optional `closeLabel?: React.ReactNode`;
   - the default close label remains `Close` for backward compatibility;
   - the Radix close button renders `<span className="sr-only">{closeLabel}</span>`;
   - no visible styling, animation, side variants, overlay behavior or close
     behavior changes.
2. `src/components/catalog/CompareTray.tsx`:
   - the comparison bottom sheet passes `closeLabel={t.aria_close}`;
   - comparison tray open/clear/remove behavior is unchanged.
3. `src/components/catalog/IntelligenceRail.tsx`:
   - the signal detail drawer passes `closeLabel={t.aria_close}`;
   - signal drawer open/close, watch toggles and analytics are unchanged.
4. `src/components/catalog/SheetCloseLocale.test.tsx`:
   - covers RU and ES `CompareTray` sheet close labels;
   - covers RU and ES `IntelligenceRail` signal drawer close labels;
   - verifies the default English `Close` accessible name does not leak into
     RU/ES drawer states.
5. `e2e/public-sheet-close-locale-a11y.spec.ts`:
   - opens the real `/offers` comparison drawer in RU and ES;
   - verifies close buttons are named `Закрыть` / `Cerrar`;
   - verifies no `Close` button name is exposed;
   - verifies locked-buyer access state, zero nested interactive controls and
     zero horizontal overflow.
6. `package.json`:
   - includes `smoke:e2e:public-sheet-close-locale-a11y`;
   - includes `smoke:e2e:public-sheet-close-locale-a11y:run`;
   - includes `e2e/public-sheet-close-locale-a11y.spec.ts` in
     `smoke:e2e:run`.
7. `docs/backend/production-scale-baseline.md`:
   - includes Batch #141 and documents that this frontend-only sheet a11y
     hardening adds no backend reads/writes, queues, polling, database changes
     or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/offers` looks unchanged visually on desktop and mobile.
- Confirm the comparison bottom sheet can still be opened after selecting two
  offers for comparison.
- Confirm RU comparison drawer exposes the close button as `Закрыть`, not
  `Close`.
- Confirm ES comparison drawer exposes the close button as `Cerrar`, not
  `Close`.
- Confirm `CompareTray` and `IntelligenceRail` still use the existing
  `t.aria_close` translation key, not new duplicate copy.
- Confirm comparison tray open/clear/remove behavior is unchanged.
- Confirm supplier identity redaction, access gating and exact-price locks are
  unchanged on `/offers`.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm `/offers` has zero horizontal overflow in the tested drawer state.
- Confirm public SEO, route structure and analytics hooks are unchanged.
- Confirm Batch #140 account menu a11y, Batch #139 language selector a11y,
  Batch #138 info route SEO, Batch #137 offer-detail decision support,
  Batch #136 supplier trust, Batch #135 supplier profile logo, Batch #134
  supplier directory locale, Batch #133 breadcrumbs, Batch #132 offer locale,
  Batch #131 Pulse disclosure, Batch #130 supplier profile mobile
  accessibility, Batch #129 offer detail mobile accessibility, Batch #128
  registration accessibility, Batch #127 blog tap targets, Batch #126
  skip-to-main behavior and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/catalog/SheetCloseLocale.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-sheet-close-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #141: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #141: `355.53 kB` minified and `114.15 kB` gzip.
- i18n-translations after Batch #141: `340.92 kB` minified and `106.94 kB`
  gzip.
- Offers route chunk after Batch #141: `72.56 kB` minified and `18.74 kB`
  gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 282 tests.
- GitHub `Core Type And Build Gate` passed on PR #193 in 13m19s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public sheet close locale a11y status
5. Catalog drawer behavior status
6. Bundle/code-splitting status
7. Remaining known warnings
```
