# Context Health

Updated: 2026-05-29

## Current Status

```yaml
context_risk: "low"
last_checkpoint: "2026-05-29"
last_handoff_ready: true
current_project: "yorso-commerce-hub"
active_branch: "main"
head_commit: "backend_phase_2a_registration_account_source_of_truth_committed_local"
latest_merged_batch: 141
active_workstream: "backend_phase_2a_registration_account_source_of_truth"
pull_request: null
recommended_action: "choose Backend Phase 2B verification delivery/outbox or legacy Supabase consolidation"
why_low: "Backend Phase 0 closure audit/remediation and Phase 1A-1J are documented and validated. Phase 2A registration-to-account source of truth is committed locally with release validation passed."
```

## Risk Levels

`low`: short chat, local task, project memory was updated recently and matches git state.

`medium`: long chat, several tasks, dirty worktree, or project memory was stale and has just been corrected.

`high`: compact or stream failure, assistant mixes projects, `PROJECT_STATE.yaml` is stale, or the next step is not written down.

## When To Update Checkpoint

- before a large new task;
- after a completed feature or audit;
- before moving to a new chat;
- if the assistant starts mixing `yorso-commerce-hub` with `yorso_new`;
- after a compact, stream disconnect or similar failure;
- after any meaningful production, frontend, backend, persistence or runtime change.

## Recovery Prompt

```text
Continue the Yorso commerce hub project from repository files, not from old chat memory.

Read first:
1. AGENTS.md
2. docs/project-memory/CONTEXT_HEALTH.md
3. docs/project-memory/PROJECT_STATE.yaml
4. docs/project-memory/HANDOFF.md
5. docs/project-memory/NEXT_ACTIONS.md
6. docs/project-memory/WORKLOG.md

Use /Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub as the project root.
Do not mix this with /Users/istokdmgmail.com/yorso_new unless explicitly asked.
Current branch: main.
Current workstream: backend_phase_2a_registration_account_source_of_truth.
Current HEAD baseline: Backend Phase 2A registration-to-account source of truth committed locally after Backend Phase 1J; Batch #141 merge commit 5eafcb7 is preserved.
Current PR: none.
Backend Phase 0 closure audit and remediation are complete. Read docs/backend/phase-0-closure-audit.md before starting Phase 1.
Phase 0 gate results: npm run lint passed; npm run build passed with known non-blocking Supabase generated type and Browserslist warnings; npm run contracts:build passed; npm test passed with 184 files passed, 1268 tests passed and 2 skipped.
docs/backend/frontend-backend-contract.md is now Phase 0 closure-audited and maps current App.tsx public, info/legal, account, dashboard, admin, redirect, dev and * routes to data sources or explicit no-data-source redirects.
Phase 0 remediation resolved stale RU/i18n test contracts, sign-in locale test env leakage, registration funnel provider setup, qualified exact-price localization, catalog category label localization and bounded Supabase-backed public access smoke handling.
Phase 1 discovery/audit is complete: docs/backend/phase-1-account-source-of-truth-discovery-audit.md.
Phase 1A implementation doc: docs/backend/phase-1-account-session-authority-gate.md.
Current recommended action: choose Backend Phase 2B self-hosted registration verification delivery/outbox decision or the legacy Supabase consolidation workstream.
Phase 2A implemented and committed locally: docs/backend/phase-2a-registration-account-source-of-truth.md records registration-to-account creation as a self-hosted backend source of truth.
Phase 2A runtime: API-enabled /register/* calls /v1/auth/register/*; yorso_registration_drafts stores funnel state; completion creates user, credential, company, company media row, roles, notification defaults, optional target-market meta-region and auth session.
Phase 2A frontend boundary: RegisterReady stores the backend-issued self_hosted session and fails closed on self-hosted completion errors; API-disabled Lovable/local preview keeps the old mock flow as non-production.
Phase 2A validation passed: npm run contracts:build; npx vitest run src/lib/api-contracts.registration.test.ts; npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"; npx vitest run src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/lib/auth-runtime.test.ts; npx tsc -b --noEmit; npm run test:db-migrations; focused API repository/server/storage tests; npm run lint; npm run check:production-scale-baseline; npm run check:self-hosted-production-runtime; npm run api:build; git diff --check; npm run build.
Phase 1J implemented locally: docs/backend/phase-1-account-source-of-truth-closure-audit.md closes Backend Phase 1 Account Source Of Truth as a documented gate after Phases 1A-1I. It does not add runtime code.
Phase 1J account authority finding: API-enabled /account/* now validates the self-hosted session, hydrates through self-hosted account API, saves through backend authority, uses accountVersion conflict/precondition handling and keeps localStorage/mock only for API-disabled preview.
Phase 1J self-contained product boundary: account Phase 1 production path uses self-hosted auth/session/account API, PostgreSQL and self-hosted file storage. Existing Supabase references remain legacy/prototype debt outside this Phase 1 closure and need a separate consolidation/removal workstream.
Phase 1J validation passed: npm run check:self-hosted-production-runtime; npm run check:production-scale-baseline; npm run lint; git diff --check.
Phase 1 audit finding: backend auth/account authority exists, but /account/* remains local-first through localStorage/mock profile hydration and browser sessionStorage gating.
Phase 1A implemented locally: API-enabled /account/* validates /v1/auth/session before rendering editable account data, hydrates account state from the self-hosted API as authority, clears invalid/missing buyer sessions and redirects to /signin, exposes backend-unavailable and save-failed states, and keeps localStorage/mock fallback only for API-disabled local preview.
Phase 1A targeted validation passed: npx vitest run src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-api.test.ts src/lib/auth-runtime.test.ts, 4 files passed, 51 tests passed.
Phase 1A additional validation passed: npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; git diff --check; npm run build.
Phase 1A build metric: Account-CSSVMLIT.js 109.62 kB / 25.11 kB gzip.
Phase 1B implemented locally: API-enabled /account/* normal edits now call only the edited section or row endpoint, collection forms wait for backend success before closing, and remote failures show inline account_remoteSaveFailed while keeping API-disabled local preview behavior.
Phase 1B implementation doc: docs/backend/phase-1-account-section-scoped-mutations.md.
Phase 1B validation passed: npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/auth-runtime.test.ts, 4 files passed, 56 tests passed; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; git diff --check; npm run build.
Phase 1B build metric: Account-4Y7df4zk.js 111.70 kB / 25.36 kB gzip.
Phase 1C implemented locally: account responses include accountVersion; current frontend sends x-yorso-account-version on account writes; stale writes return 409 account_snapshot_conflict; /account shows account-save-conflict with reload action and keeps the edited card open.
Phase 1C implementation doc: docs/backend/phase-1-account-conflict-version-handling.md.
Phase 1C targeted validation passed: npm run contracts:build; npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts, 2 files passed, 77 tests passed; npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx, 2 files passed, 37 tests passed; npx tsc -b --noEmit.
Phase 1C full release validation passed: npm run lint; npm run check:production-scale-baseline; git diff --check; npm run api:build; npm run build.
Phase 1C build metric: Account-qLSbC0qo.js 112.83 kB / 25.65 kB gzip.
Phase 1D implemented locally: API config has ACCOUNT_VERSION_PRECONDITION_MODE=optional|required; production self-hosted runtime requires ACCOUNT_VERSION_PRECONDITION_MODE=required; strict account route mode rejects normal /v1/account/* mutations missing x-yorso-account-version with 428 account_version_required; default dev/test/local mode remains optional.
Phase 1D implementation doc: docs/backend/phase-1-account-strict-precondition-policy.md.
Phase 1D targeted validation passed: npm run contracts:build; npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts, 2 files passed, 79 tests passed; npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx, 2 files passed, 37 tests passed.
Phase 1D full release validation passed: npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; git diff --check; npm run api:build; npm run build.
Phase 1D build metric: Account-qLSbC0qo.js 112.83 kB / 25.65 kB gzip.
Phase 1E implemented locally: shared account version precondition helper serves account and storage routes; document list/create and company media upload responses include accountVersion; strict media/document POST routes reject missing x-yorso-account-version with 428 account_version_required and stale headers with 409 account_snapshot_conflict; PostgreSQL account version includes file asset and company document timestamps.
Phase 1E implementation doc: docs/backend/phase-1-account-media-document-version-boundary.md.
Phase 1E targeted validation passed: npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts, 2 files passed, 80 tests passed; npx vitest run src/lib/account-api.test.ts, 1 file passed, 16 tests passed; npx tsc -b --noEmit.
Phase 1E full release validation passed: npm run contracts:build; API repository/server tests, 2 files passed, 80 tests passed; npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx, 2 files passed, 37 tests passed; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; git diff --check; npm run api:build; npm run build.
Phase 1E production build metric: Account-qLSbC0qo.js 112.83 kB / 25.65 kB gzip.
Phase 1F implemented locally: enabled createAccountApiClient no longer falls back to DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID when no explicit/session/configured user id exists; CompanyDocumentsCard accepts the validated account client; /account/company passes its session-bound client into company documents.
Phase 1F implementation doc: docs/backend/phase-1-account-storage-client-authority-boundary.md.
Phase 1F targeted validation passed: npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx, 3 files passed, 52 tests passed.
Phase 1F full release validation passed: npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; git diff --check; npm run build.
Phase 1F production build metric: Account-BesZRqle.js 112.88 kB / 25.69 kB gzip.
Phase 1G implemented locally: account document metadata now writes file asset and company document rows in one atomic PostgreSQL CTE statement; object bytes are deleted if metadata persistence fails; media upload cleans up the newly created asset if company profile update fails; outbox is deferred until async storage processing exists.
Phase 1G implementation doc: docs/backend/phase-1-account-storage-transaction-boundary.md.
Phase 1G targeted validation passed: npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/storage/__tests__/storage.test.ts, 1 file passed, 6 tests passed; npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts, 3 files passed, 86 tests passed; npx tsc -b --noEmit.
Phase 1G full release validation passed: npm run lint; npm run check:production-scale-baseline; git diff --check; npm run api:build; npm run build.
Phase 1G production build metric: Account-BesZRqle.js 112.88 kB / 25.69 kB gzip.
Phase 1H implemented locally: bulk account workspace collection replacement endpoints now use one atomic PostgreSQL CTE statement per collection with input, deleted, touched and insert returning.
Phase 1H implementation doc: docs/backend/phase-1-account-workspace-replace-transaction-boundary.md.
Phase 1H targeted validation passed: npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts, 1 file passed, 17 tests passed; npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts, 3 files passed, 86 tests passed; npx tsc -b --noEmit.
Phase 1H full release validation passed: npm run lint; npm run check:production-scale-baseline; git diff --check; npm run api:build; npm run build.
Phase 1H production build metric: Account-BesZRqle.js 112.88 kB / 25.69 kB gzip.
Phase 1I implemented locally: GET /v1/account/workspace returns an authenticated self-hosted account workspace snapshot; PostgresAccountRepository returns that snapshot through one scoped SQL query; frontend account hydration uses /v1/account/workspace instead of six account section requests.
Phase 1I implementation doc: docs/backend/phase-1-account-workspace-aggregate-read.md.
Phase 1I targeted validation passed: npm run contracts:build; npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx, 3 files passed, 52 tests passed; npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts, 2 files passed, 83 tests passed; npx tsc -b --noEmit.
Phase 1I full release validation passed: npm run lint; npm run check:production-scale-baseline; git diff --check; npm run api:build; npm run build.
Phase 1I production build metric: Account-CK-9-38I.js 112.88 kB / 25.69 kB gzip.
Current Batch #141 scope: localize shared catalog sheet close controls for RU/ES without changing visible catalog drawer layout, compare behavior, route structure, public SEO, access gating, supplier identity redaction or exact-price locks.
Current Batch #141 finding: shared SheetContent hardcoded the default close accessible name as Close; public catalog drawer usages in CompareTray and IntelligenceRail did not pass a localized close label.
Current Batch #141 implementation: SheetContent accepts optional closeLabel while preserving the English fallback; CompareTray and IntelligenceRail pass t.aria_close; SheetCloseLocale.test.tsx guards RU/ES CompareTray and IntelligenceRail close labels; public-sheet-close-locale-a11y e2e opens the real /offers comparison drawer in RU/ES.
Current Batch #141 validation passed: npx vitest run src/components/catalog/SheetCloseLocale.test.tsx, 4 tests; npm run smoke:e2e:public-sheet-close-locale-a11y, 2 tests after production build; npm run check:production-scale-baseline; npx tsc -b --noEmit; npm run lint; git diff --check; npm run smoke:e2e:public-account-menu-a11y:run, 9 tests; npm run smoke:e2e:public-language-selector-a11y:run, 10 tests; npm run smoke:e2e:run, 282 tests.
Current Batch #141 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.53 kB / 114.15 kB gzip; i18n-translations 340.92 kB / 106.94 kB gzip; Offers 72.56 kB / 18.74 kB gzip.
Current Batch #141 PR status: PR #193 passed GitHub Core Type And Build Gate in 13m19s and was squash-merged to main as 5eafcb7.
Lovable sync prompt for Batch #141 is ready: docs/project-memory/PROMPTS/prompt-141-lovable-sync.md.
Lovable sync for Batch #141 is confirmed clean by the user at main @ Batch #141, PR #193, 5eafcb7 or newer, with no conflicts and no local changes.
Lovable confirmed Batch #141 files/routes checked: sheet.tsx, CompareTray, IntelligenceRail, SheetCloseLocale.test.tsx, public-sheet-close-locale-a11y e2e, package.json and production-scale baseline.
Lovable confirmed Batch #141 sheet close a11y: SheetContent accepts optional closeLabel with Close fallback, CompareTray and IntelligenceRail pass t.aria_close, RU/ES unit and e2e guards are present, Close does not leak into RU/ES drawer states.
Lovable confirmed Batch #141 catalog drawer behavior: visible /offers layout, compare tray open/clear/remove, signal drawer toggles, analytics, supplier identity redaction, access gating, exact-price locks, public SEO, route structure, language selector, localStorage yorso-lang, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#140 safeguards are preserved.
Current Batch #141 next step was superseded by the backend Phase 2A workstream requested by the user.
Current Batch #140 scope: make signed-in public header account controls explicit to assistive tech without changing visible header layout, account destinations, session storage, routes, access behavior or SEO.
Current Batch #140 finding: the desktop signed-in account chip exposed only the buyer display name/email without a localized menu purpose; the dropdown was not associated through aria-controls and did not expose a named group; the mobile account panel did not expose localized account-menu context.
Current Batch #140 implementation: Header adds localized account menu/current account labels, aria-haspopup/aria-controls on the desktop account chip, role=group around desktop dropdown and mobile account panel, unit coverage in Header.landmarks.test.tsx and RU leak coverage in aria-tooltips-localized.ru.test.tsx, plus e2e/public-account-menu-a11y.spec.ts and package smoke wiring.
Current Batch #140 validation passed: npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx, 17 tests; npm run check:production-scale-baseline; npm run smoke:e2e:public-account-menu-a11y, 9 tests after production build; npm run smoke:e2e:public-language-selector-a11y:run, 10 tests; npm run smoke:e2e:public-landmark-labels:run, 39 tests; npx tsc -b --noEmit; npm run lint; git diff --check; npm run smoke:e2e:run, 280 tests.
Current Batch #140 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.53 kB / 114.17 kB gzip; i18n-translations 340.92 kB / 106.94 kB gzip; Header 50.54 kB / 14.20 kB gzip.
Current Batch #140 PR status: PR #192 passed GitHub Core Type And Build Gate in 12m54s and was squash-merged to main as 8ad19a6.
Lovable sync prompt for Batch #140 is ready: docs/project-memory/PROMPTS/prompt-140-lovable-sync.md.
Lovable sync for Batch #140 is confirmed clean by the user at main @ Batch #140, PR #192, 8ad19a6 or newer, with no conflicts and no local changes.
Lovable confirmed Batch #140 files/routes checked: Header, translations, Header.landmarks.test.tsx, aria-tooltips-localized.ru.test.tsx, public-account-menu-a11y e2e, package.json and production-scale baseline.
Lovable confirmed Batch #140 account menu a11y: EN/RU/ES account-menu/current-account labels are present; desktop account chip exposes localized aria-label, aria-expanded, aria-haspopup and aria-controls; desktop dropdown exposes stable id, role=group and localized aria-label; mobile signed-in panel exposes role=group with localized account context.
Lovable confirmed Batch #140 mobile/header behavior: visible header layout, destinations and storage are unchanged; checked signed-in public routes keep zero nested controls and zero 390px overflow; public SEO, access gating, supplier identity redaction, exact-price locks, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#139 safeguards are preserved.
Current Batch #139 scope: make the public header language selector explicit to assistive tech without changing visible header layout, language storage, routes, access behavior or SEO.
Current Batch #139 finding: the desktop language toggle exposed only abbreviated visible text like EN/RU/ES without a localized purpose, and mobile language chips did not expose selected state.
Current Batch #139 implementation: Header adds localized language selector/current/select labels, aria-expanded/aria-controls on the desktop selector, role=group around desktop and mobile language controls, aria-pressed on each language option, unit coverage in Header.landmarks.test.tsx and RU leak coverage in aria-tooltips-localized.ru.test.tsx, plus e2e/public-language-selector-a11y.spec.ts and package smoke wiring.
Current Batch #139 validation passed: npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx, 13 tests; npm run check:production-scale-baseline; npm run smoke:e2e:public-language-selector-a11y, 10 tests after production build; npm run smoke:e2e:public-landmark-labels:run, 39 tests; npx tsc -b --noEmit; npm run lint; git diff --check; npm run smoke:e2e:run, 271 tests.
Current Batch #139 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.53 kB / 114.16 kB gzip; i18n-translations 340.69 kB / 106.86 kB gzip; Header 50.30 kB / 14.14 kB gzip.
Current Batch #139 PR status: PR #191 passed GitHub Core Type And Build Gate in 12m27s and was squash-merged to main as 6721b65.
Lovable sync prompt for Batch #139 is ready: docs/project-memory/PROMPTS/prompt-139-lovable-sync.md.
Lovable sync for Batch #139 is confirmed clean by the user at main @ Batch #139, PR #191, 6721b65 or newer, with no conflicts and no file modifications.
Lovable confirmed Batch #139 files/routes checked: Header, translations, Header.landmarks.test.tsx, aria-tooltips-localized.ru.test.tsx, public-language-selector-a11y e2e, package.json and production-scale baseline.
Lovable confirmed Batch #139 language selector a11y: EN/RU/ES selector/current/select labels are present; desktop selector exposes localized aria-label, aria-expanded, aria-haspopup and aria-controls; desktop dropdown/options expose group naming and aria-pressed; mobile chips expose localized group naming and aria-pressed.
Lovable confirmed Batch #139 mobile/header behavior: visible header layout, navigation destinations and yorso-lang persistence are unchanged; checked public routes keep zero nested controls and zero 390px overflow; public SEO, access gating, supplier identity redaction, exact-price locks, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#138 safeguards are preserved.
Current Batch #138 scope: make public info/legal routes route-owned SEO surfaces without changing visible page copy or offer/supplier/access behavior.
Current Batch #138 routes: /about, /contact, /terms, /privacy, /cookies, /gdpr, /anti-fraud, /careers, /press, /partners.
Current Batch #138 finding: shared info/legal pages used global site metadata even though they are trust/legal decision-support pages for buyers, partners and suppliers.
Current Batch #138 implementation: InfoPageLayout now applies localized route-owned title, description, canonical URL, OG/Twitter metadata and WebPage JSON-LD; info/legal pages pass existing localized intro copy as description and canonicalPath; InfoPageSeo.test.tsx and e2e/public-info-route-seo.spec.ts guard EN/RU metadata, mobile CTA semantics, nested controls and overflow.
Current Batch #138 validation passed: npx vitest run src/pages/InfoPageSeo.test.tsx src/i18n/locale-document-meta-ru.test.tsx, 14 tests; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; npm run smoke:e2e:public-info-route-seo, 11 tests after production build; npm run smoke:e2e:public-cta-semantics:run, 12 tests; npm run smoke:e2e:public-landmark-labels:run, 39 tests; git diff --check; npm run smoke:e2e:run, 261 tests.
Current Batch #138 PR status: PR #190 passed GitHub Core Type And Build Gate in 12m42s and was squash-merged to main as 7eea5ce.
Current Batch #138 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.53 kB / 114.18 kB gzip; i18n-translations 340.35 kB / 106.73 kB gzip; InfoPageLayout 2.13 kB / 1.13 kB gzip; info page chunks 1.19-1.80 kB minified.
Lovable sync prompt for Batch #138 is ready: docs/project-memory/PROMPTS/prompt-138-lovable-sync.md.
Lovable sync for Batch #138 is confirmed clean by the user at main @ Batch #138, PR #190, 7eea5ce or newer, with no conflicts and no file modifications.
Lovable confirmed Batch #138 files/routes checked: InfoPageLayout, all 10 info/legal pages, InfoPageSeo.test.tsx, locale-document-meta-ru.test.tsx, public-info-route-seo e2e, package.json and production-scale baseline.
Lovable confirmed Batch #138 route SEO: localized `{title} | YORSO`, canonical paths, localized descriptions, OG/Twitter metadata, one info-page JSON-LD script, AboutPage/ContactPage/WebPage schema split and RU direct entry on /anti-fraud with localized RU metadata and og:locale=ru_RU.
Lovable confirmed Batch #138 mobile/CTA status: Back to homepage remains a single direct link, nested controls are absent, 390px overflow is absent, Header/footer/skip link/landmarks/route structure are unchanged and Batches #110-#137 plus Batch #113 are preserved.
Latest merged public UX/a11y batch: Batch #141 public sheet close locale a11y is merged to main as 5eafcb7 via PR #193.
Latest Lovable-synced public UX/a11y batch: Batch #141 public sheet close locale a11y is merged to main as 5eafcb7 via PR #193 and Lovable sync is confirmed clean.
Current Batch #137 scope: localize lower buyer decision-support blocks on /offers/:id and harden locked-buyer recommendations without changing product data fetching.
Current Batch #137 finding: /offers/:id lower sections still had hardcoded English UI labels in TrustSection, FullSpecifications, SimilarOffers, SimilarProducts, RelatedArticles and DecisionFAQ. SimilarOffers/SimilarProducts also rendered raw mock offer price ranges for locked buyers.
Current Batch #137 implementation: TrustSection, FullSpecifications, SimilarOffers, SimilarProducts, RelatedArticles and DecisionFAQ now use typed EN/RU/ES offerDetail decision-support keys; OfferDetail passes renderAccessLevel into lower trust/recommendation blocks; similar offer/product cards show exact prices only for qualified_unlocked buyers; related insight cards are real React Router links; FAQ disclosures expose aria-expanded, aria-controls and mobile-safe targets; e2e/offer-detail-decision-support-locale-a11y.spec.ts and DecisionSupport.locale.test.tsx guard the contract.
Current Batch #137 validation passed: npx tsc -b --noEmit; npx vitest run src/components/offer-detail/DecisionSupport.locale.test.tsx, 2 tests; npm run smoke:e2e:offer-detail-decision-support-locale-a11y, 2 tests after production build; npm run smoke:e2e:offer-detail-supplier-trust-locale-a11y:run, 2 tests; npm run smoke:e2e:offer-detail-mobile-a11y:run, 2 tests; npm run smoke:e2e:public-offer-locale-a11y:run, 2 tests; npm run check:production-scale-baseline; npm run lint; git diff --check; npm run smoke:e2e:run, 250 tests.
GitHub Core Type And Build Gate passed on PR #189 in 12m23s.
Lovable sync prompt for Batch #137 is ready: docs/project-memory/PROMPTS/prompt-137-lovable-sync.md.
Lovable sync for Batch #137 is confirmed clean by the user at main @ Batch #137, PR #189, 15fc5f8 or newer, with no conflicts and no file modifications.
Lovable confirmed Batch #137 files/routes checked: OfferDetail, TrustSection, FullSpecifications, SimilarOffers, SimilarProducts, RelatedArticles, DecisionFAQ, translations, DecisionSupport.locale.test.tsx, offer-detail-decision-support-locale-a11y e2e, package.json and production-scale baseline.
Lovable confirmed Batch #137 locale/a11y status: RU/ES lower decision-support labels are localized, hardcoded English labels do not leak, FAQ/Full Specs expose aria-expanded/aria-controls, related insights are links, no nested controls and no 390px overflow.
Lovable confirmed Batch #137 locked-buyer behavior: SimilarOffers/SimilarProducts show localized locked-price labels while renderAccessLevel is not qualified_unlocked, Lower price reason is skipped for locked buyers, and access gating, supplier identity redaction, exact-price lock, SupplierAccessRequestPanel, Market Pulse, SEO, sticky mobile CTA and buyer-first copy are unchanged.
Browser note: Codex in-app browser runtime was attempted for local preview but the browser-client pipe was unavailable; mobile/runtime verification was completed with Playwright at 390px.
Latest previous merged batch: Batch #136 offer detail supplier trust locale a11y is merged to main as 3720708 via PR #188.
Current Batch #136 scope: localize supplier trust panel UI labels on /offers/:id, keep the supplier trust mechanism buyer-first, and prevent the expanded trust disclosure from creating mobile horizontal overflow.
Current Batch #136 finding: /offers/:id SupplierTrustPanel still had hardcoded English UI labels and CTAs (`Verified Supplier`, `Pending Full Verification`, `What was reviewed?`, `Hide details`, `In business`, `Response`, `Certifications`, `Reviewed documents`, `View Supplier Profile`, `Contact Supplier`, `Save to Shortlist`, `Compare Similar Offers`) inside localized RU/ES offer detail UI. The RU expanded trust disclosure also created 15px horizontal overflow at 390px.
Current Batch #136 implementation: SupplierTrustPanel now uses typed EN/RU/ES offerDetail supplier trust translation keys, pluralized years-in-business copy and a scoped verification test id; OfferDetail route shells use `overflow-x-hidden`; `e2e/offer-detail-supplier-trust-locale-a11y.spec.ts` covers RU/ES localized supplier trust labels, disclosure target size, nested controls and zero overflow; package smoke wiring and Batch #136 production-scale notes are present.
Current Batch #136 validation passed: `npx vitest run src/components/offer-detail/SupplierTrustPanel.access.test.tsx`, 4 tests; `npm run smoke:e2e:offer-detail-supplier-trust-locale-a11y`, 2 tests after production build; `npm run smoke:e2e:offer-detail-mobile-a11y:run`, 2 tests; `npm run smoke:e2e:public-offer-locale-a11y:run`, 2 tests; `npm run check:production-scale-baseline`; `git diff --check`; `npm run lint`; `npx tsc -b --noEmit`; `npm run smoke:e2e:run`, 248 tests; GitHub Core Type And Build Gate passed on PR #188 in 11m57s.
Lovable sync for Batch #136 is confirmed clean by the user at main @ Batch #136, PR #188, 3720708 or newer, with no conflicts and no file modifications.
Lovable confirmed Batch #136 files/routes checked: SupplierTrustPanel, translations, OfferDetail, SupplierTrustPanel.access.test.tsx, offer-detail-supplier-trust-locale-a11y e2e, package.json and production-scale baseline.
Lovable confirmed Batch #136 locale/a11y status: RU and ES supplier trust labels are localized, hardcoded English labels do not leak into RU/ES UI, disclosure target is min-h-11 and there are no nested interactive controls.
Lovable confirmed Batch #136 preserves offer detail behavior, access gating, supplier identity redaction, exact-price lock, SupplierAccessRequestPanel, MarketPulse, SEO, analytics, buyer-first copy, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#135 safeguards.
Lovable sync prompt for the latest merged batch: docs/project-memory/PROMPTS/prompt-139-lovable-sync.md.
Lovable sync for Batch #135 is confirmed clean by the user at main @ Batch #135, eb23d5f or newer, with no conflicts and no file modifications.
Batch #135 GitHub validation passed: PR #187 Core Type And Build Gate passed in 12m21s.
Batch #135 changed files: src/pages/SupplierProfile.tsx, src/pages/__tests__/SupplierProfile.i18n.test.tsx, e2e/supplier-profile-logo-locale-a11y.spec.ts, package.json, docs/backend/production-scale-baseline.md and project-memory files.
Lovable confirmed Batch #135 files/routes checked: src/pages/SupplierProfile.tsx, src/i18n/translations.ts, src/pages/__tests__/SupplierProfile.i18n.test.tsx, e2e/supplier-profile-logo-locale-a11y.spec.ts, package.json and docs/backend/production-scale-baseline.md.
Lovable confirmed Batch #135 locale/a11y status: EN, RU and ES supplier profile logo accessible names and alt text are localized, with cross-locale leakage excluded by tests and i18n keys.
Lovable confirmed Batch #135 preserves supplier profile behavior, access gating, identity redaction, approval refresh, profile tabs, directory/profile bridge, route SEO, buyer-first trust copy, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#134 safeguards.
Lovable sync for Batch #134 is confirmed clean by the user at main @ Batch #134, 6cd21e9 or newer, with no conflicts and no file modifications.
Batch #135 scope: localize supplier profile logo accessible name and image alt text on /suppliers/:id using the existing supplier_logo_aria translation template while preserving supplier profile route behavior.
Batch #135 finding: SupplierLogoCard used hardcoded Russian wrapper aria-label `Логотип {name}` and hardcoded English image alt `{name} logo`, creating wrong-locale programmatic copy on the supplier trust route.
Batch #135 implementation: SupplierProfile derives the logo wrapper aria-label and image alt from `interpolate(t.supplier_logo_aria, { name })`; SupplierProfile.i18n.test.tsx guards EN/RU/ES; e2e/supplier-profile-logo-locale-a11y.spec.ts covers `/suppliers/sup-no-001` at 390px in EN/RU/ES; package smoke wiring and Batch #135 production-scale notes are present.
Batch #135 validation passed: npx vitest run src/pages/__tests__/SupplierProfile.i18n.test.tsx, 24 tests; npm run check:production-scale-baseline; npm run smoke:e2e:supplier-profile-logo-locale-a11y, 3 tests after production build; npm run smoke:e2e:supplier-profile-mobile-a11y:run, 2 tests; npm run smoke:e2e:supplier-profile-detail:run, 4 tests; npx tsc -b --noEmit; npm run lint; explicit SupplierProfile unit suite, 81 tests passed and 2 skipped; git diff --check; npm run smoke:e2e:run, 246 tests.
Lovable sync for Batch #133 is confirmed clean by the user at main @ Batch #133, ca1438b or newer, with no conflicts.
Lovable sync for Batch #132 is confirmed clean at d1bf472 with no conflicts and 7 focused tests passed.
Batch #133 scope: replace hardcoded English breadcrumb accessible names on /suppliers, /blog and /blog/:slug with the existing locale-owned aria_breadcrumb value while preserving supplier directory behavior, blog/article routing, SEO, mobile tap-target hardening and buyer-first content structure.
Batch #133 local validation passed: npx vitest run src/i18n/aria-tooltips-localized.ru.test.tsx, 7 tests; npm run smoke:e2e:public-breadcrumb-locale-a11y, 3 tests after production build; npm run smoke:e2e:public-breadcrumb-locale-a11y:run, 3 tests; npm run smoke:e2e:blog-mobile-tap-targets:run, 2 tests; npm run smoke:e2e:suppliers-directory:run, 5 tests; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; npm run smoke:e2e:run, 242 tests.
Batch #133 GitHub validation passed: PR #185 Core Type And Build Gate passed after one rerun; the first failure was an existing suppliers-directory-paging flake and passed on rerun without code changes.
Batch #133 changed files: src/pages/Suppliers.tsx, src/pages/Blog.tsx, src/pages/BlogArticle.tsx, src/i18n/aria-tooltips-localized.ru.test.tsx, e2e/public-breadcrumb-locale-a11y.spec.ts, package.json, docs/backend/production-scale-baseline.md and project-memory files.
Batch #133 preserves Batch #112 route code splitting, Batch #113 RouteChunkErrorBoundary, Batches #117-#132 public UX/a11y safeguards, access gating, supplier identity redaction, price-lock, SEO route ownership and analytics.
Lovable confirmed Batch #133 files/routes checked: src/pages/Suppliers.tsx, src/pages/Blog.tsx, src/pages/BlogArticle.tsx, src/pages/OfferDetail.tsx, src/i18n/aria-tooltips-localized.ru.test.tsx, e2e/public-breadcrumb-locale-a11y.spec.ts, package.json and docs/backend/production-scale-baseline.md.
Batch #134 scope: localize public supplier-directory trust labels and image alt text on /suppliers while preserving supplier directory behavior, access gating, supplier identity redaction, shortlist behavior, sorting/filtering/pagination and supplier profile routing.
Batch #134 finding: /suppliers still exposed hardcoded English programmatic labels and alt phrases for selected supplier, supplier signals, product catalog preview, delivery markets preview, hero reference image and product preview images under RU.
Batch #134 local validation passed: npx vitest run src/pages/Suppliers.i18n.test.tsx src/components/suppliers/SupplierRow.test.tsx src/components/suppliers/SupplierRow.snapshot.test.tsx, 24 tests; npm run smoke:e2e:suppliers-directory-locale-a11y, 1 test after production build; npm run smoke:e2e:suppliers-directory:run, 5 passed with one retry-resolved existing paging flake; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; git diff --check; npm run smoke:e2e:run, 243 tests.
Batch #134 GitHub validation passed: PR #186 Core Type And Build Gate passed after one rerun; the first failure was the known suppliers-directory-paging test and the new suppliers-directory-locale-a11y spec passed in that failed run.
Batch #134 merge: PR #186 was marked ready and squash-merged to main as 6cd21e9, [codex] Batch #134 supplier directory locale a11y (#186).
Lovable confirmed Batch #134 files/routes checked: src/i18n/translations.ts, src/pages/Suppliers.tsx, src/components/suppliers/SupplierRow.tsx, src/components/suppliers/SelectedSupplierPanel.tsx, src/pages/Suppliers.i18n.test.tsx, e2e/suppliers-directory-locale-a11y.spec.ts, package.json and docs/backend/production-scale-baseline.md.
Lovable confirmed Batch #134 locale/a11y status: RU selected supplier, supplier signals, catalog preview, delivery preview and image alt text are localized, with no hardcoded English leakage under RU.
Lovable confirmed Batch #134 preserves supplier directory behavior, access gating, redaction, exact-price/supplier locks, SEO, analytics, buyer-first copy, Pulse compact contract, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#133.
Batch #132 local scope: remove hardcoded Russian visible/programmatic labels from English public offer catalog cards and offer-detail commercial summary while preserving buyer access gating, supplier identity redaction and price lock.
Batch #132 local validation passed: npx vitest run src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/offer-detail/OfferSummary.locale.test.tsx, 4 tests; npx tsc -b --noEmit; npm run smoke:e2e:public-offer-locale-a11y, 2 tests after production build; npm run smoke:e2e:public-offer-locale-a11y:run, 2 tests; npm run lint; npm run check:production-scale-baseline; npm run smoke:e2e:run, 239 tests.
Batch #132 was rebased onto origin/main 35317b0 without conflicts; post-rebase validation passed: focused unit tests, npx tsc -b --noEmit, npm run lint, npm run check:production-scale-baseline and npm run smoke:e2e:public-offer-locale-a11y.
PR #184 GitHub gate initially failed because public-pulse-disclosure e2e still required visible `estimate` text after `origin/main` 35317b0 removed the compact visible estimate chip; the test, production-scale note and project memory now match the current programmatic disclosure contract.
Batch #132 CI-fix validation passed: focused Pulse + offer locale unit tests, npx tsc -b --noEmit, npm run lint, npm run check:production-scale-baseline, npm run smoke:e2e:public-pulse-disclosure, npm run smoke:e2e:public-offer-locale-a11y:run and npm run smoke:e2e:run, 239 tests.
GitHub Core Type And Build Gate passed on PR #184; PR #184 merged to main as ab46fd3.
GitHub Core Type And Build Gate passed on PR #183 in 10m13s.
Lovable sync for Batch #131 is confirmed clean at 6655d11 with no conflicts and no file modifications.
Lovable confirmed PulseBadge estimate disclosure, Dynamic Pulse behavior, MarketPulse labelled section, public-pulse-disclosure e2e guard, package wiring, Batch #131 production-scale notes, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#130.
Current PulseBadge contract after `origin/main` `35317b0`: visible activity count only on the compact badge; estimate status remains programmatic through `aria-label` and `title`.
Batch #131 was rebased onto origin/main da880e4 to preserve dynamic PulseBadge behavior before merge.
Batch #131 preserves dynamic Pulse count drift, programmatic estimate disclosure, reduced-motion guards, access gating, supplier identity redaction, price locks, SEO route ownership, analytics, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #117-#130 public UX/a11y safeguards.
Batch #130 supplier profile mobile accessibility is merged to main as 1449efa via PR #181 and Lovable sync is confirmed clean.
Lovable sync for Batch #130 is confirmed clean at 1449efa with no conflicts and no file modifications.
Lovable sync for Batch #129 is confirmed clean at 2550a29 with no conflicts and no file modifications.
Batch #131 runtime audit focused on public Pulse activity signals introduced by recent Lovable/user changes: homepage offer Pulse badges and offer-detail MarketPulse.
Batch #131 finding: live-looking buyer activity and market-pulse signals disclosed their estimate status only weakly, with homepage Pulse badges hiding estimate status in title-only copy and pulse animations lacking reduced-motion guards.
Batch #131 implementation: PulseBadge exposes localized programmatic estimate disclosure and disables ping animation under reduced motion; MarketPulse is a labelled section and its ping animation also respects reduced motion; e2e/public-pulse-disclosure.spec.ts and src/components/PulseBadge.test.tsx cover the current contract.
Batch #131 local validation passed before and after rebase: npx vitest run src/components/PulseBadge.test.tsx, 3 tests; E2E_BASE_URL=http://127.0.0.1:4203 npx playwright test e2e/public-pulse-disclosure.spec.ts --project=chromium, 2 tests before rebase; E2E_BASE_URL=http://127.0.0.1:4203 npx playwright test e2e/public-heading-structure.spec.ts e2e/public-landmark-labels.spec.ts --project=chromium, 47 tests before rebase; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; npm run smoke:e2e:public-pulse-disclosure, 2 tests after production build; npm run smoke:e2e:run, 237 tests.
Batch #131 build metrics from dedicated smoke: CSS 126.77 kB / 21.01 kB gzip; entry 355.47 kB / 114.18 kB gzip; i18n-translations 317.70 kB / 100.04 kB gzip; Index 37.69 kB / 10.56 kB gzip; OfferDetail 50.96 kB / 13.01 kB gzip; pulse-seed 0.58 kB / 0.44 kB gzip.
Batch #130 runtime audit focused on /suppliers/:id, the supplier trust/supply route after Batch #129 Lovable sync.
Batch #130 findings: breadcrumb Home/Suppliers links, supplier trust/profile tabs and unknown-supplier recovery link could render below the 44px mobile target baseline.
Batch #130 implementation: SupplierProfile breadcrumbs use localized breadcrumb landmark naming and mobile-safe targets; supplier profile TabsTriggers use min-h-11; supplier not-found directory recovery link uses a mobile-safe target; e2e/supplier-profile-mobile-a11y.spec.ts covers profile and not-found states; package smoke wiring and Batch #130 production-scale baseline note are present.
Batch #130 local validation passed: E2E_BASE_URL=http://127.0.0.1:4202 npx playwright test e2e/supplier-profile-mobile-a11y.spec.ts --project=chromium, 2 tests; E2E_BASE_URL=http://127.0.0.1:4202 npx playwright test e2e/supplier-profile-mobile-a11y.spec.ts e2e/supplier-profile-detail.spec.ts e2e/supplier-profile-access.spec.ts e2e/supplier-directory-profile-flow.spec.ts --project=chromium, 12 tests; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; npm run smoke:e2e:supplier-profile-mobile-a11y, 2 tests after production build; npm run smoke:e2e:run, 235 tests.
Batch #130 GitHub validation passed: Core Type And Build Gate on PR #181 in 12m26s.
Lovable confirmed SupplierProfile breadcrumb localization, supplier-profile mobile target markers, package smoke wiring, Batch #130 production-scale notes, preserved access gating, supplier identity redaction, approval refresh, directory bridge, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#129.
Batch #130 preserves supplier profile copy, route behavior, access gating, supplier identity redaction, approval refresh, directory/profile bridge, Batch #126 skip-to-main, Batch #125 landmark labels, Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary.
Batch #129 runtime audit focused on /offers/:id, the buyer decision route, after Batch #128 Lovable sync.
Batch #129 findings: unnamed visible gallery/photo controls; undersized mobile targets for back-to-catalog, breadcrumbs, delivery-basis chips, supplier review-scope disclosure and full specifications disclosure.
Batch #129 implementation: named and mobile-safe PhotoGallery controls/thumbnails/lightbox controls, mobile-safe OfferDetail breadcrumbs/back action, mobile-safe OfferSummary delivery-basis controls, aria-expanded on SupplierTrustPanel and FullSpecifications disclosures, e2e/offer-detail-mobile-a11y.spec.ts, package smoke wiring and Batch #129 production-scale baseline note.
Batch #129 local validation passed: focused runtime Playwright scan on /offers/:id at 390px; E2E_BASE_URL=http://127.0.0.1:4201 npx playwright test e2e/offer-detail-mobile-a11y.spec.ts --project=chromium, 2 tests; E2E_BASE_URL=http://127.0.0.1:4201 npx playwright test e2e/offer-detail-cta-semantics.spec.ts e2e/offer-detail-runtime.spec.ts e2e/offer-detail-mobile-a11y.spec.ts --project=chromium, 9 tests; npx tsc -b --noEmit; npm run check:production-scale-baseline; npm run lint; npm run smoke:e2e:offer-detail-mobile-a11y; npm run smoke:e2e:run, 233 tests.
GitHub Core Type And Build Gate passed on PR #180 in 12m46s.
Lovable confirmed PhotoGallery localization, offer-detail mobile target markers, aria-expanded disclosures, preserved access gating, supplier identity redaction, price lock, Batch #121 CTA semantics, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#128.
Batch #121 is merged to main as 809d35f via PR #172 and Lovable sync is confirmed clean at 9b8f9434.
Batch #119 Lovable sync is confirmed clean at 851ad960 with no conflicts and no file changes.
Batch #122 is merged to main as dc2a3ca via PR #173.
Batch #122 Lovable sync is confirmed clean at 98335bd with no conflicts and no file changes.
Batch #122 fixes nested interactive controls on homepage and shared info/legal CTA surfaces.
Batch #123 fixes unnamed visible input controls on `/` and `/signin`: homepage search, sign-in email, phone, password and forgot-password email fields now have programmatic names.
Batch #123 is merged to main as 5105f3c, [codex] Batch #123 public input accessibility, via PR #174.
Batch #123 local validation passed: npx vitest run src/pages/PublicInputA11y.test.tsx; npm run smoke:e2e:public-input-a11y; npm run lint; npx tsc -b --noEmit; npm run check:production-scale-baseline; npm run smoke:e2e:run, 129 tests.
GitHub Core Type And Build Gate passed on PR #174 in 11m31s.
Lovable sync prompt is ready: docs/project-memory/PROMPTS/prompt-123-lovable-sync.md.
Lovable sync for Batch #123 is confirmed clean at 50b10bc with no conflicts and no file changes.
Batch #124 fixes public-route heading outline regressions: footer column labels are navigation labels instead of H4 page headings, and /suppliers rows sit under an H2 Supplier results section.
Batch #124 is merged to main as fdaf76a, [codex] Batch #124 public heading structure, via PR #175.
GitHub Core Type And Build Gate passed on PR #175 in 11m28s.
Batch #124 local validation passed: npx vitest run src/components/landing/Footer.test.tsx src/pages/Suppliers.test.tsx; npm run smoke:e2e:public-heading-structure; npm run lint; npx tsc -b --noEmit; npm run check:production-scale-baseline; npm run smoke:e2e:run, 137 tests.
Lovable sync prompt is ready: docs/project-memory/PROMPTS/prompt-124-lovable-sync.md.
Lovable sync for Batch #124 is confirmed clean at 05d09f4b with no conflicts and no file changes.
Lovable confirmed Footer nav groups, Suppliers results H2, EN/RU/ES suppliersPage_resultsHeading, public-heading e2e guard, package smoke wiring, preserved Batch #112 code splitting, preserved Batch #113 RouteChunkErrorBoundary, buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#123.
Batch #125 runtime audit found unnamed visible public landmarks: desktop header nav, open mobile header nav, two /how-it-works asides, /blog sidebar aside and /blog/:slug article tools aside.
Batch #125 implementation labels those landmarks with locale-owned navigation/complementary names, adds Header landmark unit coverage, adds e2e/public-landmark-labels.spec.ts, wires the dedicated/full smoke scripts, and records the 10,000 concurrent-user baseline note.
Batch #125 local validation passed: npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx; npx tsc -b --noEmit; npm run check:production-scale-baseline; npm run smoke:e2e:public-landmark-labels; npm run lint; npm run smoke:e2e:run, 176 tests.
Batch #125 is merged to main as 7196cc8, [codex] Batch #125 public landmark labels (#176), via PR #176.
GitHub Core Type And Build Gate passed on PR #176 in 11m52s.
Lovable sync prompt is ready: docs/project-memory/PROMPTS/prompt-125-lovable-sync.md.
Lovable sync for Batch #125 is confirmed clean at a984c87 with no conflicts and no file changes.
Lovable confirmed Header desktop/mobile landmark labels, HowItWorks supplier/trust aside labels, Blog and BlogArticle sidebar labels, EN/RU/ES i18n keys, RU leak guard, public-landmark e2e guard, package smoke wiring, preserved Batch #112 code splitting, preserved Batch #113 RouteChunkErrorBoundary, buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#124.
Batch #126 runtime audit found public routes lacked a reliable keyboard skip-to-main path: homepage had no main landmark, skip-to-content was absent, and some public shells/fallback states had no stable main#main target.
Batch #126 implementation adds an opt-in Header skip link, EN/RU/ES aria_skipToMain copy, exact one main#main targets across audited public routes, e2e/public-skip-main-target.spec.ts and a 10,000 concurrent-user baseline note.
Batch #126 local validation passed: runtime Playwright pre-check; E2E_BASE_URL=http://127.0.0.1:4198 npx playwright test e2e/public-skip-main-target.spec.ts --project=chromium, 43 tests; npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx, 8 tests; npx tsc -b --noEmit; npm run check:production-scale-baseline; npm run smoke:e2e:public-skip-main-target, 43 tests; npm run lint; git diff --check; npm run smoke:e2e:run, 219 tests.
Batch #126 is merged to main as c1ebd76, [codex] Batch #126 public skip-to-main target (#177), via PR #177.
GitHub Core Type And Build Gate passed on PR #177 in 11m54s.
Lovable sync prompt is ready: docs/project-memory/PROMPTS/prompt-126-lovable-sync.md.
Lovable sync for Batch #126 is confirmed clean at 6a27659 with no conflicts and a clean tree.
Lovable confirmed Header showSkipLink/mainId, EN/RU/ES aria_skipToMain, RU leak guard, public route shells with Header showSkipLink plus main#main, e2e/public-skip-main-target.spec.ts, package smoke wiring, preserved Batch #125 landmark labels, preserved Batch #113 RouteChunkErrorBoundary, preserved Batch #112 code splitting, buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#125.
Batch #126 preserves public visual layout, buyer-first copy, CTA destinations, SEO route ownership, mobile overflow fixes, access gating, supplier identity redaction, price-lock, Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary.
Batch #127 runtime audit found public blog mobile tap-target defects: /blog filter chips, topic chips, read-more links, see-all-updates link and /blog/:slug breadcrumbs/mobile TOC links could render below 44px.
Batch #127 implementation enlarges mobile-safe target zones on existing Blog and BlogArticle controls, adds data-blog-mobile-target markers, adds e2e/blog-mobile-tap-targets.spec.ts, wires dedicated/full smoke scripts and records the 10,000 concurrent-user baseline note.
Batch #127 local validation passed: post-fix runtime Playwright target scan for /blog and /blog/atlantic-salmon-q1-price-pressure; E2E_BASE_URL=http://127.0.0.1:4199 npx playwright test e2e/blog-mobile-tap-targets.spec.ts --project=chromium, 2 tests; npx tsc -b --noEmit; npm run lint; npm run check:production-scale-baseline; npm run smoke:e2e:blog-mobile-tap-targets, 2 tests; npm run smoke:e2e:run, 221 tests.
Batch #127 is merged to main as 3aed8dd, [codex] Batch #127 public blog mobile tap targets (#178), via PR #178.
GitHub Core Type And Build Gate passed on PR #178 in 12m16s.
Lovable sync prompt is ready: docs/project-memory/PROMPTS/prompt-127-lovable-sync.md.
Lovable sync for Batch #127 is confirmed clean at e8d096f with no conflicts and no file modifications.
Lovable confirmed Blog and BlogArticle mobile tap target markers, min-h-11/min-w-11 helper classes, e2e/blog-mobile-tap-targets.spec.ts, package smoke wiring, Batch #127 production-scale notes, preserved Batch #126 skip-to-main, Batch #125 landmark labels, Batch #113 RouteChunkErrorBoundary and Batch #112 code-splitting.
Batch #127 preserves blog copy, routes, SEO, buyer-first narrative, access gating, supplier identity redaction, price-lock, Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary.
Batch #128 runtime audit found the registration flow was not covered by previous public accessibility batches: `/register*` routes had no stable `main#main`, no skip-to-main link, several registration shell/legal/secondary targets below 44px, unnamed OTP inputs, missing completion hints and a nested Link/Button CTA on `/register/ready`.
Batch #128 implementation adds `main#main` and a hidden-until-focus skip link to `RegistrationLayout`, hardens registration shell/footer/action mobile targets, adds form labels and autocomplete hints to registration/auth fields, removes the `/register/ready` nested CTA with `Button asChild`, adds `e2e/public-auth-registration-a11y.spec.ts`, wires dedicated/full smoke scripts and records the 10,000 concurrent-user baseline note.
Batch #128 local validation passed: `E2E_BASE_URL=http://127.0.0.1:4200 npx playwright test e2e/public-auth-registration-a11y.spec.ts --project=chromium`, 10 tests; `E2E_BASE_URL=http://127.0.0.1:4200 npx playwright test e2e/public-input-a11y.spec.ts e2e/auth-cta-semantics.spec.ts --project=chromium`, 5 tests; `npx tsc -b --noEmit`; `npm run check:production-scale-baseline`; `npm run lint`; `git diff --check`; `npm run smoke:e2e:public-auth-registration-a11y`, 10 tests after production build; `npm run smoke:e2e:run`, 231 tests.
Batch #128 is merged to main as 912230c, [codex] Batch #128 public auth registration accessibility (#179), via PR #179.
GitHub Core Type And Build Gate passed on PR #179 in 11m57s.
Lovable sync prompt is ready: docs/project-memory/PROMPTS/prompt-128-lovable-sync.md.
Lovable sync for Batch #128 is confirmed clean at f1f482b with no conflicts and no file modifications.
Lovable confirmed RegistrationLayout, CountryPhoneInput, SignIn, ResetPassword, RegisterChoose/Email/Verify/Details/Onboarding/Countries/Ready, e2e/public-auth-registration-a11y.spec.ts, package smoke wiring, Batch #128 production-scale notes, registration field autocomplete, skip/main landmarks, no nested controls, /register/ready Button asChild CTA, 44px mobile registration targets, preserved Batch #112 code splitting, Batch #113 error boundary, Batch #125 landmarks, Batch #126 skip-to-main and Batch #127 blog tap targets.
Batch #128 preserves registration copy, route flow, analytics hooks, local registration storage behavior, auth runtime behavior, buyer-first public narrative, access gating, supplier identity redaction, price locks, Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary.
Known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
Next step: start the next scoped public UX/UI audit batch from current main.
```
