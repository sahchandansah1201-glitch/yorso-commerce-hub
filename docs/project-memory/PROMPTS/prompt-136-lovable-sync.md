# Prompt #136: Lovable Sync For Offer Detail Supplier Trust Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `3720708`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #136, then verify that
the public offer detail supplier trust panel no longer exposes hardcoded
English trust labels inside Russian or Spanish UI. This is buyer trust-route
locale/accessibility hardening, not a redesign.

Source of truth:
- GitHub `main`, commit `3720708` or newer.
- PR #188: [codex] Batch #136 offer detail supplier trust locale a11y.
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
  redaction, exact-price locks, CTA destinations, SEO, analytics hooks, backend
  APIs, Supabase settings, database schema, account/admin behavior or route
  structure.
- Do not change the supplier access request panel, Market Pulse, offer summary,
  photo gallery, related offers or return-to-catalog behavior.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#135 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/offer-detail/SupplierTrustPanel.tsx`:
   - uses `useLanguage()` for supplier trust panel copy;
   - imports `interpolate` and `pluralize` from `@/lib/supplier-i18n`;
   - localizes supplier verification status title/body;
   - localizes review disclosure labels (`What was reviewed?` / `Hide details`);
   - localizes mini-stat labels (`In business`, `Response`);
   - localizes evidence labels (`Certifications`, `Reviewed documents`);
   - localizes qualified-buyer CTAs (`View Supplier Profile`, `Contact Supplier`,
     `Save to Shortlist`, `Compare Similar Offers`);
   - exposes `data-testid="offer-detail-supplier-verification"` on the
     verification block.
2. `src/i18n/translations.ts`:
   - includes EN/RU/ES keys for `offerDetail_supplierVerifiedTitle`,
     `offerDetail_supplierVerifiedBody`, `offerDetail_supplierVerifiedBodyNoDate`,
     `offerDetail_supplierPendingTitle`, `offerDetail_supplierPendingBody`,
     `offerDetail_supplierReviewShow`, `offerDetail_supplierReviewHide`,
     `offerDetail_inBusinessLabel`, `offerDetail_yearsInBusiness_*`,
     `offerDetail_responseLabel`, `offerDetail_supplierCertificationsLabel`,
     `offerDetail_reviewedDocumentsLabel`,
     `offerDetail_viewSupplierProfileCta`, `offerDetail_contactSupplierCta`,
     `offerDetail_saveToShortlistCta` and
     `offerDetail_compareSimilarOffersCta`.
3. `src/pages/OfferDetail.tsx`:
   - offer-detail route shells use `overflow-x-hidden` so the expanded Russian
     supplier review disclosure does not create horizontal overflow at 390px.
4. `src/components/offer-detail/SupplierTrustPanel.access.test.tsx`:
   - guards RU/ES localized supplier trust labels and qualified CTAs.
5. `e2e/offer-detail-supplier-trust-locale-a11y.spec.ts`:
   - covers `/offers/00000000-0000-0000-0000-000000000001` at 390px in RU/ES;
   - verifies localized trust labels, disclosure toggle labels, target height
     of at least 44px, zero nested interactive controls and zero horizontal
     overflow.
6. `package.json`:
   - includes `smoke:e2e:offer-detail-supplier-trust-locale-a11y`;
   - includes `smoke:e2e:offer-detail-supplier-trust-locale-a11y:run`;
   - includes the spec in `smoke:e2e:run`.
7. `docs/backend/production-scale-baseline.md`:
   - includes Batch #136 and documents that this frontend-only semantic change
     adds no backend reads/writes, queues, polling, database changes or new
     runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/offers/00000000-0000-0000-0000-000000000001` renders in Russian and
  Spanish.
- Confirm the supplier trust panel no longer exposes these hardcoded English
  labels in RU/ES UI:
  `Verified Supplier`, `Pending Full Verification`, `What was reviewed?`,
  `Hide details`, `In business`, `Response`, `Certifications`,
  `Reviewed documents`, `View Supplier Profile`, `Contact Supplier`,
  `Save to Shortlist`, `Compare Similar Offers`.
- Confirm RU shows localized supplier trust labels, including:
  `Ожидает полной проверки`, `Что проверяли?`, `Скрыть детали`, `На рынке`,
  `Ответ`, `Сертификаты`, `Проверенные документы`, `В шортлист`.
- Confirm ES shows localized supplier trust labels, including:
  `Verificación completa pendiente`, `¿Qué se revisó?`, `Ocultar detalles`,
  `En el mercado`, `Respuesta`, `Certificaciones`, `Documentos revisados`.
- Confirm the review disclosure target is at least 44px tall on mobile.
- Confirm there is no horizontal overflow at 390px after expanding the review
  disclosure.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm offer detail access gating, supplier identity redaction, exact-price
  lock, supplier access request panel, Market Pulse, route SEO and buyer-first
  offer detail copy are unchanged.
- Confirm Batch #135 supplier profile logo locale/a11y, Batch #134 supplier
  directory locale/a11y, Batch #133 breadcrumb locale/a11y, Batch #132 public
  offer locale/a11y, Batch #131 Pulse disclosure, Batch #130 supplier profile
  mobile accessibility, Batch #129 offer detail mobile accessibility, Batch
  #128 registration accessibility, Batch #127 blog tap targets, Batch #126
  skip-to-main behavior and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/offer-detail/SupplierTrustPanel.access.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/offer-detail-supplier-trust-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #136: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #136: `355.47 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #136: `324.98 kB` minified and `102.16 kB`
  gzip.
- OfferDetail route chunk after Batch #136: `51.78 kB` minified and `12.87 kB`
  gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 248 tests.
- GitHub `Core Type And Build Gate` passed on PR #188 in 11m57s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Offer detail supplier trust locale/a11y status
5. Offer detail behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
