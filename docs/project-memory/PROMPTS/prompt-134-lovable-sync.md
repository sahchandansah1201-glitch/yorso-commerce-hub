# Prompt #134: Lovable Sync For Supplier Directory Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `6cd21e9`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #134, then verify that
the public supplier directory no longer exposes hardcoded English programmatic
trust labels or image alt phrases under localized UI. This is accessibility and
locale hardening for buyer trust, not a redesign.

Source of truth:
- GitHub `main`, commit `6cd21e9` or newer.
- PR #186: [codex] Batch #134 supplier directory locale a11y.
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
- Do not change supplier directory sorting, filtering, page-size, pagination,
  selected panel behavior, shortlist behavior, supplier profile routing or the
  directory/profile approval bridge.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#133 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/i18n/translations.ts`:
   - includes EN/RU/ES keys:
     `supplierRow_signalsAria`,
     `supplierRow_productCatalogPreviewAria`,
     `supplierRow_deliveryMarketsPreviewAria`,
     `supplierRow_heroImageAlt`,
     `supplierRow_productPreviewAlt`.
2. `src/pages/Suppliers.tsx`:
   - selected supplier aside uses `aria-label={t.selectedSupplier_aboutLabel}`;
   - hardcoded `aria-label="Selected supplier"` is gone.
3. `src/components/suppliers/SupplierRow.tsx`:
   - supplier trust signals use `t.supplierRow_signalsAria`;
   - catalog preview uses `t.supplierRow_productCatalogPreviewAria`;
   - delivery markets preview uses `t.supplierRow_deliveryMarketsPreviewAria`;
   - hero and product preview image alt text uses localized templates.
4. `src/components/suppliers/SelectedSupplierPanel.tsx`:
   - hero and product preview image alt text uses the same localized templates.
5. Tests and smoke wiring:
   - `src/pages/Suppliers.i18n.test.tsx` guards RU labels and image alt text
     against English leakage;
   - `e2e/suppliers-directory-locale-a11y.spec.ts` covers `/suppliers` at
     390px;
   - `package.json` includes `smoke:e2e:suppliers-directory-locale-a11y`,
     `smoke:e2e:suppliers-directory-locale-a11y:run` and the spec in
     `smoke:e2e:run`.
6. `docs/backend/production-scale-baseline.md` includes Batch #134 and documents
   that this change adds no backend reads/writes, queues, polling, database
   changes or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/suppliers` renders in Russian at mobile 390px.
- Confirm the selected supplier aside exposes the localized label
  `Выбранный поставщик`.
- Confirm supplier rows expose localized RU accessible names:
  `Сигналы поставщика`, `Превью каталога товаров`,
  `Превью рынков доставки`.
- Confirm no visible/programmatic supplier directory label contains the
  hardcoded English strings `Selected supplier`, `Supplier signals`,
  `Product catalog preview` or `Delivery markets preview` when RU is active.
- Confirm image alt text contains localized RU phrases such as
  `Референсное изображение` and `Превью товара`, and does not contain
  `reference image for` or `product preview from` in RU.
- Confirm there is no horizontal overflow at 390px.
- Confirm supplier directory search, sorting, page-size, pagination, selected
  panel behavior, shortlist behavior and profile links are unchanged.
- Confirm access gating, supplier identity redaction, contact hiding, exact
  catalog/delivery breadth hiding, route-owned SEO, analytics and buyer-first
  public copy are unchanged.
- Confirm compact Pulse badges still follow the current contract: visible
  activity count, estimate disclosure in `aria-label` and `title`, no visible
  compact estimate chip.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm Batch #133 breadcrumb locale/a11y, Batch #132 public offer locale/a11y,
  Batch #131 Pulse disclosure, Batch #130 supplier profile mobile accessibility,
  Batch #129 offer detail mobile accessibility, Batch #128 registration
  accessibility, Batch #127 blog tap targets, Batch #126 skip-to-main behavior
  and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/pages/Suppliers.i18n.test.tsx src/components/suppliers/SupplierRow.test.tsx src/components/suppliers/SupplierRow.snapshot.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/suppliers-directory-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #134: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #134: `355.47 kB` minified and `114.18 kB` gzip.
- i18n-translations after Batch #134: `321.51 kB` minified and `101.25 kB` gzip.
- Suppliers route chunk after Batch #134: `36.46 kB` minified and `9.07 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 243 tests.
- GitHub `Core Type And Build Gate` passed on PR #186 after one rerun. The
  first failed run was the known `suppliers-directory-paging` flake; the new
  `suppliers-directory-locale-a11y` spec passed in that run and the rerun passed
  the full gate without code changes.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Supplier directory locale/a11y status
5. Supplier directory behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
