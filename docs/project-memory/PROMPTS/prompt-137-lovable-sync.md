# Prompt #137: Lovable Sync For Offer Detail Decision Support Locale A11y

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `15fc5f8`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #137, then verify that
the lower public offer-detail buyer decision-support blocks use locale-owned
copy and preserve the locked-buyer price/supplier access contract. This is
buyer trust-route locale/accessibility hardening, not a redesign.

Source of truth:
- GitHub `main`, commit `15fc5f8` or newer.
- PR #189: [codex] Batch #137 offer detail decision support locale a11y.
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
  photo gallery, return-to-catalog behavior or supplier approval bridge.
- Do not make similar offer/product recommendations reveal exact prices for
  anonymous or registered-locked buyers.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#136 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/OfferDetail.tsx`:
   - passes effective `renderAccessLevel` into `TrustSection`, `SimilarOffers`
     and `SimilarProducts`;
   - keeps the existing offer detail shell, access banners, sticky mobile CTA,
     `SupplierAccessRequestPanel`, Market Pulse, SEO and return behavior.
2. `src/components/offer-detail/TrustSection.tsx`:
   - uses `useLanguage()` and `interpolate`;
   - localizes the lower trust explanation section title and evidence copy;
   - shows direct supplier relationship copy only for `qualified_unlocked`;
   - uses locked direct-contact copy for anonymous/registered-locked buyers;
   - exposes `data-testid="offer-trust-section"`.
3. `src/components/offer-detail/FullSpecifications.tsx`:
   - localizes `Full specifications` and all specification row labels;
   - keeps the existing disclosure behavior;
   - exposes `aria-expanded`, `aria-controls` and
     `data-testid="offer-full-specifications"`.
4. `src/components/offer-detail/SimilarOffers.tsx`:
   - localizes section heading, subtitle and comparison reasons;
   - uses localized link/image accessible names;
   - skips `Lower price` reason for locked buyers;
   - renders exact `priceRange` only when access is `qualified_unlocked`;
   - renders `t.offerDetail_priceLocked_label` for locked buyers;
   - exposes `data-testid="offer-similar-offers"` and
     `data-offer-detail-decision-target="similar-offer"`.
5. `src/components/offer-detail/SimilarProducts.tsx`:
   - localizes section heading, subtitle and relevance labels;
   - uses localized link/image accessible names;
   - renders exact `priceRange` only when access is `qualified_unlocked`;
   - renders `t.offerDetail_priceLocked_label` for locked buyers;
   - exposes `data-testid="offer-similar-products"` and
     `data-offer-detail-decision-target="similar-product"`.
6. `src/components/offer-detail/RelatedArticles.tsx`:
   - converts related insight cards into React Router `<Link>` elements to
     `/blog/:slug`;
   - localizes section heading, subtitle, category labels and relevance labels;
   - uses localized link accessible names;
   - exposes `data-testid="offer-related-insights"` and
     `data-offer-detail-decision-target="related-insight"`.
7. `src/components/offer-detail/DecisionFAQ.tsx`:
   - removes the hardcoded English FAQ array;
   - reads localized FAQ items from `t.offerDetail_decisionFaqItems`;
   - exposes `aria-expanded`, `aria-controls`,
     `data-testid="offer-decision-faq"` and
     `data-offer-detail-decision-target="decision-faq"`.
8. `src/i18n/translations.ts`:
   - includes typed EN/RU/ES keys for lower offer-detail decision support:
     trust section copy, full specification labels, similar offer/product
     headings and reasons, related insight labels and decision FAQ items.
9. `src/components/offer-detail/DecisionSupport.locale.test.tsx`:
   - guards RU/ES localized decision-support labels;
   - guards related insight links;
   - guards FAQ disclosure state;
   - guards locked-price copy and no raw exact-price leakage.
10. `e2e/offer-detail-decision-support-locale-a11y.spec.ts`:
   - covers `/offers/00000000-0000-0000-0000-000000000001` at 390px in RU/ES;
   - verifies localized lower decision-support labels;
   - verifies locked similar offer/product prices;
   - verifies related insights are links;
   - verifies FAQ target height, `aria-expanded`, zero nested controls and zero
     horizontal overflow.
11. `package.json`:
   - includes `smoke:e2e:offer-detail-decision-support-locale-a11y`;
   - includes `smoke:e2e:offer-detail-decision-support-locale-a11y:run`;
   - includes the spec in `smoke:e2e:run`.
12. `docs/backend/production-scale-baseline.md`:
   - includes Batch #137 and documents that this frontend-only semantic/access
     hardening adds no backend reads/writes, queues, polling, database changes
     or new runtime volume for the 10,000 concurrent-user baseline.

Verification to run in Lovable:
- Confirm `/offers/00000000-0000-0000-0000-000000000001` renders in Russian and
  Spanish.
- Confirm the lower decision-support sections no longer expose these hardcoded
  English labels in RU/ES UI:
  `Why this offer is safe`, `Full specifications`, `Catching method`,
  `Compare alternatives`, `Explore similar products`,
  `Related market insights`, `Buying guide`, `Same species`,
  `Frequently asked questions`, `Lower price`.
- Confirm RU shows localized labels including:
  `Почему это предложение безопаснее проверять`, `Полная спецификация`,
  `Метод добычи`, `Сравнить альтернативы`, `Похожие продукты`,
  `Связанная рыночная аналитика`, `Тот же вид`,
  `Вопросы перед запросом доступа`.
- Confirm ES shows localized labels including:
  `Por qué esta oferta es segura para revisar`, `Especificación completa`,
  `Método de captura`, `Comparar alternativas`, `Productos similares`,
  `Análisis de mercado relacionado`, `Misma especie`,
  `Preguntas antes de solicitar acceso`.
- Confirm locked buyers see localized locked price labels in similar
  offer/product cards and do not see raw exact price strings such as `$5.80`,
  `$6.40`, `$8.50`, `$9.20` or `$11.00`.
- Confirm related insight cards are links to `/blog/:slug`, not inert clickable
  divs.
- Confirm FAQ buttons expose `aria-expanded`, `aria-controls` and mobile target
  height of at least 44px.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm offer detail access gating, supplier identity redaction, exact-price
  lock, supplier access request panel, Market Pulse, route SEO and buyer-first
  offer detail copy are unchanged.
- Confirm Batch #136 supplier trust locale/a11y, Batch #135 supplier profile
  logo locale/a11y, Batch #134 supplier directory locale/a11y, Batch #133
  breadcrumb locale/a11y, Batch #132 public offer locale/a11y, Batch #131 Pulse
  disclosure, Batch #130 supplier profile mobile accessibility, Batch #129
  offer detail mobile accessibility, Batch #128 registration accessibility,
  Batch #127 blog tap targets, Batch #126 skip-to-main behavior and Batch #125
  landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/components/offer-detail/DecisionSupport.locale.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/offer-detail-decision-support-locale-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #137: `126.84 kB` minified and `21.02 kB` gzip.
- Entry chunk after Batch #137: `355.47 kB` minified and `114.17 kB` gzip.
- i18n-translations after Batch #137: `340.35 kB` minified and `106.73 kB`
  gzip.
- OfferDetail route chunk after Batch #137: `51.80 kB` minified and `12.06 kB`
  gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 250 tests.
- GitHub `Core Type And Build Gate` passed on PR #189 in 12m23s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Offer detail decision-support locale/a11y status
5. Offer detail locked-buyer behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
