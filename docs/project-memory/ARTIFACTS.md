# Artifacts

## Project Memory

- `AGENTS.md`: project-level agent rules.
- `docs/project-memory/README.md`: protocol for preventing chat context loss.
- `docs/project-memory/CONTEXT_HEALTH.md`: context-risk checkpoint.
- `docs/project-memory/PROJECT_STATE.yaml`: structured current state.
- `docs/project-memory/HANDOFF.md`: handoff for a new chat.
- `docs/project-memory/NEXT_ACTIONS.md`: next safe actions.
- `docs/project-memory/WORKLOG.md`: factual work log.
- `docs/project-memory/RISKS.md`: active risks and mitigations.
- `docs/project-memory/LOVABLE_PROGRESS.md`: русскоязычный план/факт tracker
  для prompt-ов и ответов Lovable по batch.
- `docs/project-memory/PROMPTS/new-chat-recovery-prompt.md`: prompt for recovery in a new chat.
- `docs/project-memory/templates/`: reusable templates.

## Core Project Files

- `README.md`: project readme.
- `package.json`: scripts and dependencies.
- `src/`: frontend source.
- `apps/`: application/runtime area if present.
- `packages/`: shared packages.
- `infra/`: infrastructure area.
- `supabase/`: Supabase boundary/migration area.
- `e2e/`: end-to-end tests.

## Backend Phase 0 Closure Audit

- `docs/backend/phase-0-closure-audit.md`: Phase 0 closure audit, exit
  criteria status, gate results and remediation result.
- `docs/backend/frontend-backend-contract.md`: route-to-data-source contract
  updated to cover current `src/App.tsx` public, account, info/legal, dashboard,
  admin, redirect, dev and `*` routes.
- `.tmp/phase0-vitest.json`: local transient Vitest JSON report used to extract
  the known failure list; not a source artifact and not intended for commit.

## Backend Phase 0 Remediation

- `src/i18n/homepage-cards-faq-ru.test.tsx`: updated homepage offer-card RU
  coverage to the current clickable-card contract.
- `src/i18n/no-english-leak.ru.test.tsx`,
  `src/i18n/locale-all-routes-ru.test.tsx`,
  `src/i18n/locale-persists-across-routes.test.tsx`,
  `src/i18n/locale-footer-links-ru.test.tsx`,
  `src/i18n/locale-notfound-testid-ru.test.tsx` and
  `src/i18n/locale-persists-e2e-clicks.test.tsx`: aligned stale RU route,
  footer, NotFound and semantic CTA expectations with the current public UI.
- `src/i18n/locale-post-signin-account-screens-ru.test.tsx` and
  `src/i18n/locale-survives-signin.test.tsx`: pin auth locale persistence
  renders to the local auth contract.
- `src/i18n/offers-numeric-format-ru.test.tsx`: covers qualified catalog
  numeric formatting through stable catalog row test ids.
- `src/components/catalog/CatalogOfferRow.tsx`,
  `src/components/catalog/CatalogOfferCard.tsx` and
  `src/components/catalog/MobileOfferCard.tsx`: exact prices for qualified
  buyers now use active-locale `formatPrice`.
- `src/components/catalog/CatalogFilters.tsx`: category option and active-chip
  labels are localized while filter values remain unchanged.
- `src/components/catalog/CatalogOfferRow.analyticsLiveRegion.test.tsx`: RU
  live-region coverage now initializes the active locale.
- `src/lib/registration-funnel.e2e.test.tsx`: registration funnel coverage
  mounts the required buyer-session provider.
- `src/test/offer-detail-access.test.ts`: Supabase-backed list/detail access
  smoke is bounded and still hard-fails on `42501` privilege regressions.
- `src/test/rls-public-access.test.ts`: RLS public access smoke is bounded and
  still hard-fails on `42501` insufficient privilege.

## Backend Phase 1 Account Source Of Truth Discovery Audit

- `docs/backend/phase-1-account-source-of-truth-discovery-audit.md`: discovery
  audit for Phase 1 Account Source Of Truth, including source-of-truth map,
  confirmed backend strengths, local-first frontend gaps, Phase 1 exit
  criteria, Phase 1A recommended scope and 10,000 concurrent-user baseline.
- `src/lib/buyer-session.ts`, `src/lib/auth-runtime.ts`,
  `src/lib/account-store.ts`, `src/lib/account-api.ts`,
  `src/pages/account/Account.tsx` and
  `src/components/account/AccountShell.tsx`: audited frontend session/account
  files showing the current local-first account workspace behavior.
- `apps/api/src/modules/auth/*`, `apps/api/src/modules/account/*`,
  `packages/contracts/src/auth.ts`,
  `packages/contracts/src/account-session.ts` and
  `packages/contracts/src/account-company.ts`: audited self-hosted backend and
  shared contract files showing existing account/session authority.
- `packages/db/migrations/0001_account_company_baseline.sql`,
  `0002_account_workspace_sections.sql`,
  `0003_account_files_and_documents.sql`, `0011_auth_sessions.sql` and
  `0012_auth_security_events.sql`: audited account/company/workspace/file/auth
  persistence baseline.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md` and `RISKS.md`: project
  memory checkpoint moving next action to Backend Phase 1A Account Session
  Authority Gate.

## Backend Phase 1A Account Session Authority Gate

- `docs/backend/phase-1-account-session-authority-gate.md`: implementation
  note, Russian plan/fact table and 10,000 concurrent-user baseline for the
  account session authority gate.
- `src/pages/account/Account.tsx`: API-enabled account routes now validate
  `readCurrentAuthSession()` before rendering editable account sections, hydrate
  account data through a session-bound account API client, redirect
  missing/invalid sessions to `/signin`, show a backend-unavailable state on
  account load failure and save remote-first in API mode.
- `src/components/account/AccountShell.tsx`: account shell source note now
  distinguishes local prototype mode from self-hosted backend mode.
- `src/i18n/translations.ts`: EN/RU/ES copy for account loading,
  backend-source, backend-unavailable, retry and remote-save-failed states.
- `src/pages/account/Account.test.tsx`: regression coverage for backend session
  validation, backend account authority, missing-session redirect and
  backend-unavailable fail-closed state.
- `src/pages/account/Account.editable.test.tsx`: regression coverage for
  remote-first account save with session/user headers and no localStorage
  success before backend success.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1A capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Phase 1A checkpoint.

## Backend Phase 1B Account Section-Scoped Mutations

- `docs/backend/phase-1-account-section-scoped-mutations.md`: implementation
  note, Russian plan/fact table and 10,000 concurrent-user baseline for
  section-scoped account mutations.
- `src/lib/account-api.ts`: section-scoped sync helper, personal/company
  update helpers and row-level workspace collection diff sync for branches,
  products, meta-regions and notifications.
- `src/pages/account/Account.tsx`: account sections now pass section ownership
  into API-mode saves; collection forms wait for backend success before
  closing and show localized inline errors on remote failure.
- `src/lib/account-api.test.ts`: endpoint-granularity coverage for personal,
  company, branch, product, meta-region and notification section sync.
- `src/pages/account/Account.editable.test.tsx`: API-mode UI coverage for
  personal scoped save and branch row-level create.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1B capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`, `RISKS.md`: Phase 1B
  checkpoint.

## Backend Phase 1I Account Workspace Aggregate Read

- `docs/backend/phase-1-account-workspace-aggregate-read.md`: implementation
  note, Russian plan/fact table and 10,000 concurrent-user baseline for the
  account workspace aggregate read.
- `packages/contracts/src/account-company.ts`: shared
  `accountWorkspaceSnapshotSchema` and `AccountWorkspaceSnapshot` type.
- `apps/api/src/modules/account/routes.ts`: read-only
  `GET /v1/account/workspace` endpoint behind the existing account session
  authority.
- `apps/api/src/modules/account/service.ts`,
  `apps/api/src/modules/account/repository.ts` and
  `apps/api/src/modules/account/postgres-repository.ts`: account workspace
  snapshot service/repository boundary; PostgreSQL implementation uses one
  scoped SQL query with JSON aggregation and account-version calculation.
- `src/lib/account-api.ts`: self-hosted account hydration now calls
  `/v1/account/workspace` instead of six account section endpoints.
- `apps/api/src/server.test.ts`,
  `apps/api/src/modules/account/__tests__/repository.test.ts`,
  `src/lib/account-api.test.ts`,
  `src/pages/account/Account.test.tsx` and
  `src/pages/account/Account.editable.test.tsx`: aggregate endpoint,
  repository and frontend hydration coverage.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1I capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Phase 1I checkpoint.

## Backend Phase 1J Account Source Of Truth Closure Audit

- `docs/backend/phase-1-account-source-of-truth-closure-audit.md`: closure
  audit for Backend Phase 1 Account Source Of Truth, including Russian
  plan/fact table, exit criteria status, implementation map, remaining product
  debt outside Phase 1 and the 10,000 concurrent-user review.
- `docs/backend/frontend-backend-contract.md`: updated account route/data-source
  contract so `/account/*` points to the self-hosted account workspace snapshot
  in API-enabled production, with localStorage/mock limited to API-disabled
  preview mode.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Phase 1J checkpoint.
- Validation passed:
  `npm run check:self-hosted-production-runtime`,
  `npm run check:production-scale-baseline`, `npm run lint`,
  `git diff --check`.

## Backend Phase 1D Account Strict Precondition Policy

- `docs/backend/phase-1-account-strict-precondition-policy.md`:
  implementation note, Russian plan/fact table and 10,000 concurrent-user
  baseline for strict account version preconditions.
- `apps/api/src/config.ts`: `ACCOUNT_VERSION_PRECONDITION_MODE=optional|required`
  config, local/dev/test optional default and production self-hosted required
  guard.
- `apps/api/src/server.ts`: passes the account version precondition mode into
  account route handling.
- `apps/api/src/modules/account/routes.ts`: strict mode rejects normal
  `/v1/account/*` mutations missing `x-yorso-account-version` as
  `428 account_version_required` while preserving Phase 1C stale-version
  `409 account_snapshot_conflict`.
- `apps/api/src/server.test.ts`: strict missing-header API regression and
  production config guard.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1D capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`, `RISKS.md`: Phase 1D
  checkpoint.

## Backend Phase 1E Account Media/Document Version Boundary

- `docs/backend/phase-1-account-media-document-version-boundary.md`:
  implementation note, Russian plan/fact table and 10,000 concurrent-user
  baseline for account-owned media/document version preconditions.
- `apps/api/src/modules/account/version-precondition.ts`: shared
  `x-yorso-account-version` reader and strict missing-header guard.
- `apps/api/src/modules/account/routes.ts`: uses the shared precondition
  helper.
- `apps/api/src/modules/account/repository.ts`,
  `service.ts` and `postgres-repository.ts`: account snapshot version can be
  touched after storage mutations and PostgreSQL version includes file/document
  timestamps.
- `apps/api/src/modules/storage/routes.ts`: document list/create and company
  media upload responses include `accountVersion`; strict/stale storage POST
  routes return `428 account_version_required` / `409 account_snapshot_conflict`.
- `apps/api/src/server.ts`: passes account version precondition mode into
  storage route handling.
- `apps/api/src/server.test.ts`: strict media/document precondition and stale
  storage mutation coverage.
- `src/lib/account-api.ts` and `src/lib/account-api.test.ts`: frontend account
  API storage responses carry `accountVersion`, and document create sends the
  version learned from document list.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1E capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Phase 1E checkpoint with
  full release validation passed.

## Backend Phase 1F Account Storage Client Authority Boundary

- `docs/backend/phase-1-account-storage-client-authority-boundary.md`:
  implementation note, Russian plan/fact table and 10,000 concurrent-user
  baseline for account storage client authority.
- `src/lib/account-api.ts`: enabled self-hosted account API clients fail with
  `account_api_session_required` before fetch when no explicit/session/configured
  user id exists.
- `src/components/account/CompanyDocumentsCard.tsx`: accepts an optional
  account API client instead of always creating an implicit enabled client.
- `src/pages/account/Account.tsx`: passes the validated session-bound account
  client into company documents.
- `src/lib/account-api.test.ts`: guards no demo fallback in enabled mode and
  updates file URL expectations with session id.
- `src/pages/account/Account.editable.test.tsx`: guards document list headers in
  self-hosted account mode.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1F capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Phase 1F checkpoint with
  full release validation passed.

## Backend Phase 1G Account Storage Transaction Boundary

- `docs/backend/phase-1-account-storage-transaction-boundary.md`:
  implementation note, Russian plan/fact table and 10,000 concurrent-user
  baseline for account storage transaction/outbox decision.
- `apps/api/src/modules/storage/object-storage.ts`: object storage contract now
  supports `deleteObject`; local storage deletes both object and metadata
  sidecar.
- `apps/api/src/modules/storage/repository.ts`: file repository contract now
  includes `createCompanyDocumentWithFileAsset` and `deleteFileAssetForUser`.
- `apps/api/src/modules/storage/postgres-repository.ts`: document upload
  metadata writes file asset and company document rows in one atomic SQL CTE
  statement.
- `apps/api/src/modules/storage/service.ts`: upload paths delete object bytes
  when metadata persistence fails.
- `apps/api/src/modules/storage/routes.ts`: media upload cleans up the newly
  created asset/object if company profile update fails after asset creation.
- `apps/api/src/modules/storage/__tests__/storage.test.ts`: guards atomic
  document metadata SQL and object cleanup after metadata failure.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1G capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`, `RISKS.md`: Phase 1G
  checkpoint with full release validation passed.

## Backend Phase 1H Account Workspace Replace Transaction Boundary

- `docs/backend/phase-1-account-workspace-replace-transaction-boundary.md`:
  implementation note, Russian plan/fact table and 10,000 concurrent-user
  baseline for bulk account workspace collection replacement.
- `apps/api/src/modules/account/postgres-repository.ts`: branch, product,
  meta-region and notification replacement methods now run one atomic
  PostgreSQL CTE statement per collection.
- `apps/api/src/modules/account/__tests__/repository.test.ts`: fake
  PostgreSQL client and repository assertions now cover the CTE replacement
  shape.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1H capacity note.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`, `RISKS.md`: Phase 1H
  checkpoint with full release validation passed.

## Batch #141 Public Sheet Close Locale A11y

- `src/components/ui/sheet.tsx`: shared `SheetContent` accepts optional
  `closeLabel` while preserving the previous English fallback.
- `src/components/catalog/CompareTray.tsx`: comparison bottom sheet passes the
  active locale's `t.aria_close` to the shared sheet close control.
- `src/components/catalog/IntelligenceRail.tsx`: signal detail drawer passes
  the active locale's `t.aria_close` to the shared sheet close control.
- `src/components/catalog/SheetCloseLocale.test.tsx`: unit guard for RU/ES
  CompareTray and IntelligenceRail close labels, including no default English
  `Close` leakage.
- `e2e/public-sheet-close-locale-a11y.spec.ts`: browser smoke for real
  `/offers` RU/ES comparison drawer close labels, locked-buyer state, nested
  controls and horizontal overflow.
- `package.json`: dedicated `smoke:e2e:public-sheet-close-locale-a11y` script
  and full `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #141 10,000 concurrent
  users capacity review.
- `docs/project-memory/PROMPTS/prompt-141-lovable-sync.md`: sync prompt for
  Batch #141 after PR #193 merge; user confirmed clean Lovable sync at `main`
  @ Batch #141, `5eafcb7` or newer.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Batch #141 merge and clean
  Lovable sync checkpoint.

## Batch #138 Public Info Route SEO

- `src/components/InfoPageLayout.tsx`: shared info/legal layout now applies
  localized route-owned title, description, canonical URL, OG/Twitter metadata
  and WebPage JSON-LD.
- `src/pages/About.tsx`, `Contact.tsx`, `Terms.tsx`, `Privacy.tsx`,
  `Cookies.tsx`, `GDPR.tsx`, `AntiFraud.tsx`, `Careers.tsx`, `Press.tsx`,
  `Partners.tsx`: pass existing localized intro copy and canonical path through
  the shared layout.
- `src/pages/InfoPageSeo.test.tsx`: unit guard for all 10 info/legal route SEO
  contracts and RU direct-entry metadata.
- `src/i18n/locale-document-meta-ru.test.tsx`: global metadata regression
  adjusted so info/legal routes can own route SEO.
- `e2e/public-info-route-seo.spec.ts`: 390px browser guard for localized
  info/legal route SEO, JSON-LD, direct back CTA, nested controls and overflow.
- `package.json`: dedicated `smoke:e2e:public-info-route-seo` script and full
  `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #138 10,000 concurrent
  users capacity review.
- `docs/project-memory/PROMPTS/prompt-138-lovable-sync.md`: sync prompt for
  Batch #138 after PR #190 merge; user confirmed clean Lovable sync at
  `main` @ Batch #138, `7eea5ce` or newer.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Batch #138 merge and clean
  Lovable sync checkpoint.

## Batch #139 Public Language Selector A11y

- `src/components/landing/Header.tsx`: public header language selector now has
  localized programmatic purpose, current-language labels, named desktop/mobile
  language groups and `aria-pressed` selected-state on language options.
- `src/i18n/translations.ts`: EN/RU/ES keys for language selector purpose,
  current-language label and select-language label.
- `src/components/landing/Header.landmarks.test.tsx`: EN/RU/ES regression
  coverage for desktop and mobile language selector names and selected state.
- `src/i18n/aria-tooltips-localized.ru.test.tsx`: RU regression guard against
  English language-selector label leakage.
- `e2e/public-language-selector-a11y.spec.ts`: browser smoke for desktop and
  mobile language selector state, persistence, nested controls and 390px
  overflow across representative public routes.
- `package.json`: dedicated `smoke:e2e:public-language-selector-a11y` script
  and full `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #139 10,000 concurrent
  users capacity review.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Batch #139 draft PR
  checkpoint for PR #191.

## Batch #137 Offer Detail Decision Support Locale A11y

- `src/components/offer-detail/TrustSection.tsx`: localized lower trust
  explanation copy and locked/qualified direct supplier relationship text.
- `src/components/offer-detail/FullSpecifications.tsx`: localized disclosure
  title and specification row labels with `aria-controls`.
- `src/components/offer-detail/SimilarOffers.tsx`: localized recommendation
  headings/reasons, locked-price rendering for non-qualified buyers and
  localized link/image accessible names.
- `src/components/offer-detail/SimilarProducts.tsx`: localized product
  recommendation headings/reasons and locked-price rendering for non-qualified
  buyers.
- `src/components/offer-detail/RelatedArticles.tsx`: related insight cards are
  real links with localized labels, category/relevance text and accessible
  names.
- `src/components/offer-detail/DecisionFAQ.tsx`: localized FAQ items with
  `aria-expanded`, `aria-controls` and mobile-safe decision targets.
- `src/pages/OfferDetail.tsx`: passes effective `renderAccessLevel` into lower
  trust/recommendation blocks.
- `src/i18n/translations.ts`: typed EN/RU/ES decision-support translation
  contract for lower offer-detail sections.
- `src/components/offer-detail/DecisionSupport.locale.test.tsx`: unit guard for
  RU/ES decision-support locale, link and locked-price behavior.
- `e2e/offer-detail-decision-support-locale-a11y.spec.ts`: 390px browser guard
  for localized decision support, locked recommendation prices, FAQ target
  height, related links, nested controls and horizontal overflow.
- `package.json`: dedicated
  `smoke:e2e:offer-detail-decision-support-locale-a11y` script and full
  `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #137 10,000 concurrent
  users capacity review.
- `docs/project-memory/PROMPTS/prompt-137-lovable-sync.md`: sync prompt for
  Batch #137 after PR #189 merge; user confirmed clean Lovable sync at
  `main` @ Batch #137, `15fc5f8` or newer.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`,
  `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Batch #137 merge and clean
  Lovable sync checkpoint.

## Batch #136 Offer Detail Supplier Trust Locale A11y

- `src/components/offer-detail/SupplierTrustPanel.tsx`: localized supplier trust status labels, review disclosure labels, mini-stat labels, evidence labels and qualified-buyer CTAs for EN/RU/ES.
- `src/i18n/translations.ts`: typed EN/RU/ES `offerDetail_*` supplier trust keys, including verified/pending copy, review toggle labels, years-in-business plural templates and CTA labels.
- `src/lib/supplier-i18n.ts`: interpolation/pluralization helper now documented for public supplier/trust surfaces.
- `src/pages/OfferDetail.tsx`: route shells use `overflow-x-hidden` to keep expanded trust disclosure content from causing mobile horizontal overflow.
- `src/components/offer-detail/SupplierTrustPanel.access.test.tsx`: unit guard for RU/ES localized supplier trust labels and qualified CTAs.
- `e2e/offer-detail-supplier-trust-locale-a11y.spec.ts`: mobile browser guard for RU/ES supplier trust labels, disclosure target height, zero nested controls and zero horizontal overflow.
- `package.json`: dedicated `smoke:e2e:offer-detail-supplier-trust-locale-a11y` script and full `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #136 10,000 concurrent users capacity review.
- `docs/project-memory/PROMPTS/prompt-136-lovable-sync.md`: sync confirmation prompt for Batch #136 after PR #188 merge; user confirmed clean sync at `main` @ Batch #136, `3720708` or newer.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`, `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Batch #136 merge and Lovable sync checkpoint.

## Batch #134 Supplier Directory Locale A11y

- `src/i18n/translations.ts`: EN/RU/ES supplier-row trust labels and supplier image alt templates.
- `src/components/suppliers/SupplierRow.tsx`: localized supplier signals, product catalog preview and delivery markets preview accessible names, plus localized supplier row image alt text.
- `src/components/suppliers/SelectedSupplierPanel.tsx`: localized selected supplier panel image alt text.
- `src/pages/Suppliers.tsx`: selected supplier aside uses the locale-owned selected supplier label.
- `src/pages/Suppliers.i18n.test.tsx`: RU regression coverage for supplier directory trust labels and image alt text with English leakage guards.
- `src/components/suppliers/__snapshots__/SupplierRow.snapshot.test.tsx.snap`: snapshot synced to the current mobile-safe SupplierRow DOM contract.
- `e2e/suppliers-directory-locale-a11y.spec.ts`: mobile browser guard for `/suppliers` RU locale trust labels, image alt text and zero horizontal overflow.
- `package.json`: dedicated `smoke:e2e:suppliers-directory-locale-a11y` script and full `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #134 10,000 concurrent users capacity review.
- `docs/project-memory/PROMPTS/prompt-134-lovable-sync.md`: Lovable sync prompt for Batch #134 after PR #186 merge; user confirmed clean sync at `main` @ Batch #134, `6cd21e9` or newer.

## Batch #132 Public Offer Locale A11y Hardening

- `src/components/catalog/MobileOfferCard.tsx`: localized mobile offer details aria-label, delivery-basis aria-label and mixed-orientation photo hint copy.
- `src/components/catalog/CatalogOfferRow.locale.test.tsx`: regression coverage for English mobile offer labels and no Russian aria leakage.
- `src/components/offer-detail/OfferSummary.tsx`: localized stock, inventory, capacity, certification, delivery-basis, min-lot and locked price/supplier summary labels.
- `src/components/offer-detail/OfferSummary.locale.test.tsx`: regression coverage for English offer-detail summary labels and no Russian visible/programmatic leakage.
- `src/i18n/translations.ts`: EN/RU/ES keys for public offer mobile card and offer-detail summary labels.
- `e2e/public-offer-locale-a11y.spec.ts`: mobile browser guard for `/offers` and `/offers/:id` English locale accessible names.
- `e2e/public-pulse-disclosure.spec.ts`: compact Pulse badge contract aligned with current `main`: visible activity count, programmatic estimate disclosure, no visible compact estimate chip.
- `package.json`: dedicated `smoke:e2e:public-offer-locale-a11y` script and full `smoke:e2e:run` wiring.
- `docs/backend/production-scale-baseline.md`: Batch #132 10,000 concurrent users capacity review.
- `docs/project-memory/PROMPTS/prompt-132-lovable-sync.md`: sync confirmation prompt for Batch #132 after PR #184 merge; user confirmed clean sync at `d1bf472`.

## Batch #111 Public Route SEO

- `src/lib/seo.ts`: route-owned SEO marker, canonical/social metadata helpers and global SEO restoration.
- `src/lib/public-route-seo.ts`: shared public route OG image, locale and title helpers.
- `src/pages/Index.tsx`: homepage route-owned SEO, canonical, OG/Twitter and WebSite/WebPage JSON-LD.
- `src/pages/Offers.tsx`: offer catalog route-owned SEO and CollectionPage/Breadcrumb JSON-LD.
- `src/pages/Suppliers.tsx`: supplier directory route-owned SEO with no exact supplier company-name leakage in metadata.
- `src/pages/HowItWorks.tsx`: route-owned SEO marker, canonical, OG/Twitter metadata and restored global cleanup.
- `src/pages/ForSuppliers.tsx`: route-owned SEO marker and restored global cleanup for the existing supplier SEO graph.
- `src/i18n/translations.ts`: buyer-first global meta descriptions in EN/RU/ES.
- `src/components/landing/Hero.tsx`: homepage H1 text boundary fix for readable textContent.
- `src/pages/PublicRouteSeo.test.tsx`: regression coverage for public route SEO, localization and supplier-name leak prevention.
- `docs/project-memory/PROMPTS/prompt-111-lovable-sync.md`: Lovable sync prompt for Batch #111.

## Batch #112 Route Code Splitting

- `src/App.tsx`: route page components are loaded with `React.lazy` and rendered under a route-level `Suspense` fallback.
- `vite.config.ts`: production build splits the local `src/i18n/translations.ts` table into the named `i18n-translations` chunk.
- `src/test/app-route-code-splitting.test.ts`: static guard against reintroducing eager route page imports and losing the translation chunk rule.
- `docs/backend/production-scale-baseline.md`: Batch #112 10,000 concurrent users capacity review for frontend route chunking.
- `docs/project-memory/PROMPTS/prompt-112-lovable-sync.md`: Lovable sync prompt for Batch #112.

## Batch #113 Route Chunk Error Boundary

- `src/components/routing/RouteChunkErrorBoundary.tsx`: route-level error boundary with reload and go-back recovery actions.
- `src/components/routing/RouteChunkErrorBoundary.test.tsx`: focused regression coverage for normal route rendering and fallback recovery.
- `src/App.tsx`: lazy routes are wrapped in `RouteChunkErrorBoundary`.
- `src/test/app-route-code-splitting.test.ts`: static route-shell guard includes error-boundary wiring.
- `docs/backend/production-scale-baseline.md`: Batch #113 10,000 concurrent users capacity review for route chunk failure handling.
- `docs/project-memory/PROMPTS/prompt-113-lovable-sync.md`: Lovable sync prompt for Batch #113.

## Batch #114 Font Loading Cleanup

- `index.html`: document-head Google Fonts preconnect and stylesheet loading for Inter plus Plus Jakarta Sans.
- `src/index.css`: typography contract without blocking Google Fonts CSS `@import`.
- `src/test/font-loading.test.ts`: static guard for font loading path and body/heading font families.
- `docs/backend/production-scale-baseline.md`: Batch #114 10,000 concurrent users capacity review for font loading.
- `docs/project-memory/PROMPTS/prompt-114-lovable-sync.md`: Lovable sync prompt for Batch #114.

## Batch #115 Catalog Locale Hardening

- `src/lib/catalog-display-labels.ts`: maps legacy redacted price labels to the active locale display label.
- `src/lib/catalog-display-labels.test.ts`: regression coverage for legacy redacted label normalization.
- `src/components/catalog/CatalogOfferRow.tsx`: localized desktop locked-price and analytics trigger copy.
- `src/components/catalog/CatalogOfferRow.locale.test.tsx`: regression coverage against Russian locked-price and analytics leaks in the English catalog row.
- `src/components/catalog/CatalogOfferRow.analyticsA11y.test.tsx`: updated analytics trigger a11y contract for active-locale copy.
- `src/components/catalog/MobileOfferCard.tsx`: localized mobile locked-price and trend analytics labels.
- `src/components/catalog/MobileOfferCard.analyticsToggle.test.tsx`: updated mobile analytics trigger contract for active-locale copy.
- `src/i18n/translations.ts`: EN/RU/ES catalog analytics trigger labels and hints.
- `docs/backend/production-scale-baseline.md`: Batch #115 10,000 concurrent users capacity review for catalog locale hardening.
- `docs/project-memory/PROMPTS/prompt-115-lovable-sync.md`: Lovable sync prompt for Batch #115; user confirmed clean sync at `040e17b9`.

## Batch #116 Offers Proof Anchor Fallback

- `src/components/catalog/TrustProofStrip.tsx`: visible-anchor resolution and mobile fallback for proof-strip navigation.
- `src/components/catalog/TrustProofStrip.test.tsx`: focused regression coverage for hidden intelligence fallback and document-readiness target.
- `e2e/offers-trust-proof-anchors.spec.ts`: browser-level mobile guard for proof-strip clicks landing on visible offer evidence.
- `package.json`: `smoke:e2e:offers-catalog:run` includes the trust-proof anchor e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #116 10,000 concurrent users capacity review for proof-strip scroll behavior.
- `docs/project-memory/PROMPTS/prompt-116-lovable-sync.md`: Lovable sync prompt for Batch #116; user confirmed clean sync at `3bca7961`.

## Batch #117 Offers Request Anchor

- `src/pages/Offers.tsx`: stable `#request` anchor around the catalog access/value strip, hash-preserving catalog URL normalization and hash-scroll after render.
- `src/pages/HowItWorks.tsx`: hero request-access CTA points to `/offers#request` through a structured React Router target.
- `src/components/how-it-works/FinalCTA.tsx`: final buyer request-access CTA points to `/offers#request` through a structured React Router target.
- `e2e/how-it-works-request-anchor.spec.ts`: browser-level mobile guard for `/how-it-works` request CTA and direct `/offers#request` entry.
- `package.json`: `smoke:e2e:run` includes the `/how-it-works` request anchor e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #117 10,000 concurrent users capacity review for hash preservation and request-anchor landing.
- `docs/project-memory/PROMPTS/prompt-117-lovable-sync.md`: Lovable sync prompt for Batch #117; user confirmed clean sync on main on top of Batch #117 `c2c5ff3`.

## Batch #118 For-Suppliers CTA Semantics

- `src/pages/ForSuppliers.tsx`: supplier hero and final CTAs use `Button asChild` instead of nested `Link` plus `Button`.
- `src/pages/ForSuppliers.test.tsx`: regression coverage against nested `a button` / `button a` CTA markup.
- `e2e/for-suppliers-cta-semantics.spec.ts`: mobile browser guard for visible supplier CTAs, zero nested interactive controls and no horizontal overflow.
- `package.json`: `smoke:e2e:run` includes the for-suppliers CTA semantics e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #118 10,000 concurrent users capacity review for CTA semantics.
- `docs/project-memory/PROMPTS/prompt-118-lovable-sync.md`: Lovable sync prompt for Batch #118; user confirmed clean sync at `dc78e094`.

## Batch #119 Offers CTA Semantics

- `src/components/catalog/AccessLevelBanner.tsx`: locked-buyer account CTA uses `Button asChild`.
- `src/components/catalog/CatalogValueStrip.tsx`: locked-buyer value-strip CTA uses `Button asChild`.
- `src/components/catalog/RelatedRequests.tsx`: locked related-request response CTA uses `Button asChild`.
- `src/pages/Offers.catalogPaging.test.tsx`: regression coverage against nested `a button` / `button a` CTA markup on `/offers`.
- `e2e/offers-cta-semantics.spec.ts`: mobile browser guard for locked buyer CTA links, zero nested interactive controls, access gating and no horizontal overflow.
- `package.json`: offers-catalog and full e2e smoke scripts include the offers CTA semantics e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #119 10,000 concurrent users capacity review for offers CTA semantics.
- `docs/project-memory/PROMPTS/prompt-119-lovable-sync.md`: Lovable sync prompt for Batch #119; user confirmed clean sync at `851ad960` with no conflicts and no files modified.

## Batch #120 Auth CTA Semantics

- `src/pages/SignIn.tsx`: public sign-in back CTA uses `Button asChild` instead of nested `Link` plus `Button`.
- `src/pages/ResetPassword.tsx`: password-reset back CTA uses `Button asChild` instead of nested `Link` plus `Button`.
- `src/pages/AuthCtaSemantics.test.tsx`: regression coverage against nested `a button` / `button a` CTA markup on auth routes.
- `e2e/auth-cta-semantics.spec.ts`: mobile browser guard for sign-in and reset-password back links, zero nested interactive controls and no horizontal overflow.
- `package.json`: dedicated auth CTA semantics smoke script and full e2e smoke script include the auth e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #120 10,000 concurrent users capacity review for auth CTA semantics.
- `docs/project-memory/PROMPTS/prompt-120-lovable-sync.md`: Lovable sync prompt for Batch #120; user confirmed clean sync at `700d4484`.

## Batch #121 Offer Detail CTA Semantics

- `src/pages/OfferDetail.tsx`: offer detail error, not-found, locked access banner and sticky mobile CTAs use `Button asChild` instead of nested `Link` or hash-anchor plus `Button`.
- `src/components/offer-detail/OfferSummary.tsx`: anonymous price-lock CTA uses `Button asChild` for the `/register` link.
- `e2e/offer-detail-cta-semantics.spec.ts`: mobile browser guard for anonymous, registered-locked and unknown-offer states, zero nested interactive controls and no horizontal overflow.
- `package.json`: dedicated offer-detail CTA semantics smoke script and full e2e smoke script include the offer detail e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #121 10,000 concurrent users capacity review for offer detail CTA semantics.
- `docs/project-memory/PROMPTS/prompt-121-lovable-sync.md`: Lovable sync prompt for Batch #121; user confirmed clean sync at `9b8f9434`.

## Batch #122 Public CTA Semantics

- `src/components/landing/LiveOffers.tsx`: homepage desktop `View all offers` CTA uses `Button asChild` for the direct `/offers` link.
- `src/components/landing/OfferCard.tsx`: landing offer cards pass `interactive={false}` to certification proof chips.
- `src/components/CertificationBadges.tsx`: `interactive` prop supports static chips inside parent links while preserving default button/dialog behavior elsewhere.
- `src/components/InfoPageLayout.tsx`: shared info/legal `Back to homepage` CTA uses `Button asChild` for the direct `/` link.
- `src/pages/PublicCtaSemantics.test.tsx`: regression coverage against nested interactive controls on the homepage and info page back CTA.
- `e2e/public-cta-semantics.spec.ts`: browser guard for homepage mobile/desktop and shared info/legal route CTA semantics, zero nested controls and no horizontal overflow.
- `package.json`: dedicated public CTA semantics smoke script and full e2e smoke script include the public CTA e2e guard.
- `docs/backend/production-scale-baseline.md`: Batch #122 10,000 concurrent users capacity review for public CTA semantics.
- `docs/project-memory/PROMPTS/prompt-122-lovable-sync.md`: Lovable sync prompt for Batch #122; user confirmed clean sync at `98335bd5`.

## Batch #123 Public Input Accessibility

- `src/components/landing/Hero.tsx`: homepage offer search input has a locale-owned programmatic label and stable `home-offer-search` id.
- `src/i18n/translations.ts`: EN/RU/ES `hero_searchLabel` copy for the homepage search accessible name.
- `src/pages/SignIn.tsx`: email, phone, password and forgot-password email fields are connected to their visible labels.
- `src/components/registration/CountryPhoneInput.tsx`: reusable phone input accepts `inputId` and optional aria-label props, names the country selector, country search input and mobile close control.
- `src/pages/PublicInputA11y.test.tsx`: regression coverage for homepage search, sign-in email mode, sign-in phone mode and forgot-password email labels.
- `e2e/public-input-a11y.spec.ts`: mobile browser guard for named public inputs, zero visible unnamed controls and no horizontal overflow.
- `package.json`: dedicated public input accessibility smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #123 10,000 concurrent users capacity review for public input accessibility.
- `docs/project-memory/PROMPTS/prompt-123-lovable-sync.md`: Lovable sync prompt for Batch #123; user confirmed clean sync at `50b10bc`.

## Batch #124 Public Heading Structure

- `src/components/landing/Footer.tsx`: footer columns render as named navigation groups instead of H4 page headings.
- `src/components/landing/Footer.test.tsx`: regression coverage for the Company footer group after heading removal.
- `src/pages/Suppliers.tsx`: supplier result cards sit under a screen-reader-visible `Supplier results` H2.
- `src/pages/Suppliers.test.tsx`: regression coverage for the supplier results H2.
- `src/i18n/translations.ts`: EN/RU/ES `suppliersPage_resultsHeading` copy.
- `e2e/public-heading-structure.spec.ts`: mobile browser guard for sequential public heading outlines, zero footer headings and supplier rows under the results H2.
- `package.json`: dedicated public heading structure smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #124 10,000 concurrent users capacity review for public heading structure.
- `docs/project-memory/PROMPTS/prompt-124-lovable-sync.md`: Lovable sync prompt for Batch #124 after PR #175 merge; user confirmed clean sync at `05d09f4b`.

## Batch #125 Public Landmark Labels

- `src/components/landing/Header.tsx`: desktop and mobile navigation landmarks expose locale-owned accessible names.
- `src/components/landing/Header.landmarks.test.tsx`: regression coverage for named desktop and mobile header navigation landmarks in EN/RU/ES.
- `src/pages/HowItWorks.tsx`: supplier trust infrastructure aside is labelled by its existing heading.
- `src/components/how-it-works/BusinessOutcomes.tsx`: supplier outcomes aside is labelled by its existing heading.
- `src/pages/Blog.tsx`: blog sidebar complementary landmark exposes a locale-owned label.
- `src/pages/BlogArticle.tsx`: article tools complementary landmark exposes a locale-owned label.
- `src/i18n/translations.ts`: EN/RU/ES labels for main navigation, mobile navigation, insights navigation and article tools.
- `src/i18n/aria-tooltips-localized.ru.test.tsx`: Russian localization guard includes the new navigation labels.
- `e2e/public-landmark-labels.spec.ts`: mobile/desktop browser guard for visible public `nav`/`aside` landmark names and open mobile menu navigation.
- `package.json`: dedicated public landmark smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #125 10,000 concurrent users capacity review for public landmark labels.
- `docs/project-memory/PROMPTS/prompt-125-lovable-sync.md`: Lovable sync prompt for Batch #125 after PR #176 merge; user confirmed clean sync at `a984c87`.

## Batch #126 Public Skip-To-Main Target

- `src/components/landing/Header.tsx`: opt-in skip-to-main link with locale-owned copy and focus/scroll behavior.
- `src/components/landing/Header.landmarks.test.tsx`: regression coverage for named navigation landmarks and the optional skip link in EN/RU/ES.
- `src/i18n/translations.ts`: EN/RU/ES `aria_skipToMain` copy.
- `src/i18n/aria-tooltips-localized.ru.test.tsx`: Russian localization guard includes the skip-link English string.
- `src/pages/Index.tsx`, `src/pages/Offers.tsx`, `src/pages/Suppliers.tsx`, `src/pages/HowItWorks.tsx`, `src/pages/ForSuppliers.tsx`, `src/components/InfoPageLayout.tsx`, `src/pages/SignIn.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Blog.tsx`, `src/pages/BlogArticle.tsx`, `src/pages/OfferDetail.tsx`, `src/pages/SupplierProfile.tsx`, `src/pages/NotFound.tsx`: audited public route shells expose exactly one `main#main` when opting into the skip link.
- `e2e/public-skip-main-target.spec.ts`: mobile/desktop browser guard for one `main#main`, one skip link, zero extra main landmarks and no horizontal overflow across public routes, plus skip-link keyboard activation.
- `package.json`: dedicated public skip-to-main smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #126 10,000 concurrent users capacity review for the public skip-to-main target.
- `docs/project-memory/PROMPTS/prompt-126-lovable-sync.md`: Lovable sync prompt for Batch #126 after PR #177 merge; user confirmed clean sync at `6a27659`.

## Batch #127 Public Blog Mobile Tap Targets

- `src/pages/Blog.tsx`: mobile-safe target zones for existing blog breadcrumbs, filter chips, article read links, popular topic chips and see-all-updates link.
- `src/pages/BlogArticle.tsx`: mobile-safe target zones for existing article breadcrumbs, mobile TOC summary/links, FAQ summaries and back-to-index CTA.
- `e2e/blog-mobile-tap-targets.spec.ts`: mobile browser guard for 44px marked blog tap targets and zero horizontal overflow at 390px.
- `package.json`: dedicated public blog mobile tap-target smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #127 10,000 concurrent users capacity review for public blog mobile tap targets.
- `docs/project-memory/PROMPTS/prompt-127-lovable-sync.md`: Lovable sync prompt for Batch #127 after PR #178 merge; user confirmed clean sync at `e8d096f`.

## Batch #128 Public Auth And Registration Accessibility

- `src/components/registration/RegistrationLayout.tsx`: registration shell exposes hidden-until-focus skip-to-main behavior, exactly one `main#main` and mobile-safe header/footer targets.
- `src/components/registration/CountryPhoneInput.tsx`: phone input supports caller-owned autocomplete hints while country search stays autocomplete-off.
- `src/pages/SignIn.tsx`: public sign-in email, phone and password fields expose browser completion hints.
- `src/pages/ResetPassword.tsx`: reset password fields expose connected labels and new-password completion hints.
- `src/pages/register/RegisterEmail.tsx`: registration email field has a stable label/id and email autocomplete; legal links have mobile-safe target boxes.
- `src/pages/register/RegisterVerify.tsx`: OTP inputs are named and use `one-time-code`; resend/dev-skip controls have mobile-safe targets.
- `src/pages/register/RegisterDetails.tsx`: buyer details fields expose labels and completion hints for name, organization, country, VAT, phone, phone code and password.
- `src/pages/register/RegisterOnboarding.tsx`: category/certification chips, volume choices and skip control have mobile-safe target boxes.
- `src/pages/register/RegisterCountries.tsx`: country chips, show-all and skip controls have mobile-safe target boxes.
- `src/pages/register/RegisterReady.tsx`: offers CTA uses `Button asChild` with a direct React Router link instead of nested interactive controls.
- `e2e/public-auth-registration-a11y.spec.ts`: browser guard for sign-in completion hints, registration shell landmarks, skip focus, 44px targets, nested-control absence, overflow absence and registration form labels/autocomplete.
- `package.json`: dedicated public auth/registration accessibility smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #128 10,000 concurrent users capacity review for public auth and registration accessibility.
- `docs/project-memory/PROMPTS/prompt-128-lovable-sync.md`: sync confirmation prompt for Batch #128 after PR #179 merge; user confirmed clean sync at `f1f482b`.

## Batch #129 Offer Detail Mobile Accessibility

- `src/components/offer-detail/PhotoGallery.tsx`: offer photo gallery controls, thumbnails and lightbox controls expose accessible names and mobile-safe target boxes.
- `src/pages/OfferDetail.tsx`: back-to-catalog and breadcrumb links expose mobile-safe target boxes while preserving route destinations.
- `src/components/offer-detail/OfferSummary.tsx`: delivery-basis controls meet the mobile target baseline in locked and unlocked states.
- `src/components/offer-detail/SupplierTrustPanel.tsx`: supplier verification scope disclosure exposes `aria-expanded` and a mobile-safe target box.
- `src/components/offer-detail/FullSpecifications.tsx`: full specifications disclosure exposes `aria-expanded` and a mobile-safe target box.
- `src/i18n/translations.ts`: EN/RU/ES accessible names for offer detail gallery previous, next, open, close and thumbnail controls.
- `e2e/offer-detail-mobile-a11y.spec.ts`: mobile browser guard for named gallery/lightbox controls, 44px marked offer detail targets, zero unnamed visible buttons, zero nested controls and zero horizontal overflow.
- `package.json`: dedicated offer detail mobile accessibility smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #129 10,000 concurrent users capacity review for offer detail mobile accessibility.
- `docs/project-memory/PROMPTS/prompt-129-lovable-sync.md`: sync confirmation prompt for Batch #129 after PR #180 merge; user confirmed clean sync at `2550a29`.

## Batch #130 Supplier Profile Mobile Accessibility

- `src/pages/SupplierProfile.tsx`: supplier profile breadcrumb landmark uses locale-owned copy, breadcrumb links are mobile-safe, trust/profile tabs use 44px-safe triggers and not-found directory recovery link is mobile-safe.
- `e2e/supplier-profile-mobile-a11y.spec.ts`: mobile browser guard for `/suppliers/:id` and unknown supplier fallback, 44px marked supplier profile targets, zero nested controls and zero horizontal overflow.
- `package.json`: dedicated supplier profile mobile accessibility smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #130 10,000 concurrent users capacity review for supplier profile mobile accessibility.
- `docs/project-memory/PROMPTS/prompt-130-lovable-sync.md`: sync confirmation prompt for Batch #130 after PR #181 merge; user confirmed clean sync at `1449efa`.

## Batch #131 Public Pulse Estimate Disclosure

- `src/components/PulseBadge.tsx`: public Pulse badges expose localized activity counts, programmatic estimate naming, reduced-motion ping behavior and preserve the dynamic count drift from `origin/main`.
- `src/components/offer-detail/MarketPulse.tsx`: offer detail market pulse renders as a labelled section and respects reduced-motion preferences.
- `src/components/PulseBadge.test.tsx`: regression coverage for programmatic-only compact estimate disclosure, RU localization and reduced-motion class presence.
- `e2e/public-pulse-disclosure.spec.ts`: mobile browser guard for homepage Pulse badge programmatic disclosure and offer-detail MarketPulse disclosure, zero nested controls and zero horizontal overflow.
- `package.json`: dedicated public Pulse disclosure smoke script and full e2e smoke script include the new guard.
- `docs/backend/production-scale-baseline.md`: Batch #131 10,000 concurrent users capacity review for public Pulse estimate disclosure.
- `docs/project-memory/PROMPTS/prompt-131-lovable-sync.md`: sync confirmation prompt for Batch #131 after PR #183 merge; user confirmed clean sync at `6655d11`.

## Batch #96 Supplier Access Review Console

- `packages/contracts/src/supplier-access.ts`: review queue DTOs and query/status schemas.
- `apps/api/src/modules/access/routes.ts`: admin review list and decision endpoints.
- `apps/api/src/modules/access/service.ts`: admin review orchestration.
- `apps/api/src/modules/access/repository.ts`: memory repository review queue implementation.
- `apps/api/src/modules/access/postgres-repository.ts`: PostgreSQL review queue implementation.
- `packages/db/migrations/0017_supplier_access_review_queue.sql`: queue indexes for review reads.
- `src/lib/admin-access-review-api.ts`: frontend self-hosted admin review API client.
- `src/lib/use-admin-access-review.ts`: frontend admin review hook.
- `src/pages/admin/AdminAccessRequests.tsx`: admin/operator review console page.
- `e2e/admin-access-review.spec.ts`: browser smoke for admin review queue and forbidden role state.
- `scripts/smoke-self-hosted-admin-access-review.mjs`: self-hosted runtime smoke.
- `docs/backend/self-hosted-admin-access-review-smoke.md`: smoke documentation.

## Batch #97 Admin Access Grants Console

- `packages/contracts/src/supplier-access.ts`: admin grant list/revoke DTOs and query/status schemas.
- `apps/api/src/modules/access/routes.ts`: admin access grant list and revoke endpoints.
- `apps/api/src/modules/access/service.ts`: admin grant list/revoke orchestration.
- `apps/api/src/modules/access/repository.ts`: memory repository admin grant implementation.
- `apps/api/src/modules/access/postgres-repository.ts`: PostgreSQL admin grant implementation.
- `packages/db/migrations/0018_admin_access_grants_console.sql`: grant-console indexes for active/expired admin reads.
- `src/lib/admin-access-grants-api.ts`: frontend self-hosted admin grants API client.
- `src/lib/use-admin-access-grants.ts`: frontend admin grants hook.
- `src/pages/admin/AdminAccessGrants.tsx`: admin/operator grants console page.
- `e2e/admin-access-grants.spec.ts`: browser smoke for grant list/revoke and forbidden role state.
- `scripts/smoke-self-hosted-admin-access-grants.mjs`: self-hosted runtime smoke.
- `docs/backend/self-hosted-admin-access-grants-smoke.md`: smoke documentation.

## Batch #98 Engineering Lessons Guards

- `docs/project-memory/ENGINEERING_LESSONS.md`: durable record of Batch #96/#97 mistakes, root causes, fixes and guards.
- `docs/backend/engineering-quality-gates.md`: engineering quality gate documentation.
- `scripts/lib/e2e-script-policy.mjs`: reusable package-script policy for API-backed e2e isolation and build-race prevention.
- `scripts/check-engineering-lessons.mjs`: release guard for engineering lessons, project-memory markers, package scripts and stable smoke assertions.
- `src/test/engineering-lessons-guard.test.ts`: Vitest coverage for the e2e policy and memory-repository smoke assertion rule.
- `AGENTS.md`: Failure Learning Contract added to the Engineer Agent Action Contract.
- `docs/backend/production-scale-baseline.md`: Batch #98 production-scale release gate note.

## Batch #99 Admin Operator Hub

- `packages/contracts/src/admin-operations.ts`: admin operations overview DTOs and production-capacity shape.
- `apps/api/src/modules/admin-operations/service.ts`: self-hosted admin overview aggregation across runtime, access-review queue and active grants.
- `apps/api/src/modules/admin-operations/routes.ts`: admin-protected `GET /v1/admin/operations/overview`.
- `src/lib/admin-operations-api.ts`: frontend self-hosted admin operations API client.
- `src/lib/use-admin-operations-overview.ts`: frontend hook for disabled/session/forbidden/ready states.
- `src/pages/admin/AdminOperations.tsx`: admin operations hub page at `/admin`.
- `src/components/admin/AdminOperatorNav.tsx`: shared admin navigation for operations, runtime, requests and grants.
- `e2e/admin-operations.spec.ts`: browser smoke for the admin operations hub and admin role guard.
- `scripts/smoke-self-hosted-admin-operations.mjs`: self-hosted runtime smoke for auth, role, overview, access summaries and secret guards.
- `docs/backend/self-hosted-admin-operations-smoke.md`: runtime smoke documentation.

## Batch #100 Admin Command Center

- `packages/contracts/src/admin-operations.ts`: expanded admin operations DTOs for audit summary, readiness and operator actions.
- `apps/api/src/modules/admin-operations/service.ts`: command-center aggregation across runtime, access queue, grants and bounded audit sample.
- `src/pages/admin/AdminOperations.tsx`: admin command-center UI with audit card, readiness checklist, operator actions and recent audit feed.
- `src/pages/admin/AdminAuditEvents.tsx`: read-only admin audit events page at `/admin/audit`.
- `src/lib/admin-audit-api.ts`: self-hosted admin audit frontend API client.
- `src/lib/use-admin-audit-events.ts`: admin audit page hook with disabled/session/forbidden/loading/error/ready states.
- `e2e/admin-audit-events.spec.ts`: API-backed browser smoke for `/admin/audit`.
- `docs/backend/self-hosted-admin-audit-events-page.md`: admin audit page runbook and scale notes.
- `docs/backend/production-scale-baseline.md`: Batch #100 10,000 concurrent users capacity review.

## Batch #101 Admin Incident Response

- `packages/contracts/src/admin-incidents.ts`: incident DTOs, query schema and acknowledge response schema.
- `apps/api/src/modules/admin-incidents/`: backend incident repository, PostgreSQL adapter, service and admin-only routes.
- `packages/db/migrations/0019_admin_incident_acknowledgements.sql`: durable acknowledgement/resolution state for derived incidents.
- `src/lib/admin-incidents-api.ts`: frontend self-hosted admin incidents API client.
- `src/lib/use-admin-incidents.ts`: frontend hook for disabled/session/forbidden/loading/error/ready states and acknowledge actions.
- `src/pages/admin/AdminIncidents.tsx`: admin incident response console at `/admin/incidents`.
- `e2e/admin-incidents.spec.ts`: API-backed browser smoke for incident list and acknowledge flow.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: self-hosted runtime smoke for auth guard, role guard, incident list/detail/acknowledge/resolve and secret guards.
- `docs/backend/self-hosted-admin-incidents-smoke.md`: incident response smoke documentation and 10,000 concurrent users notes.

## Batch #102 Admin Incident Workflow

- `packages/contracts/src/admin-incidents.ts`: workflow action, timeline, SLA and escalation DTOs.
- `packages/contracts/src/admin-incidents.ts`: runbook and workload-summary DTOs for assignment coverage, SLA risk, escalation load and source mix.
- `apps/api/src/modules/admin-incidents/`: workflow service/repository/routes for assign, comment, escalate, resolve, bulk workflow and sanitized export actions.
- `packages/db/migrations/0020_admin_incident_workflow.sql`: durable assignment/escalation fields and indexed `yorso_admin_incident_events` timeline table.
- `src/lib/admin-incidents-api.ts`: frontend self-hosted workflow API client.
- `src/lib/use-admin-incidents.ts`: frontend hook workflow action bridge.
- `src/pages/admin/AdminIncidents.tsx`: incident workflow controls, bulk workflow panel, export buttons, workflow filters, runbook steps, SLA/due state, workload summary and timeline preview.
- `e2e/admin-incidents.spec.ts`: API-backed browser smoke for assignment/escalation workflow, bulk workflow, export and workload summary rendering.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime smoke markers for assign, escalate, comment, bulk workflow, export, workload summary, workflow filters and workflow validation.
- `docs/backend/production-scale-baseline.md`: Batch #102 10,000 concurrent users capacity review.

## Batch #103 Admin Incident Detail Handoff and Remediation

- `packages/contracts/src/admin-incidents.ts`: handoff, remediation and postmortem DTOs, Markdown/JSON format contracts, note hygiene schema and bounded remediation/postmortem contracts.
- `apps/api/src/modules/admin-incidents/service.ts`: bounded incident handoff JSON/Markdown formatting, remediation plan generation and postmortem draft generation.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected `GET /v1/admin/incidents/:incidentId/handoff`, `GET /v1/admin/incidents/:incidentId/remediation` and `GET /v1/admin/incidents/:incidentId/postmortem`.
- `src/lib/admin-incidents-api.ts`: frontend client methods for incident detail, handoff exports, remediation plan and postmortem exports.
- `src/lib/use-admin-incident-detail.ts`: detail-page hook for disabled/session/forbidden/loading/error/ready states, workflow, handoff, remediation and postmortem actions.
- `src/pages/admin/AdminIncidentDetail.tsx`: `/admin/incidents/:incidentId` page with snapshot, evidence, runbook, timeline, workflow, handoff, remediation and postmortem panels.
- `src/pages/admin/AdminIncidents.tsx`: list-to-detail navigation.
- `e2e/admin-incident-detail.spec.ts`: browser smoke for incident detail, handoff, remediation and postmortem controls.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime smoke markers for `admin_incidents_handoff_json=ok`, `admin_incidents_handoff_markdown=ok`, `admin_incidents_remediation_plan=ok`, `admin_incidents_postmortem_json=ok`, `admin_incidents_postmortem_markdown=ok` and `admin_incidents_note_hygiene_guard=ok`.
- `docs/backend/production-scale-baseline.md`: Batch #103 10,000 concurrent users capacity review.

## Batch #104 Admin Incident Execution Tracker

- `packages/contracts/src/admin-incidents.ts`: execution source/status/priority DTOs, execution response schema and execution update schema.
- `packages/db/migrations/0021_admin_incident_execution.sql`: durable `yorso_admin_incident_execution_items` state table and execution indexes.
- `packages/db/migration-manifest.json`: manifest entry for `0021_admin_incident_execution`.
- `apps/api/src/modules/admin-incidents/repository.ts`: memory repository execution record support.
- `apps/api/src/modules/admin-incidents/postgres-repository.ts`: PostgreSQL execution read/upsert support.
- `apps/api/src/modules/admin-incidents/service.ts`: execution plan derivation and execution item updates.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected execution read/update/export endpoints.
- `src/lib/admin-incidents-api.ts`: frontend execution API client methods, JSON/CSV export methods and validators.
- `src/lib/use-admin-incident-detail.ts`: detail hook execution loading, export and update actions.
- `src/pages/admin/AdminIncidentDetail.tsx`: execution tracker UI on `/admin/incidents/:incidentId`.
- `e2e/admin-incident-detail.spec.ts`: browser smoke for execution plan loading and item completion.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime markers for execution plan/export/start/done/blocked/hygiene/missing-item guards.
- `docs/backend/self-hosted-admin-incidents-smoke.md`: Batch #104 incident execution smoke documentation.
- `docs/backend/production-scale-baseline.md`: Batch #104 10,000 concurrent users capacity review.

## Batch #105 Admin Incident Execution Queue

- `packages/contracts/src/admin-incidents.ts`: execution queue query/export/response/bulk-update DTOs.
- `apps/api/src/modules/admin-incidents/service.ts`: cross-incident execution queue derivation, filters, bounded JSON/CSV queue export and bulk update orchestration.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected `/v1/admin/incidents/execution-queue`, `/export` and `/bulk` routes.
- `apps/api/src/modules/admin-incidents/service.test.ts`: service coverage for queue filters, export, bulk partial failure and note hygiene.
- `src/lib/admin-incidents-api.ts`: frontend queue, queue export and bulk-update client methods.
- `src/lib/use-admin-incident-execution-queue.ts`: frontend hook for disabled/session/forbidden/loading/error/ready states and queue mutation.
- `src/pages/admin/AdminIncidentExecutionQueue.tsx`: `/admin/incident-execution` page with filters, summary, export and bulk controls.
- `src/components/admin/AdminOperatorNav.tsx`: admin navigation link for execution queue.
- `e2e/admin-incident-execution-queue.spec.ts`: API-backed browser smoke for filters, JSON/CSV export, bulk update and session headers.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime markers for execution queue read/filter/export/bulk/hygiene guards.
- `docs/backend/self-hosted-admin-incidents-smoke.md`: Batch #105 incident execution queue smoke documentation.
- `docs/backend/self-hosted-backend-architecture.md`: Batch #105 self-hosted architecture note.
- `docs/backend/self-hosted-validation.md`: Batch #105 validation contract.
- `docs/backend/production-scale-baseline.md`: Batch #105 10,000 concurrent users capacity review.

## Batch #106 Admin Incident Workload and Correlation

- `packages/contracts/src/admin-incidents.ts`: workload query/export/forecast/response DTOs and incident correlation response DTOs.
- `apps/api/src/modules/admin-incidents/service.ts`: bounded workload aggregation, owner load, hot incident scoring, capacity forecast, JSON/CSV export and correlation signal derivation.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected `/execution-workload`, `/execution-workload/export`, `/execution-workload/forecast` and `/:incidentId/correlation` routes.
- `apps/api/src/modules/admin-incidents/service.test.ts`: service coverage for workload aggregation, export and correlation.
- `packages/db/migrations/0022_admin_incident_workload_correlation.sql`: workload/correlation indexes for incident execution and timeline lookups.
- `packages/db/migration-manifest.json`: manifest entry for `0022_admin_incident_workload_correlation`.
- `src/lib/admin-incidents-api.ts`: frontend workload export, forecast and correlation client methods.
- `src/lib/use-admin-incident-workload.ts`: frontend hook for disabled/session/forbidden/loading/error/ready states, export, forecast and correlation drill-down.
- `src/pages/admin/AdminIncidentWorkload.tsx`: `/admin/incident-workload` page with filters, summary cards, owner load, hot incidents, capacity forecast and correlation panel.
- `src/components/admin/AdminOperatorNav.tsx`: admin navigation link for workload.
- `e2e/admin-incident-workload.spec.ts`: API-backed browser smoke for filters, export, forecast, correlation and identity hygiene.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime markers for workload read/filter/export/forecast/correlation.
- `docs/backend/admin-incident-workload-correlation.md`: operator and implementation guide for the workload/correlation surface.
- `docs/testing/admin-incident-workload-e2e.md`: browser smoke documentation.
- `docs/backend/self-hosted-admin-incidents-smoke.md`: Batch #106 runtime smoke documentation.
- `docs/backend/self-hosted-backend-architecture.md`: Batch #106 architecture note.
- `docs/backend/self-hosted-validation.md`: Batch #106 validation contract.
- `docs/backend/production-scale-baseline.md`: Batch #106 10,000 concurrent users capacity review.

## Batch #107 Admin Incident Trend Analytics

- `packages/contracts/src/admin-incidents.ts`: trend query/export/response/anomaly/briefing DTOs.
- `apps/api/src/modules/admin-incidents/service.ts`: bounded trend aggregation, route risk, SLA posture, anomaly and briefing generation.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected `/trends`, `/trends/export`, `/trends/anomalies` and `/trends/briefing` routes.
- `apps/api/src/modules/admin-incidents/service.test.ts`: service coverage for trend analytics and sanitized output.
- `packages/db/migrations/0023_admin_incident_trend_analytics.sql`: trend analytics indexes for events, acknowledgements and execution items.
- `packages/db/migration-manifest.json`: manifest entry for `0023_admin_incident_trend_analytics`.
- `src/lib/admin-incidents-api.ts`: frontend trend, export, anomaly and briefing client methods.
- `src/lib/use-admin-incident-trends.ts`: frontend hook for disabled, session-required, forbidden, loading, error and ready states.
- `src/pages/admin/AdminIncidentTrends.tsx`: `/admin/incident-trends` page with filters, buckets, route risks, SLA, anomalies, briefing and exports.
- `src/components/admin/AdminOperatorNav.tsx`: admin navigation link for trends.
- `e2e/admin-incident-trends.spec.ts`: API-backed browser smoke for filters, export, anomalies, briefing and identity hygiene.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime markers for trend read/filter/export/anomalies/briefing.
- `docs/backend/admin-incident-trend-analytics.md`: operator and implementation guide.
- `docs/backend/admin-incident-trend-api-contract.md`: route and contract guide.
- `docs/backend/admin-incident-trend-load-test-plan.md`: load-test plan for the 10,000 concurrent users baseline.
- `docs/backend/admin-incident-trend-security-model.md`: access and export security model.
- `docs/backend/admin-incident-trends-data-dictionary.md`: trend field dictionary.
- `docs/backend/admin-incident-trends-indexing.md`: indexing note for migration 0023.
- `docs/testing/admin-incident-trends-e2e.md`: browser smoke documentation.
- `docs/testing/admin-incident-trends-contract-tests.md`: contract test documentation.
- `docs/testing/admin-incident-trends-smoke.md`: runtime smoke documentation.

## Batch #108 Admin Incident Trend Actions

- `packages/contracts/src/admin-incidents.ts`: trend action proposal and decision DTOs.
- `apps/api/src/modules/admin-incidents/service.ts`: bounded trend action proposal derivation and decision handling.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected trend action endpoints.
- `apps/api/src/modules/admin-incidents/repository.ts`: memory repository support for trend action decisions.
- `apps/api/src/modules/admin-incidents/postgres-repository.ts`: PostgreSQL repository support for trend action decisions.
- `packages/db/migrations/0024_admin_incident_trend_actions.sql`: durable trend action decision table and indexes.
- `src/lib/admin-incidents-api.ts`: frontend trend action API client methods.
- `src/lib/use-admin-incident-trends.ts`: frontend trend action loading and decision bridge.
- `src/pages/admin/AdminIncidentTrends.tsx`: trend action panel on `/admin/incident-trends`.
- `e2e/admin-incident-trends.spec.ts`: browser guard for trend action proposals and decisions.
- `docs/backend/admin-incident-trend-actions.md`: operator and implementation guide.
- `docs/backend/admin-incident-trend-actions-api-contract.md`: API contract guide.
- `docs/backend/admin-incident-trend-actions-indexing.md`: indexing note for migration 0024.

## Batch #109 Admin Incident Trend Action Queue

- `packages/contracts/src/admin-incidents.ts`: trend action queue query, export and bulk decision DTOs.
- `apps/api/src/modules/admin-incidents/service.ts`: bounded queue listing, exports and bulk decision orchestration.
- `apps/api/src/modules/admin-incidents/routes.ts`: admin-protected trend action queue routes.
- `packages/db/migrations/0025_admin_incident_trend_action_queue.sql`: queue-oriented indexes for trend action decisions.
- `src/lib/admin-incidents-api.ts`: frontend trend action queue API client methods.
- `src/lib/use-admin-incident-trend-action-queue.ts`: frontend queue hook for disabled, session, forbidden, loading, error and ready states.
- `src/pages/admin/AdminIncidentTrendActions.tsx`: `/admin/incident-trend-actions` queue page.
- `src/components/admin/AdminOperatorNav.tsx`: admin navigation link for trend actions.
- `e2e/admin-incident-trend-actions.spec.ts`: API-backed browser smoke for queue filters, exports and bulk decisions.
- `docs/backend/admin-incident-trend-action-queue.md`: operator and implementation guide.
- `docs/backend/admin-incident-trend-action-queue-api-contract.md`: API contract guide.
- `docs/backend/admin-incident-trend-action-queue-indexing.md`: indexing note for migration 0025.

## 2026-05-23 Public UX/UI Patch

- `index.html`: public title, description and social metadata for YORSO instead of Lovable defaults.
- `README.md`: YORSO Commerce Hub repository README instead of default Lovable TODO content.
- `src/pages/Index.tsx`: landing page horizontal overflow containment.
- `src/pages/HowItWorks.tsx`: how-it-works page horizontal overflow containment.
- `src/components/how-it-works/ProcurementDecisionProof.tsx`: mobile-safe procurement decision comparison table.
- `src/components/how-it-works/AccessLevels.tsx`: mobile-safe access-level comparison table.
- `src/components/how-it-works/FinalCTA.tsx`: constrained final CTA grid to avoid narrow-screen overflow.
- `src/components/landing/Header.tsx`: larger mobile header touch target.
- `src/pages/Suppliers.tsx`: larger mobile supplier quick filter touch targets.
- `src/components/ui/button.tsx`: responsive mobile minimum touch target for shared buttons and icon buttons.
- `src/components/CertificationBadges.tsx`: mobile-safe certification chip touch targets.
- `src/components/catalog/CatalogRecoveryCard.tsx`: CTA links use `Button asChild` instead of nested `Link > Button`.
- `src/components/catalog/MobileFilterPills.tsx`: mobile filter pill and filter-square touch targets.
- `src/components/catalog/MobileOfferCard.tsx`: mobile trend and delivery-basis touch targets.
- `src/components/landing/Hero.tsx`: mobile-safe tertiary registration link.
- `src/components/landing/FinalCTA.tsx`: CTA uses `Button asChild` instead of nested `Link > Button`.
- `src/components/landing/LiveOffers.tsx`: mobile view-all CTA uses `Button asChild`.
- `src/components/landing/SupplierVerification.tsx`: CTA uses `Button asChild`.
- `src/components/landing/ValueSplit.tsx`: CTA buttons use `Button asChild`.
- `src/pages/Offers.tsx`: mobile-safe breadcrumb and catalog sort controls.
- `src/pages/ForSuppliers.tsx`: mobile-safe breadcrumb and request access CTA.
- `src/components/suppliers/SupplierRow.tsx`: supplier title link touch target.

## Backend Phase 2A Registration-To-Account Source Of Truth

- `docs/backend/phase-2a-registration-account-source-of-truth.md`: plan/fact,
  runtime contract, data ownership, 10,000 concurrent-user review and
  validation record for Phase 2A.
- `packages/db/migrations/0026_registration_account_source.sql`: backend-owned
  registration draft table and indexes.
- `packages/db/migration-manifest.json`: migration manifest entry for
  `0026_registration_account_source`.
- `packages/contracts/src/auth.ts`: shared registration request/response
  schemas for `/v1/auth/register/*`.
- `apps/api/src/modules/auth/routes.ts`: self-hosted registration route
  handlers for start, verification, details, onboarding, markets and complete.
- `apps/api/src/modules/auth/service.ts`: registration draft validation,
  verification-state transitions and completion orchestration.
- `apps/api/src/modules/auth/repository.ts`: memory registration draft and
  completion implementation for local/test runtime.
- `apps/api/src/modules/auth/postgres-repository.ts`: PostgreSQL registration
  draft persistence and atomic account/session creation path.
- `apps/api/src/modules/auth/factory.ts`, `apps/api/src/server.ts`: account
  provisioner wiring for self-hosted runtime.
- `apps/api/src/modules/account/repository.ts`: memory account provisioning for
  registration completion tests.
- `apps/api/src/server.test.ts`: API integration coverage for the registration
  funnel creating a self-hosted account workspace and sign-in credential.
- `src/lib/api-contracts.ts`: frontend registration API boundary for
  self-hosted `/v1/auth/register/*` calls and error mapping.
- `src/lib/api-contracts.registration.test.ts`: registration API client
  contract tests.
- `src/pages/register/RegisterVerify.tsx`: dev skip path advances backend email
  verification state in self-hosted mode.
- `src/pages/register/RegisterReady.tsx`: stores backend-issued self-hosted
  session on registration completion and fails closed on self-hosted errors.
- `docs/backend/frontend-backend-contract.md`: `/register/*` route/data-source
  contract updated for Phase 2A.
- `docs/backend/production-scale-baseline.md`: Phase 2A capacity review and
  validation/build metrics.

## Backend Phase 2B Registration Verification Delivery Outbox

- `docs/backend/phase-2b-registration-verification-delivery-outbox.md`:
  plan/fact, runtime contract, data ownership, 10,000 concurrent-user review
  and validation record for Phase 2B.
- `packages/db/migrations/0027_registration_verification_delivery_outbox.sql`:
  self-hosted registration verification delivery outbox table and indexes.
- `packages/db/migration-manifest.json`: migration manifest entry for
  `0027_registration_verification_delivery_outbox`.
- `packages/contracts/src/auth.ts`: registration delivery metadata schema and
  response contract additions.
- `apps/api/src/modules/auth/service.ts`: delivery metadata creation, masking
  and response shaping for email and phone verification requests.
- `apps/api/src/modules/auth/repository.ts`: memory registration delivery
  outbox implementation.
- `apps/api/src/modules/auth/postgres-repository.ts`: atomic draft/outbox and
  phone-request/outbox CTE write paths.
- `apps/api/src/server.test.ts`: API coverage for queued delivery metadata and
  no code/full-contact leakage.
- `src/lib/api-contracts.ts`: frontend registration delivery metadata type.
- `src/lib/api-contracts.registration.test.ts`: frontend API client coverage
  for delivery metadata.
- `docs/backend/frontend-backend-contract.md`: `/register/*` route/data-source
  contract updated for Phase 2B.
- `docs/backend/production-scale-baseline.md`: Phase 2B capacity review and
  validation/build metrics.

## Backend Phase 2C Registration Verification Worker Lease Processing

- `docs/backend/phase-2c-registration-verification-worker-lease.md`:
  plan/fact, worker contract, data ownership, 10,000 concurrent-user review
  and validation record for Phase 2C.
- `apps/api/src/modules/auth/delivery-worker.ts`: self-hosted registration
  delivery worker boundary with bounded lease processing, injectable sender,
  sent/retry/failed status updates and sanitized error handling.
- `apps/api/src/modules/auth/delivery-worker.test.ts`: behavior coverage for
  successful sends, retry exhaustion, expired draft skip and phone/WhatsApp
  delivery jobs.
- `apps/api/src/modules/auth/repository.ts`: memory repository implementation
  for delivery job leasing and sent/failed status transitions.
- `apps/api/src/modules/auth/postgres-repository.ts`: PostgreSQL lease,
  sent and failed/requeue statements using ordered `for update skip locked`
  candidates and active-draft filtering before lease.
- `docs/backend/frontend-backend-contract.md`: `/register/*` route/data-source
  contract updated for the Phase 2C worker boundary.
- `docs/backend/phase-2b-registration-verification-delivery-outbox.md`: Phase
  2B follow-up row updated to point at Phase 2C for lease processing.
- `docs/backend/production-scale-baseline.md`: Phase 2C capacity review and
  validation/build metrics.

## Backend Phase 2D Registration Delivery Runtime

- `docs/backend/phase-2d-registration-delivery-runtime.md`: plan/fact, runtime
  contract, OTP boundary, 10,000 concurrent-user review and validation record
  for Phase 2D.
- `apps/api/src/modules/auth/delivery-sender.ts`: self-hosted file-spool
  registration verification sender that writes owned JSON handoff files with
  `0600` permissions.
- `apps/api/src/modules/auth/delivery-sender.test.ts`: sender behavior,
  file-mode and no-code/provider-leakage coverage.
- `apps/api/src/modules/auth/delivery-scheduler.ts`: bounded background
  scheduler for `RegistrationDeliveryWorker` with no-overlap and failure
  observation behavior.
- `apps/api/src/modules/auth/delivery-scheduler.test.ts`: scheduler run,
  no-overlap and sanitized failure coverage.
- `apps/api/src/modules/auth/delivery-runtime.ts`: config-driven runtime
  factory that creates the file-spool sender, worker and scheduler.
- `apps/api/src/modules/auth/delivery-runtime.test.ts`: disabled/enabled
  runtime behavior and metrics coverage.
- `apps/api/src/config.ts`: registration delivery worker/sender/spool config
  and production fail-closed guard.
- `apps/api/src/server.ts`: scheduler lifecycle wiring on server `listening`
  and `close`.
- `apps/api/src/metrics.ts`: worker run/job counters without contact labels.
- `.env.example`, `.env.production.example` and `infra/docker-compose.yml`:
  runtime env knobs and mounted registration-delivery spool volume.
- `scripts/check-self-hosted-infra.mjs`,
  `scripts/check-self-hosted-production-runtime.mjs`,
  `scripts/check-self-hosted-api.mjs` and
  `scripts/check-production-scale-baseline.mjs`: guard coverage for the
  registration delivery runtime.
- `docs/backend/frontend-backend-contract.md`,
  `docs/backend/phase-2c-registration-verification-worker-lease.md`,
  `docs/backend/production-scale-baseline.md` and
  `docs/backend/self-hosted-production-deploy.md`: Phase 2D contract,
  deployment and production-scale updates.

## Lovable Sync Prompts

## Batch #133 Public Breadcrumb Locale A11y

- `src/pages/Suppliers.tsx`: supplier directory breadcrumb nav uses `t.aria_breadcrumb` instead of a hardcoded English accessible name.
- `src/pages/Blog.tsx`: blog index breadcrumb nav uses `t.aria_breadcrumb`.
- `src/pages/BlogArticle.tsx`: blog article breadcrumb nav uses `t.aria_breadcrumb`.
- `src/i18n/aria-tooltips-localized.ru.test.tsx`: RU regression coverage for Suppliers, Blog and BlogArticle breadcrumb labels.
- `e2e/public-breadcrumb-locale-a11y.spec.ts`: browser smoke for localized breadcrumb names on `/suppliers`, `/blog` and `/blog/atlantic-salmon-q1-price-pressure`.
- `package.json`: dedicated `smoke:e2e:public-breadcrumb-locale-a11y` script and full smoke wiring.
- `docs/backend/production-scale-baseline.md`: Batch #133 10,000 concurrent-user review.
- `docs/project-memory/PROMPTS/prompt-133-lovable-sync.md`: sync confirmation prompt for Batch #133 after PR #185 merge; user confirmed clean sync at `main` @ `ca1438b` or newer.

## Batch #135 Supplier Profile Logo Locale A11y

- `src/pages/SupplierProfile.tsx`: supplier profile logo wrapper `aria-label` and logo image `alt` use the existing locale-owned `supplier_logo_aria` template.
- `src/pages/__tests__/SupplierProfile.i18n.test.tsx`: EN/RU/ES regression coverage for supplier logo accessible names and image alt text.
- `e2e/supplier-profile-logo-locale-a11y.spec.ts`: browser smoke for `/suppliers/sup-no-001` at 390px in EN/RU/ES, including wrong-locale leakage, nested controls and horizontal overflow.
- `package.json`: dedicated `smoke:e2e:supplier-profile-logo-locale-a11y` script and full smoke wiring.
- `docs/backend/production-scale-baseline.md`: Batch #135 10,000 concurrent-user review.
- `docs/project-memory/PROMPTS/prompt-135-lovable-sync.md`: sync confirmation prompt for Batch #135 after PR #187 merge; user confirmed clean sync at `main` @ `eb23d5f` or newer.
- `docs/project-memory/PROJECT_STATE.yaml`, `CONTEXT_HEALTH.md`, `HANDOFF.md`, `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md`: Batch #135 merge and Lovable sync checkpoint.

- `docs/project-memory/PROMPTS/prompt-107-lovable-sync.md`: sync confirmation prompt for Batch #107.
- `docs/project-memory/PROMPTS/prompt-109-lovable-sync.md`: sync confirmation prompt for Batch #109.
- `docs/project-memory/PROMPTS/prompt-110-lovable-sync.md`: sync confirmation prompt for Batch #110 public UX mobile scan.
- `docs/project-memory/PROMPTS/prompt-111-lovable-sync.md`: sync confirmation prompt for Batch #111 public route SEO.
- `docs/project-memory/PROMPTS/prompt-112-lovable-sync.md`: sync confirmation prompt for Batch #112 route code splitting.
- `docs/project-memory/PROMPTS/prompt-113-lovable-sync.md`: sync confirmation prompt for Batch #113 route chunk error boundary.
- `docs/project-memory/PROMPTS/prompt-114-lovable-sync.md`: sync confirmation prompt for Batch #114 font-loading cleanup.
- `docs/project-memory/PROMPTS/prompt-115-lovable-sync.md`: sync confirmation prompt for Batch #115 catalog locale hardening.
- `docs/project-memory/PROMPTS/prompt-116-lovable-sync.md`: sync confirmation prompt for Batch #116 proof anchor fallback.
- `docs/project-memory/PROMPTS/prompt-117-lovable-sync.md`: sync confirmation prompt for Batch #117 request anchor.
- `docs/project-memory/PROMPTS/prompt-118-lovable-sync.md`: sync confirmation prompt for Batch #118 for-suppliers CTA semantics.
- `docs/project-memory/PROMPTS/prompt-119-lovable-sync.md`: sync confirmation prompt for Batch #119 offers CTA semantics.
- `docs/project-memory/PROMPTS/prompt-120-lovable-sync.md`: sync confirmation prompt for Batch #120 auth CTA semantics.
- `docs/project-memory/PROMPTS/prompt-121-lovable-sync.md`: sync confirmation prompt for Batch #121 offer detail CTA semantics.
- `docs/project-memory/PROMPTS/prompt-122-lovable-sync.md`: sync confirmation prompt for Batch #122 public CTA semantics; user confirmed clean sync at `98335bd5`.
- `docs/project-memory/PROMPTS/prompt-127-lovable-sync.md`: sync confirmation prompt for Batch #127 public blog mobile tap targets; user confirmed clean sync at `e8d096f`.
- `docs/project-memory/PROMPTS/prompt-128-lovable-sync.md`: sync confirmation prompt for Batch #128 public auth and registration accessibility; user confirmed clean sync at `f1f482b`.
- `docs/project-memory/PROMPTS/prompt-129-lovable-sync.md`: sync confirmation prompt for Batch #129 offer detail mobile accessibility; user confirmed clean sync at `2550a29`.
- `docs/project-memory/PROMPTS/prompt-130-lovable-sync.md`: sync confirmation prompt for Batch #130 supplier profile mobile accessibility; user confirmed clean sync at `1449efa`.
- `docs/project-memory/PROMPTS/prompt-131-lovable-sync.md`: sync confirmation prompt for Batch #131 public Pulse estimate disclosure after PR #183 merge; user confirmed clean sync at `6655d11`.
- `docs/project-memory/PROMPTS/prompt-132-lovable-sync.md`: sync confirmation prompt for Batch #132 public offer locale a11y after PR #184 merge; user confirmed clean sync at `d1bf472`.
- `docs/project-memory/PROMPTS/prompt-133-lovable-sync.md`: sync confirmation prompt for Batch #133 public breadcrumb locale a11y after PR #185 merge; user confirmed clean sync at `main` @ `ca1438b` or newer.
- `docs/project-memory/PROMPTS/prompt-135-lovable-sync.md`: sync confirmation prompt for Batch #135 supplier profile logo locale a11y after PR #187 merge; user confirmed clean sync at `main` @ `eb23d5f` or newer.
- `docs/project-memory/PROMPTS/prompt-138-lovable-sync.md`: sync confirmation prompt for Batch #138 public info route SEO after PR #190 merge; user confirmed clean sync at `main` @ `7eea5ce` or newer.
- `docs/project-memory/PROMPTS/prompt-139-lovable-sync.md`: sync confirmation prompt for Batch #139 public language selector a11y after PR #191 merge; user confirmed clean sync at `main` @ `6721b65` or newer.
- `e2e/public-account-menu-a11y.spec.ts`: Batch #140 browser smoke for signed-in public header account menu labels, dropdown association, mobile account panel, nested controls and 390px overflow.
- `docs/backend/production-scale-baseline.md`: Batch #140 10,000 concurrent-user review for public account menu a11y.
- `docs/project-memory/PROMPTS/prompt-140-lovable-sync.md`: Lovable sync prompt for Batch #140 after merge commit `8ad19a6`; user confirmed clean sync at `main` @ `8ad19a6` or newer.

## Backend Phase 1C Account Conflict Version Handling

- `docs/backend/phase-1-account-conflict-version-handling.md`: implementation, plan/fact, compatibility boundary, UI recovery behavior, validation and 10,000 concurrent-user review for stale account save protection.
- `apps/api/src/modules/account/routes.ts`: account responses include `accountVersion`; mutations reject stale `x-yorso-account-version` with `409 account_snapshot_conflict`.
- `apps/api/src/modules/account/service.ts`: account version read/assert helpers.
- `apps/api/src/modules/account/repository.ts`: memory account version storage and mutation bumps.
- `apps/api/src/modules/account/postgres-repository.ts`: account version aggregate across user/company/media/workspace/notification `updated_at` values plus parent-row touch on collection replacements.
- `src/lib/account-api.ts`: account version propagation, `AccountApiConflictError`, sequential account save/collection sync.
- `src/pages/account/Account.tsx`: reloadable `account-save-conflict` banner and conflict-aware save error path.
- `src/i18n/translations.ts`: EN/RU/ES account conflict copy.
- `src/lib/account-api.test.ts`, `src/pages/account/Account.editable.test.tsx`, `apps/api/src/modules/account/__tests__/repository.test.ts`, `apps/api/src/server.test.ts`: regression coverage for version header propagation, stale-save rejection and visible conflict recovery.
- `docs/backend/production-scale-baseline.md`: Backend Phase 1C 10,000 concurrent-user review.
