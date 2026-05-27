# Prompt #139: Lovable Sync For Public Language Selector A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `6721b65`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #139, then verify that
the public header language selector exposes a localized purpose and selected
language state to assistive technology. This is public UX/a11y hardening, not a
visual redesign.

Source of truth:
- GitHub `main`, commit `6721b65` or newer.
- PR #191: [codex] Batch #139 public language selector a11y.
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
- Do not change visible header layout, navigation destinations, language button
  copy, `localStorage["yorso-lang"]`, route structure, public SEO, access
  gating, supplier identity redaction, exact-price locks, analytics hooks,
  backend APIs, Supabase settings, database schema, account/admin behavior or
  offer/supplier data.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#138 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/landing/Header.tsx`:
   - defines localized labels for language selector purpose, current language
     and select-language actions;
   - desktop language selector button has `type="button"`, localized
     `aria-label`, `aria-expanded`, `aria-haspopup="true"` and
     `aria-controls`;
   - desktop language dropdown has a stable `id`, `role="group"` and localized
     `aria-label`;
   - desktop language options have `type="button"`, localized `aria-label` and
     `aria-pressed`;
   - mobile language options sit inside a localized `role="group"`;
   - mobile language buttons expose localized `aria-label` and `aria-pressed`;
   - visible header layout and existing language persistence are unchanged.
2. `src/i18n/translations.ts`:
   - includes EN/RU/ES keys:
     `aria_languageSelector`, `aria_currentLanguage`,
     `aria_selectLanguage`;
   - EN copy: `Language selector`, `Current language`, `Select language`;
   - RU copy: `Выбор языка`, `Текущий язык`, `Выбрать язык`;
   - ES copy: `Selector de idioma`, `Idioma actual`, `Seleccionar idioma`.
3. `src/components/landing/Header.landmarks.test.tsx`:
   - covers EN/RU/ES desktop language selector accessible names;
   - covers EN/RU/ES mobile language selector group labels;
   - verifies selected language state with `aria-pressed`.
4. `src/i18n/aria-tooltips-localized.ru.test.tsx`:
   - guards against English language-selector labels leaking into RU UI;
   - verifies RU header label contains `Выбор языка. Текущий язык: Русский`.
5. `e2e/public-language-selector-a11y.spec.ts`:
   - covers desktop language selector behavior, expanded state, group naming,
     selected state and `yorso-lang` persistence;
   - covers mobile header language selector behavior across public routes;
   - verifies zero nested interactive controls and zero horizontal overflow at
     390px.
6. `package.json`:
   - includes `smoke:e2e:public-language-selector-a11y`;
   - includes `smoke:e2e:public-language-selector-a11y:run`;
   - includes `e2e/public-language-selector-a11y.spec.ts` in
     `smoke:e2e:run`.
7. `docs/backend/production-scale-baseline.md`:
   - includes Batch #139 and documents that this frontend-only header a11y
     hardening adds no backend reads/writes, queues, polling, database changes
     or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm the header looks unchanged visually on desktop and mobile.
- Confirm desktop selected language button exposes a localized purpose, e.g.
  English `Language selector. Current language: English`.
- Confirm the desktop language dropdown is a named group and each option exposes
  localized select-language labels.
- Confirm desktop and mobile selected language options expose `aria-pressed`.
- Confirm changing language still persists to `localStorage["yorso-lang"]`.
- Confirm mobile language chips are inside a named group.
- Confirm `/`, `/offers`, `/suppliers`, `/how-it-works`, `/for-suppliers`,
  `/signin`, `/reset-password`, `/about` and `/blog` keep zero horizontal
  overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm public SEO, access gating, supplier identity redaction and exact-price
  locks are unchanged.
- Confirm Batch #138 info route SEO, Batch #137 offer-detail decision support,
  Batch #136 supplier trust, Batch #135 supplier profile logo, Batch #134
  supplier directory locale, Batch #133 breadcrumbs, Batch #132 offer locale,
  Batch #131 Pulse disclosure, Batch #130 supplier profile mobile
  accessibility, Batch #129 offer detail mobile accessibility, Batch #128
  registration accessibility, Batch #127 blog tap targets, Batch #126
  skip-to-main behavior and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-language-selector-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #139: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #139: `355.53 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #139: `340.69 kB` minified and `106.86 kB`
  gzip.
- Header chunk after Batch #139: `50.30 kB` minified and `14.14 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 271 tests.
- GitHub `Core Type And Build Gate` passed on PR #191 in 12m27s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public language selector a11y status
5. Mobile/header behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
