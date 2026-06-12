# Prompt: P1A.3 Products Sync + Prompt 6 Skipped/Deferred Notice

Target: Lovable.dev

Use this prompt in the `yorso-commerce-hub` project.

```text
You are working on the YORSO Commerce Hub project.

Important project identity:
- Product name: yorso_new
- GitHub/Lovable repository: yorso-commerce-hub
- Current source of truth: GitHub main, commit 420ea3cb or newer

First, record this correction:
Prompt 6 / P2B Steering Dashboard Density Cleanup is already skipped/deferred.
It was mistakenly aimed at a `/agents` Steering Dashboard surface that does
not exist in the current `yorso-commerce-hub` repository.

Do not create `/agents`.
Do not port steering components.
Do not add `src/components/steering/*`.
Do not edit admin routes for Prompt 6.
Do not change backend/API/state for Prompt 6.

Expected evidence for Prompt 6 skipped/deferred:
- GitHub main includes commit `6219ad83` with subject:
  `Промпт 6 отложен (skipped)`
- Current repo has no `/agents` route and no
  `src/components/steering/agent-directory.tsx`.

Now perform the actual sync check for the current applicable account work:
P1A.3 Products catalog picker hookup and Latin-first identity on
`/account/products`.

Check current source of truth:
- GitHub main commit: `420ea3cb` or newer.
- Route: `/account/products`.
- Main file: `src/pages/account/Account.tsx`.
- Catalog loader: `src/lib/account-product-catalog.ts`.
- Static catalog: `public/data/account-product-catalog.json`.
- Picker: `src/components/account/AccountProductCatalogPicker.tsx`.
- E2E: `e2e/account-products-crud.spec.ts`.

Expected P1A.3 behavior:
1. The product add/edit form shows the workbook-backed product picker.
2. Search works by Latin name and by commercial/localized name.
3. Selecting a catalog item fills both:
   - `commercialName`
   - `latinName`
4. Visible product identity is Latin-first:
   - `Latin name (commercial name)`
   Example: `Scomber scombrus (Atlantic mackerel)`.
5. Latin-first identity appears in:
   - desktop product table;
   - mobile product cards;
   - product detail panel;
   - delete confirmation context.
6. Delete confirmation copy is short and unambiguous.
7. P1A.1 mobile product cards and P1A.2 delete confirmation remain intact.
8. No Supabase/provider scaffold is reintroduced.

Provider-free guard:
- `src/integrations/supabase/` must not exist.
- `supabase/` must not exist.
- `@supabase/supabase-js` must not be in dependencies.
- Do not add Supabase, Lovable Cloud backend, hosted BaaS, auth, database,
  storage, migrations or external services.

Verification to run if available:
- `npm test -- src/lib/account-product-catalog.test.ts`
- `npm test -- src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`
- `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-products-crud.spec.ts --project=chromium`
- `npm run check:provider-boundary`
- `npm run build`
- `git diff --check`

Manual preview checks:
- Open `/account/products` desktop:
  - product picker is visible in Add/Edit;
  - searching `Atlantic mackerel` shows and selects
    `Scomber scombrus (Atlantic mackerel)`;
  - table uses Latin-first identity;
  - delete confirmation uses short copy.
- Open `/account/products` at 390px:
  - mobile cards are used instead of forcing the desktop table;
  - no horizontal overflow;
  - delete confirmation fits viewport;
  - no nested interactive controls.

Output in Russian.
Return this table exactly:

| План | Сделано | Осталось | Проверка |
|---|---|---|---|
| Prompt 6 skipped/deferred | ... | ... | ... |
| GitHub sync | ... | ... | ... |
| Product catalog JSON | ... | ... | ... |
| Product picker | ... | ... | ... |
| Latin-first identity | ... | ... | ... |
| Delete confirmation | ... | ... | ... |
| Mobile 390px | ... | ... | ... |
| Provider-free guard | ... | ... | ... |
| Tests/build | ... | ... | ... |
| Conflicts | ... | ... | ... |

Also include:
1. GitHub commit synced.
2. Files changed by Lovable.
3. Tests run and exact result.
4. Tests not run and why.
5. Whether any conflicts or unexpected changes were found.

Stop condition:
This is a sync/verification prompt. Do not start a new feature. If the expected
files or behavior are missing, report the mismatch and stop.
```

