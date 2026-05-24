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
- `docs/project-memory/PROMPTS/prompt-125-lovable-sync.md`: Lovable sync prompt for Batch #125 after PR #176 merge.

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

## Lovable Sync Prompts

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
