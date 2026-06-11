# Prompt P1A.1: Lovable Sync For Account Products Mobile Scanability

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `7fcbd2e4`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Mode:
Sync verification first. Do not start a redesign and do not make code changes
unless the synced GitHub state is missing or conflicting. If anything is
missing, stop and report the exact mismatch before editing.

Goal:
Sync the Lovable project with GitHub `main` after P1A.1 Products Mobile
Scanability, then verify that `/account/products` is readable and usable on
390px mobile without forcing users to scan a horizontal table.

Source of truth:
- Project/repo: `yorso-commerce-hub`.
- GitHub `main`, commit `7fcbd2e4` or newer.
- Implementation commit: `b7f87aa4` (`[codex] P1A.1 products mobile scanability`).
- Documentation/sync commit: `7fcbd2e4` (`[codex] Record P1A.1 Lovable sync state`).
- Local screenshots captured by Codex:
  - `/Users/istokdmgmail.com/yorso_new/output/playwright/account-products-p1a1-mobile390.png`
  - `/Users/istokdmgmail.com/yorso_new/output/playwright/account-products-p1a1-desktop.png`

Task:
Verify the existing P1A.1 implementation. This is not a new design prompt.
Lovable should pull/sync GitHub `main`, inspect the files below, and report
whether the synced implementation matches the contract.

Expected synced changes:
1. `src/pages/account/Account.tsx`
   - Contains `ProductMobileField`.
   - Contains `ProductMobileCard`.
   - Contains a mobile-only product card list with
     `data-testid="account-products-mobile-cards"`.
   - Mobile cards use separate test ids such as:
     `account-product-mobile-card-*`,
     `account-product-mobile-open-*`,
     `account-product-mobile-edit-*`,
     `account-product-mobile-delete-*`.
   - Existing desktop product table remains present and visible at `md+`.
   - Desktop table uses the existing table/test ids so prior tests keep working.
   - Mobile cards reuse the same `pagedProducts`, filters, sorting, pagination,
     detail, edit and delete handlers as the desktop table.
2. `e2e/account-products-crud.spec.ts`
   - Includes a 390px regression test for mobile product cards.
   - Verifies mobile cards are visible and the desktop table is hidden on
     mobile.
   - Verifies labelled fields are present for product, Latin name, state, role,
     monthly volume, certifications and target countries.
   - Verifies zero horizontal overflow.
   - Verifies zero nested interactive controls:
     `a button`, `button a`, `a a`, `button button`.
   - Verifies mobile action targets are at least 44px.
3. `docs/backend/production-scale-baseline.md`
   - Includes a P1A.1 section.
   - Documents this as frontend-only account workspace work with no new backend
     reads/writes, queues, polling, migrations, storage paths, auth changes,
     Supabase/runtime changes or catalog source changes.
4. `docs/project-memory/*`
   - Records P1A.1 as pushed to GitHub and ready for Lovable sync.

Required behavior to preserve:
- Desktop `/account/products`: keep the existing product table.
- Mobile `/account/products`: show labelled cards instead of a horizontal table.
- Product data, local prototype persistence, sorting, filtering, pagination,
  details, edit and delete behavior stay unchanged.
- Workbook-backed product picker/catalog source stays unchanged.
- Do not touch `/account/personal`, `/account/company`, `/account/branches`,
  `/account/meta-regions`, `/account/notifications`.
- Do not touch public marketplace pages, admin routes, supplier access,
  supplier identity redaction, exact-price locks or supplier document flows.
- Do not add backend, auth, database, storage, Supabase, Lovable Cloud,
  external services, dependencies, routes or migrations.
- Do not reintroduce `src/integrations/supabase/`, `supabase/`,
  `@supabase/supabase-js` or `VITE_SUPABASE_*`.

Verification to run or manually confirm in Lovable:
- Open `/account/products` on desktop width:
  - existing table is visible;
  - layout still matches the light account workspace style;
  - product actions still work.
- Open `/account/products` at 390px:
  - desktop table is hidden;
  - mobile cards are visible;
  - labels and values are visually separated;
  - product, Latin name, state, role, monthly volume, certifications and target
    countries are scannable without horizontal scrolling;
  - details, edit and delete actions are easy to find;
  - no horizontal overflow.
- Confirm no nested interactive controls:
  `document.querySelectorAll("a button, button a, a a, button button").length === 0`.
- Confirm action targets are at least 44px on mobile.
- If Lovable can run tests, run:
  `npm test -- src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-product-catalog.test.ts`
- If Lovable can run browser tests, run:
  `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-products-crud.spec.ts --project=chromium`
- If Lovable can run build/lint, run:
  `npm run build`
  `npm run lint`

Local Codex validation already completed:
- `npm test -- src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-product-catalog.test.ts` — 40 tests passed.
- `npm run build` — passed.
- `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-products-crud.spec.ts --project=chromium` — 18 tests passed.
- `npm run lint` — passed with 0 errors and 4 existing fast-refresh warnings.
- `git diff --check` — passed.

Stop condition:
- If sync is clean, do not edit files. Report the clean sync.
- If anything differs from the contract, stop and report the exact missing file,
  selector, behavior or test. Do not invent a replacement implementation.

Output in Russian with this exact table:

| План | Сделано | Осталось | Проверка |
|---|---|---|---|
| GitHub sync | ... | ... | ... |
| Account products desktop | ... | ... | ... |
| Account products mobile 390px | ... | ... | ... |
| Actions and handlers | ... | ... | ... |
| No backend/Supabase/runtime change | ... | ... | ... |
| Tests/build | ... | ... | ... |
| Conflicts | ... | ... | ... |

Also include:
1. GitHub commit synced.
2. Files checked.
3. Whether any files were changed by Lovable.
4. Known warnings preserved.
```

Done condition: Lovable reports a clean sync or gives a concrete mismatch list.
