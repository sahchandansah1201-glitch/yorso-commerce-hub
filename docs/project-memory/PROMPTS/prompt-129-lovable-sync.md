# Prompt #129: Lovable Sync For Offer Detail Mobile Accessibility

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `f81ee18`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #129, then verify that
the offer detail buyer decision route keeps named gallery controls, mobile-safe
44px target zones, accessible disclosure states and the existing access-gated
buyer-first flow. Do not change offer data, route behavior, buyer copy,
access gating, supplier identity redaction, exact-price locking, backend APIs,
Supabase settings or data models.

Source of truth:
- GitHub `main`, commit `f81ee18` or newer.
- PR #180: [codex] Batch #129 offer detail mobile accessibility.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is mobile accessibility/scanability hardening for `/offers/:id`,
  not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier pages, offer detail, how-it-works, blog, auth pages, registration pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change offer copy, CTA labels, CTA destinations, route flow, analytics hooks, offer data, gallery assets or visual styling beyond the synced semantic and target-size attributes.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics, Batch #123 public input accessibility, Batch #124 public heading structure, Batch #125 public landmark labels, Batch #126 skip-to-main target, Batch #127 blog mobile tap targets or Batch #128 auth/registration accessibility.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/offer-detail/PhotoGallery.tsx`:
   - uses `useLanguage()` for locale-owned EN/RU/ES gallery control labels;
   - names previous, next, open-gallery, thumbnail, close-gallery and lightbox navigation buttons;
   - keeps main image previous/next/open-gallery controls mobile visible and at least 44px by 44px;
   - keeps desktop hover behavior for those controls;
   - marks mobile scan targets with `data-offer-detail-mobile-target`.
2. `src/i18n/translations.ts`:
   - includes EN/RU/ES keys for:
     `offerDetail_gallery_previous`,
     `offerDetail_gallery_next`,
     `offerDetail_gallery_open`,
     `offerDetail_gallery_close`,
     `offerDetail_gallery_thumbnail`.
3. `src/pages/OfferDetail.tsx`:
   - keeps the back-to-catalog control at least 44px by 44px on mobile;
   - keeps breadcrumb links mobile-safe while preserving destinations;
   - marks these controls with `data-offer-detail-mobile-target`.
4. `src/components/offer-detail/OfferSummary.tsx`:
   - keeps delivery-basis options mobile-safe in locked and unlocked states;
   - does not change price locking, indicative range copy or delivery-basis behavior.
5. `src/components/offer-detail/SupplierTrustPanel.tsx`:
   - verification scope disclosure has `aria-expanded`;
   - the disclosure target is mobile-safe;
   - supplier identity redaction remains unchanged.
6. `src/components/offer-detail/FullSpecifications.tsx`:
   - full specifications disclosure has `aria-expanded`;
   - the disclosure target is mobile-safe.
7. `e2e/offer-detail-mobile-a11y.spec.ts` exists and checks `/offers/:id` at 390px:
   - named gallery controls and thumbnails;
   - marked offer detail mobile targets are visible and at least 44px by 44px;
   - zero unnamed visible buttons;
   - zero nested interactive controls;
   - zero horizontal overflow;
   - lightbox close action remains named after opening the gallery.
8. `package.json` includes:
   - `smoke:e2e:offer-detail-mobile-a11y`;
   - `smoke:e2e:offer-detail-mobile-a11y:run`;
   - `e2e/offer-detail-mobile-a11y.spec.ts` in `smoke:e2e:run`.
9. `docs/backend/production-scale-baseline.md` includes the Batch #129 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/offers/00000000-0000-0000-0000-000000000001` or an equivalent offer detail route renders at mobile 390px.
- Confirm `Previous offer photo`, `Next offer photo`, `Open offer photo gallery` and thumbnail controls are named in English mode.
- Confirm the same gallery control labels are locale-owned in RU/ES and do not hardcode English.
- Confirm every `[data-offer-detail-mobile-target]` on the offer detail route has a box of at least 44px by 44px at 390px.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`, `a a`, `button button`.
- Confirm there are zero unnamed visible buttons.
- Confirm opening the gallery shows a named close action.
- Confirm offer access gating, supplier identity redaction, price lock, sticky CTA, return-to-catalog behavior and unknown-offer fallback are unchanged.
- Confirm Batch #128 registration accessibility, Batch #127 blog tap targets, Batch #126 skip-to-main behavior and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/offer-detail-mobile-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #129: `126.72 kB` minified and `21.00 kB` gzip.
- Entry chunk after Batch #129: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #129: `315.30 kB` minified and `99.25 kB` gzip.
- OfferDetail route chunk after Batch #129: `49.03 kB` minified and `12.56 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 233 tests.
- GitHub `Core Type And Build Gate` passed on PR #180 in 12m46s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Offer detail mobile accessibility status
5. Offer detail buyer decision scanability status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
