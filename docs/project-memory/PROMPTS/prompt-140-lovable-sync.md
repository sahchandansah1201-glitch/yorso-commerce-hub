# Prompt #140: Lovable Sync For Public Account Menu A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `8ad19a6`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #140, then verify that
the signed-in public header account menu exposes a localized account-menu
purpose and current-account context to assistive technology. This is public
UX/a11y hardening, not a visual redesign.

Source of truth:
- GitHub `main`, commit `8ad19a6` or newer.
- PR #192: [codex] Batch #140 public account menu a11y.
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
- Do not change visible header layout, account destinations, session storage,
  route structure, public SEO, access gating, supplier identity redaction,
  exact-price locks, analytics hooks, backend APIs, Supabase settings, database
  schema, account/admin behavior or offer/supplier data.
- Do not change language selector behavior or `localStorage["yorso-lang"]`.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#139 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/Header.tsx`:
   - defines localized signed-in account menu labels:
     `aria_accountMenu` and `aria_currentAccount`;
   - desktop signed-in account chip has a localized `aria-label` in the form
     `Account menu. Current account: {displayName}`;
   - desktop account chip keeps `type="button"` and exposes
     `aria-expanded`, `aria-haspopup="true"` and `aria-controls` when open;
   - desktop account dropdown has stable id `header-account-menu`,
     `role="group"` and localized `aria-label`;
   - mobile signed-in account panel has `role="group"` and the same localized
     account context label;
   - visible header layout, account link destinations and sign-out behavior are
     unchanged.
2. `src/i18n/translations.ts`:
   - includes EN/RU/ES keys:
     `aria_accountMenu`, `aria_currentAccount`;
   - EN copy: `Account menu`, `Current account`;
   - RU copy: `Меню учётной записи`, `Текущая учётная запись`;
   - ES copy: `Menú de cuenta`, `Cuenta actual`.
3. `src/components/landing/Header.landmarks.test.tsx`:
   - covers EN/RU/ES signed-in desktop account-menu labels;
   - covers EN/RU/ES signed-in mobile account panel labels;
   - verifies desktop account chip `aria-expanded`, `aria-haspopup` and
     `aria-controls`;
   - verifies desktop dropdown group naming.
4. `src/i18n/aria-tooltips-localized.ru.test.tsx`:
   - guards against English account-menu labels leaking into RU UI;
   - verifies the RU signed-in header label includes
     `Меню учётной записи. Текущая учётная запись: Покупатель`.
5. `e2e/public-account-menu-a11y.spec.ts`:
   - covers desktop signed-in account chip naming, expanded state,
     `aria-controls`, dropdown group naming, account link and sign-out button;
   - covers EN/RU/ES mobile account panel labels;
   - checks signed-in mobile header stability on `/`, `/offers`, `/suppliers`,
     `/about` and `/blog`;
   - verifies zero nested interactive controls and zero horizontal overflow at
     390px.
6. `package.json`:
   - includes `smoke:e2e:public-account-menu-a11y`;
   - includes `smoke:e2e:public-account-menu-a11y:run`;
   - includes `e2e/public-account-menu-a11y.spec.ts` in `smoke:e2e:run`.
7. `docs/backend/production-scale-baseline.md`:
   - includes Batch #140 and documents that this frontend-only header a11y
     hardening adds no backend reads/writes, queues, polling, database changes
     or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm the header looks unchanged visually on desktop and mobile.
- Confirm a signed-in desktop buyer account chip exposes a localized account
  menu purpose, e.g. English
  `Account menu. Current account: Buyer Demo`.
- Confirm the desktop account dropdown is associated through
  `aria-controls="header-account-menu"` when open.
- Confirm the desktop account dropdown is a named group with localized label.
- Confirm the mobile signed-in account panel is a named group with localized
  current-account context in EN/RU/ES.
- Confirm account link destinations and sign-out behavior are unchanged.
- Confirm `/`, `/offers`, `/suppliers`, `/about` and `/blog` keep zero
  horizontal overflow at 390px for signed-in mobile header state.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm public SEO, access gating, supplier identity redaction and exact-price
  locks are unchanged.
- Confirm Batch #139 language selector a11y, Batch #138 info route SEO,
  Batch #137 offer-detail decision support, Batch #136 supplier trust,
  Batch #135 supplier profile logo, Batch #134 supplier directory locale,
  Batch #133 breadcrumbs, Batch #132 offer locale, Batch #131 Pulse disclosure,
  Batch #130 supplier profile mobile accessibility, Batch #129 offer detail
  mobile accessibility, Batch #128 registration accessibility, Batch #127 blog
  tap targets, Batch #126 skip-to-main behavior and Batch #125 landmark labels
  are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-account-menu-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #140: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #140: `355.53 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #140: `340.92 kB` minified and `106.94 kB`
  gzip.
- Header chunk after Batch #140: `50.54 kB` minified and `14.20 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 280 tests.
- GitHub `Core Type And Build Gate` passed on PR #192 in 12m54s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public account menu a11y status
5. Mobile/header behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
