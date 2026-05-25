# Prompt #132: Lovable Sync For Public Offer Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `ab46fd3`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #132, then verify the
public offer buyer surfaces no longer expose hardcoded Russian labels in the
English UI. This is locale/accessibility hardening for buyer trust, not a
redesign.

Source of truth:
- GitHub `main`, commit `ab46fd3` or newer.
- PR #184: [codex] Batch #132 public offer locale a11y.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content remains a trust/supply
  mechanism; do not shift the primary story toward suppliers.

Important base context:
- Batch #132 was rebased over user changes on `main`:
  - `0846d5f` removed the visible `estimate` word from compact Pulse badges;
  - `35317b0` hid Pulse badges when the viewer count is zero;
  - `6c86b3c` fixed card sizing.
- Keep the current PulseBadge contract: visible activity count only on the
  compact badge, estimate disclosure through `aria-label` and `title`, and no
  visible compact estimate chip.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, offer detail, supplier directory, supplier
  profile, how-it-works, blog, auth pages, registration pages, admin pages or
  shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections
  or marketing filler.
- Do not change offer data, supplier mock data, access gating, supplier identity
  redaction, exact-price locks, CTA labels, CTA destinations, SEO, analytics
  hooks, backend APIs, Supabase settings, database schema or account/admin
  behavior.
- Do not reintroduce the visible compact Pulse estimate chip that was removed
  on `main`; preserve programmatic estimate disclosure instead.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#131 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/catalog/MobileOfferCard.tsx`:
   - details link aria-label is localized through
     `catalog_mobile_viewDetailsFor`;
   - delivery-basis link aria-label is localized through
     `catalog_mobile_basisAria`;
   - mixed-orientation photo hint visible text, title and aria-label are
     localized through `catalog_mobile_noCrop*` keys;
   - no English route should expose `Открыть карточку`, `Базис поставки`,
     `Без обрезки` or other Russian card labels.
2. `src/components/offer-detail/OfferSummary.tsx`:
   - stock labels, inventory label, capacity meter aria-label, certifications
     label, delivery-basis label, min-lot label and locked price/supplier status
     are localized through EN/RU/ES translation keys;
   - English offer detail should not expose Russian labels for stock, inventory,
     certifications, delivery basis, min lot, price lock or supplier status.
3. `src/i18n/translations.ts` includes EN/RU/ES keys for:
   - `offerDetail_stock_*`;
   - `offerDetail_inventoryLabel`;
   - `offerDetail_capacityAria`;
   - `offerDetail_capacity_*`;
   - `offerDetail_certificationsLabel`;
   - `offerDetail_minLotLabel`;
   - `catalog_mobile_viewDetailsFor`;
   - `catalog_mobile_basisAria`;
   - `catalog_mobile_noCropAria`;
   - `catalog_mobile_noCropTitle`;
   - `catalog_mobile_noCropLabel`.
4. Tests and smoke wiring:
   - `src/components/catalog/CatalogOfferRow.locale.test.tsx` guards English
     mobile card details and delivery-basis aria labels plus no Russian leakage;
   - `src/components/offer-detail/OfferSummary.locale.test.tsx` guards English
     offer-detail summary labels plus no Russian leakage;
   - `e2e/public-offer-locale-a11y.spec.ts` covers `/offers` and
     `/offers/:id` at 390px;
   - `package.json` includes `smoke:e2e:public-offer-locale-a11y`,
     `smoke:e2e:public-offer-locale-a11y:run` and the spec in
     `smoke:e2e:run`.
5. `e2e/public-pulse-disclosure.spec.ts` matches the current PulseBadge
   contract:
   - homepage Pulse badges are visible when active;
   - compact badges do not contain visible `estimate` text;
   - compact badges expose estimate status through `aria-label` and `title`.
6. `docs/backend/production-scale-baseline.md` includes Batch #132 and documents
   that this change adds no backend reads/writes, queues, polling, database
   changes or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/offers` renders in English at mobile 390px.
- Confirm mobile catalog card details and delivery-basis controls have English
  accessible names.
- Confirm the mixed-orientation image hint is localized and does not show
  Russian text in English.
- Confirm `/offers/00000000-0000-0000-0000-000000000001` renders in English at
  mobile 390px.
- Confirm the offer-detail summary shows English labels for stock, inventory,
  certifications, delivery basis, min lot and locked price/supplier status.
- Confirm there is no Russian label leakage in English UI or accessible names:
  `Открыть карточку`, `Базис поставки`, `Без обрезки`, `В наличии`,
  `Остаток`, `Сертификаты`, `Базис`, `Мин. партия`, `Точная цена скрыта`,
  `Поставщик скрыт`.
- Confirm access gating, supplier identity redaction, exact-price lock,
  catalog paging/sorting/filtering, offer routing, SEO and analytics are
  unchanged.
- Confirm compact Pulse badges still follow the current `main` contract:
  visible activity count, estimate disclosure in `aria-label` and `title`, no
  visible compact estimate chip.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm Batch #131 public Pulse safeguards, Batch #130 supplier profile mobile
  accessibility, Batch #129 offer detail mobile accessibility, Batch #128
  registration accessibility, Batch #127 blog tap targets, Batch #126
  skip-to-main behavior and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/PulseBadge.test.tsx src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/offer-detail/OfferSummary.locale.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-pulse-disclosure.spec.ts e2e/public-offer-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #132: `126.76 kB` minified and `21.00 kB` gzip.
- Entry chunk after Batch #132: `355.47 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #132: `320.54 kB` minified and `100.99 kB` gzip.
- MobileOfferCard route chunk after Batch #132: `42.80 kB` minified and
  `12.16 kB` gzip.
- OfferDetail route chunk after Batch #132: `51.27 kB` minified and `12.81 kB`
  gzip.
- Local full browser smoke passed after CI fix:
  `npm run smoke:e2e:run`, 239 tests.
- GitHub `Core Type And Build Gate` passed on PR #184.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public offer locale/a11y status
5. Pulse compact disclosure status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
