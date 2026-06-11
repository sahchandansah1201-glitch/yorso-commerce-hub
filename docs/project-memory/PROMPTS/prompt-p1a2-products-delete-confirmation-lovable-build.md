# Prompt P1A.2: Lovable Build For Products Delete Confirmation

Target: Lovable.dev

Use this prompt in the `yorso-commerce-hub` project after syncing with GitHub
`main` at commit `af128c1a` or newer.

```text
You are working on the YORSO Commerce Hub project.

Mode:
Build this scoped change only. First verify the current files match the source
of truth below. If the code is missing the expected P1A.1 product cards/table
state, stop and report the mismatch before editing.

Goal:
Implement P1A.2 Products Delete Confirmation for `/account/products`.

Business job:
Prevent accidental removal of a company product row from the account product
matrix. This deletion affects what the company buys/sells on YORSO and can
affect matching/recommendations, so the user must explicitly confirm the
removal.

Important entity definition:
The deleted entity is one `CompanyProduct` row/card in the user's company
product matrix on `/account/products`.

This is NOT deletion from:
- the global fish/product catalog;
- `latin_name_fish_localized.xlsx`;
- `public/data/account-product-catalog.json`;
- public marketplace offers/catalog;
- another company's data;
- backend storage or database.

Source of truth:
- Project/repo: `yorso-commerce-hub`.
- GitHub `main`, commit `af128c1a` or newer.
- Route: `/account/products`.
- Main file: `src/pages/account/Account.tsx`.
- Existing dialog primitive: `src/components/ui/alert-dialog.tsx`.
- Existing e2e file: `e2e/account-products-crud.spec.ts`.
- Existing i18n file: `src/i18n/translations.ts`.

Current confirmed behavior:
- `src/pages/account/Account.tsx` has `deleteProduct(productId: string)`.
- `deleteProduct` immediately removes a product via:
  `profile.products.filter((p) => p.id !== productId)`.
- Desktop table delete button currently calls `deleteProduct(p.id)` directly
  and uses `data-testid="account-product-delete-${p.id}"`.
- Mobile card delete button currently receives `onDelete={() => void deleteProduct(product.id)}`
  and uses `data-testid="account-product-mobile-delete-${product.id}"`.
- P1A.1 mobile cards are present through `ProductMobileCard` and
  `data-testid="account-products-mobile-cards"`.

Required implementation:
1. Add a single shared delete-confirmation flow for both desktop table rows and
   mobile product cards.
2. Keep the existing `deleteProduct(productId)` behavior as the actual delete
   operation.
3. Do not call `deleteProduct` directly from desktop/mobile delete buttons.
   Instead:
   - set the pending product to delete;
   - open an `AlertDialog`;
   - call `deleteProduct(pendingProduct.id)` only after the user confirms.
4. Use the existing shadcn/Radix alert dialog primitives from
   `src/components/ui/alert-dialog.tsx`.
5. Do not use `window.confirm`.
6. The same dialog and state must serve desktop and mobile.
7. Dialog content must show safe, useful product context:
   - commercial name;
   - Latin name;
   - role label (`buying`, `selling`, `both` localized through the existing
     product role label helper);
   - optional state label if it fits cleanly.
8. Dialog copy must make the consequence clear:
   - the product will be removed from this company's matrix;
   - the global product catalog is not changed;
   - no other company/product catalog entries are changed.
9. Cancel must be the safe path:
   - closes the dialog;
   - clears the pending delete product;
   - does not modify profile products;
   - does not change localStorage.
10. Confirm must:
    - use clear destructive copy, for example `Delete product`;
    - call the existing delete flow;
    - close the dialog;
    - preserve existing error handling through `saveError`;
    - preserve existing selected/editing cleanup behavior inside
      `deleteProduct`.
11. Keep desktop and mobile visual hierarchy:
    - delete buttons remain secondary/quiet until clicked;
    - the dialog is the only high-emphasis destructive moment.

I18n requirements:
- Add EN/RU/ES keys in `src/i18n/translations.ts`.
- Suggested keys:
  - `account_product_delete_confirm_title`
  - `account_product_delete_confirm_desc`
  - `account_product_delete_confirm_productLabel`
  - `account_product_delete_confirm_latinLabel`
  - `account_product_delete_confirm_roleLabel`
  - `account_product_delete_confirm_cancel`
  - `account_product_delete_confirm_submit`
- Suggested EN copy:
  - Title: `Delete product from matrix?`
  - Description: `{product} will be removed from the products your company buys or sells on YORSO. The product catalog and other companies are not changed.`
  - Cancel: `Cancel`
  - Submit: `Delete product`
- Suggested RU copy:
  - Title: `Удалить продукт из матрицы?`
  - Description: `{product} будет убран из продуктов, которые ваша компания покупает или продаёт на YORSO. Справочник продукции и другие компании не изменятся.`
  - Cancel: `Отмена`
  - Submit: `Удалить продукт`
- Suggested ES copy:
  - Title: `¿Eliminar producto de la matriz?`
  - Description: `{product} se eliminará de los productos que su empresa compra o vende en YORSO. El catálogo de productos y otras empresas no cambian.`
  - Cancel: `Cancelar`
  - Submit: `Eliminar producto`
- Use existing labels where cleaner, but do not leave hardcoded English in RU/ES.

Accessibility requirements:
- Dialog title and description must be connected through AlertDialog semantics.
- Focus must move into the dialog and return to the trigger after cancel/close.
- Escape/cancel path must not delete.
- Confirm path must be keyboard reachable.
- No nested interactive controls:
  `a button`, `button a`, `a a`, `button button` must remain 0.
- Mobile 390px must have no horizontal overflow.
- Delete buttons must keep usable target size on mobile.

Do not:
- Do not redesign `/account/products`.
- Do not change filters, sorting, pagination, product picker, workbook-backed
  catalog source or product data shape.
- Do not change `/account/personal`, `/account/company`, `/account/branches`,
  `/account/meta-regions`, `/account/notifications`.
- Do not touch public marketplace pages, admin routes, supplier access,
  supplier identity redaction, exact-price locks or supplier document flows.
- Do not add backend, auth, database, storage, Supabase, Lovable Cloud,
  external services, dependencies, routes or migrations.
- Do not reintroduce `src/integrations/supabase/`, `supabase/`,
  `@supabase/supabase-js` or `VITE_SUPABASE_*`.
- Do not delete or weaken P1A.1 mobile cards.

Testing requirements:
1. Update `e2e/account-products-crud.spec.ts`:
   - Desktop: clicking `account-product-delete-*` opens the confirmation
     dialog; Cancel keeps the row; Confirm removes the row.
   - Mobile 390px: clicking `account-product-mobile-delete-*` opens the same
     confirmation dialog; Cancel keeps the card; Confirm removes the card.
   - Verify the dialog shows product commercial name and Latin name.
   - Verify no horizontal overflow at 390px.
   - Verify no nested interactive controls.
2. Keep existing product CRUD tests passing.
3. If unit/i18n tests need updates, add minimal focused coverage.
4. Update `docs/backend/production-scale-baseline.md` with a short P1A.2
   note:
   - frontend-only confirmation;
   - no backend reads/writes;
   - no queues, polling, migrations, storage paths or runtime volume;
   - no production-scale impact beyond existing local UI state.

Verification to run in Lovable if available:
- `npm test -- src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-product-catalog.test.ts`
- `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-products-crud.spec.ts --project=chromium`
- `npm run build`
- `npm run lint`
- `git diff --check`

Manual visual checks:
- Open `/account/products` on desktop:
  - table remains visible;
  - delete opens confirmation;
  - Cancel keeps product;
  - Confirm removes product.
- Open `/account/products` at 390px:
  - mobile cards remain visible;
  - delete opens confirmation;
  - dialog fits viewport;
  - Cancel keeps product;
  - Confirm removes product;
  - no horizontal overflow.

Output in Russian:
Return a concise report and include this exact table:

| План | Сделано | Осталось | Проверка |
|---|---|---|---|
| Shared delete confirmation | ... | ... | ... |
| Desktop table delete | ... | ... | ... |
| Mobile card delete | ... | ... | ... |
| Dialog copy/i18n | ... | ... | ... |
| Accessibility/mobile | ... | ... | ... |
| Backend/Supabase/runtime unchanged | ... | ... | ... |
| Tests/build | ... | ... | ... |
| Conflicts | ... | ... | ... |

Also include:
1. Files changed.
2. Tests run and exact result.
3. Tests not run and why.
4. Whether any conflicts or unexpected existing changes were found.

Stop condition:
Stop after this scoped change. Do not start P1A.3 or redesign products.
```

Done condition: Lovable implements P1A.2 or reports a concrete blocker/mismatch.
