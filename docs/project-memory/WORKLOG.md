# Worklog

Keep this file factual and append-only.

## 2026-05-17

- Created project-memory black box for `yorso-commerce-hub`.
- Added `AGENTS.md` with project recovery and context-protection rules.
- Confirmed repository path: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`.
- Confirmed git status was clean before adding project-memory files.
- Confirmed package name from `package.json`: `vite_react_shadcn_ts`.

## 2026-05-20

- Added an explicit Engineer Agent Action Contract to `AGENTS.md`.
- Converted the repeated user instruction "increase code volume per batch/PR" into a standing workflow rule for future production batches.
- Updated `NEXT_ACTIONS.md` so Batch #95 must be a large connected production batch with implementation, integration, tests, smoke/e2e or runtime validation, docs, guards, CI wiring, and a Batch Size Report.
- Implemented Batch #96 locally on `codex/batch96-supplier-access-review-console`.
- Added supplier access review contracts, admin API endpoints, service/repository support, PostgreSQL queue indexes, frontend admin review page, API adapter, hook, smoke script, e2e spec, docs, guard scripts and CI wiring.
- Fixed Batch #96 review queue ordering to be deterministic across memory and PostgreSQL repositories: pending requests sort before sent requests, then by updated time and id.
- Fixed Batch #96 admin review page localization to use `useLanguage().lang` with fallback copy.
- Confirmed Batch #96 checks:
  - `npm run test:admin-access-review-frontend` passed, 10 tests.
  - `npm run test:api` passed, 122 tests.
  - `npm run smoke:self-hosted-admin-access-review` passed.
  - `npm run check:self-hosted-db` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run api:build` passed.
  - `npm run lint` passed.
  - `npx tsc -b --noEmit` passed.
  - `npm run smoke:e2e:admin-access-review` passed, 2 browser tests.
  - `npm run ci:core` passed.

## 2026-05-21

- Implemented Batch #97 locally on `codex/batch97-admin-access-grants-console`.
- Added admin access grant contracts, admin grant list/revoke API endpoints, service/repository support, PostgreSQL grant-console indexes, frontend admin grants page, API adapter, hook, smoke script, e2e spec, docs, guard scripts and CI wiring.
- Confirmed Batch #97 revoke behavior: admin revocation expires both `supplier_identity` and `offer_price` grants, downgrades buyer offer access back to `registered_locked`, and masks supplier identity and exact price again.
- Confirmed Batch #97 checks:
  - `npm run test:admin-access-grants-frontend` passed, 10 tests.
  - `npm run test:api` passed, 123 tests.
  - `npm run test:db-contract` passed, 23 tests.
  - `npm run test:db-migrations` passed, 16 tests.
  - `npm run smoke:self-hosted-admin-access-grants` passed.
  - `npm run smoke:e2e:admin-access-grants` passed, 2 browser tests.
  - `npm run check:self-hosted-db` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run ci:core` passed.
- Started Batch #98 locally on `codex/batch98-engineering-lessons-guards`.
- Converted Batch #96/#97 process mistakes into explicit engineering lessons and release gates.
- Added `docs/project-memory/ENGINEERING_LESSONS.md` with symptoms, root causes, fixes and guards for deterministic queues, localization source, memory-repository assertions, API-backed e2e isolation and shared `dist/` races.
- Added `scripts/lib/e2e-script-policy.mjs`, `scripts/check-engineering-lessons.mjs` and `src/test/engineering-lessons-guard.test.ts`.
- Wired `check:engineering-lessons` and `test:engineering-lessons` into `ci:core`.
- Added Batch #98 production-scale notes for the API-backed e2e release policy.
- Confirmed Batch #98 checks:
  - `npm run check:engineering-lessons` passed.
  - `npm run test:engineering-lessons` passed, 4 tests.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run ci:core` passed.
- Started Batch #99 locally on `codex/batch99-admin-operator-hub`.
- Added a self-hosted admin operations overview endpoint, frontend admin hub, shared admin operator navigation, API adapter, hook, tests, smoke, e2e, docs and guard coverage.
- Confirmed Batch #99 targeted checks:
  - `npm run test:admin-operations-frontend` passed, 10 tests.
  - `npm run api:build` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:self-hosted-admin-operations` passed.
  - `npm run lint` passed.
  - `npx tsc -b --noEmit` passed.
  - `npm run smoke:e2e:admin-operations` passed, 2 tests.
  - `npm run ci:core` passed.
- Started Batch #100 locally on `codex/batch100-admin-operations-command-center`.
- Expanded the admin operations hub into a command center with audit summary, readiness checklist, operator actions and recent audit feed.
- Added `/admin/audit` page, admin audit API adapter, hook, page tests and API-backed browser e2e.
- Updated self-hosted admin operations smoke, production-scale docs, self-hosted architecture docs, validation docs and guard scripts for Batch #100.
- Confirmed Batch #100 targeted checks so far:
  - `npm run test:admin-operations-frontend` passed, 10 tests.
  - `npm run test:admin-audit-frontend` passed, 10 tests.
  - `npm run api:build` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:self-hosted-admin-operations:run` passed after `api:build`.
  - `npm run lint` passed.
  - `npx tsc -b --noEmit` passed.
  - `npm run smoke:e2e:admin-operations` passed, 2 tests.
  - `npm run smoke:e2e:admin-audit-events` passed, 2 tests.
  - `npm run ci:core` passed.
- Started Batch #101 locally on `codex/batch101-admin-incident-response`.
- Added self-hosted admin incident response backend contracts, service, repository, routes and durable PostgreSQL acknowledgement migration.
- Added `/admin/incidents` frontend page, API adapter, hook, admin nav integration, command-center incident summary, tests, smoke script, e2e spec, docs and guard-script updates.
- Confirmed Batch #101 partial checks:
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - `npm run test:admin-incidents-frontend` passed, 10 tests.
  - `npm run test:admin-operations-frontend` passed, 10 tests.
  - targeted admin incident API tests and `apps/api/src/server.test.ts` passed, 64 tests.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npm run smoke:self-hosted-admin-operations:run` passed.
- Started Batch #102 locally on `codex/batch102-incident-workflow`.
- Extended self-hosted admin incidents into an operator workflow with assignment, escalation, comments, SLA status, due state and timeline events.
- Expanded Batch #102 after size review with bounded bulk workflow, sanitized JSON/CSV export, typed runbook steps and operator workload summary counters.
- Added `0020_admin_incident_workflow.sql` for durable assignment/escalation state and indexed incident timeline events.
- Updated admin incident contracts, repository, PostgreSQL adapter, service, routes, frontend API adapter, hook, `/admin/incidents` page, smoke script, browser e2e and DB migration tests.
- Fixed process/code issues found during Batch #102:
  - Playwright option selector was ambiguous between `Assigned only` and `Unassigned only`; fixed with `exact: true`.
  - Guard expected literal bulk workflow browser coverage; added explicit e2e assertion for `admin-incidents-bulk-workflow`.
  - Spanish incident copy briefly lost required `exportReady`; restored a single typed translation key and recorded the lesson.
- Updated production-scale docs, self-hosted incident smoke docs, backend architecture docs, validation docs and project memory for Batch #102.
- Confirmed Batch #102 validation:
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - `npx tsc -b --noEmit` passed.
  - targeted admin incident API tests and `apps/api/src/server.test.ts` passed, 69 tests.
  - `npm run test:admin-incidents-frontend` passed, 10 tests.
  - `npm run test:admin-operations-frontend` passed, 10 tests.
  - `npm run test:db-contract` passed, 25 tests.
  - `npm run test:db-migrations` passed, 16 tests.
  - `npm run check:self-hosted-db` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run check:engineering-lessons` passed.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npm run smoke:e2e:admin-incidents` passed, 2 browser tests.
  - `npm run smoke:e2e:admin-operations` passed, 2 browser tests.
  - `npm run ci:core` passed.
  - `git diff --check` passed.

## 2026-05-22

- Started Batch #103 locally on `codex/batch103-incident-detail-handoff`.
- Added a dedicated self-hosted admin incident detail page at `/admin/incidents/:incidentId`.
- Added bounded admin handoff export via `GET /v1/admin/incidents/:incidentId/handoff?format=json|markdown`.
- Added bounded remediation plan via `GET /v1/admin/incidents/:incidentId/remediation`.
- Added bounded postmortem export via `GET /v1/admin/incidents/:incidentId/postmortem?format=json|markdown`.
- Added admin incident workflow note hygiene guard for raw emails, UUIDs and token-like secret assignments.
- Added frontend detail hook, detail page, list-to-detail navigation, handoff export controls, remediation controls, postmortem controls, detail tests and browser e2e.
- Extended self-hosted admin incidents smoke with `admin_incidents_handoff_json=ok`, `admin_incidents_handoff_markdown=ok`, `admin_incidents_remediation_plan=ok`, `admin_incidents_postmortem_json=ok`, `admin_incidents_postmortem_markdown=ok` and `admin_incidents_note_hygiene_guard=ok`.
- Updated production-scale docs, self-hosted incident smoke docs, backend architecture docs, validation docs, guard scripts and CI e2e wiring for Batch #103.
- Fixed process/code issues found during Batch #103:
  - Detail page initially did not surface the assigned operator hash after workflow assignment; added the assigned hash to the snapshot panel and preserved the test.
  - A direct `vitest` shell command failed because the project does not expose a bare `vitest` binary in PATH; reran the focused API tests through `npx vitest`.
  - Vitest array partial matching was too strict for nested handoff/remediation arrays; changed assertions to extract labels/titles before matching.
  - Runtime smoke asserted capitalized `Control-plane` while the product copy is lowercase `control-plane`; changed the smoke assertion to the exact emitted copy.
  - Initial Batch #103 size was still smaller than Batch #102; expanded scope with postmortem export instead of committing a smaller batch.
- Confirmed Batch #103 validation:
  - `npm run lint` passed.
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - `npx tsc -b --noEmit` passed.
  - focused admin incident API tests passed, 70 tests.
  - `npm run test:admin-incidents-frontend` passed, 15 tests.
  - `npm run test:admin-operations-frontend` passed, 10 tests.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npm run smoke:e2e:admin-incident-detail` passed, 1 browser test.
  - `npm run smoke:e2e:admin-incidents` passed, 2 browser tests.

- Continued Batch #106 locally on `codex/batch106-incident-workload-correlation`.
- Added admin incident workload and correlation center:
  - bounded workload aggregation and hot incident scoring;
  - bounded workload JSON/CSV export;
  - bounded workload capacity forecast by owner role and near-term risk;
  - incident correlation across audit events, timeline events and execution items;
  - `/admin/incident-workload` frontend page with filters, owner load, hot incidents, forecast and correlation drill-down;
  - `0022_admin_incident_workload_correlation.sql` indexes;
  - runtime smoke markers, browser e2e, docs and production-scale guard updates.
- Fixed Batch #106 issues found during validation:
  - e2e fixture fields were aligned with the exported Zod contracts instead of UI-inferred shapes;
  - `replaceAll` was replaced with `split/join` for the current TypeScript target;
  - runtime smoke now asserts the top-level `executionItems` correlation array instead of non-existent `summary.executionItems`.
- Confirmed Batch #106 validation so far:
  - `npm run ci:core` passed.
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - `npm run test:api` passed, 135 tests.
  - `npm run test:admin-incidents-frontend` passed, 23 tests.
  - `npm run check:self-hosted-db` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run test:db-migrations` passed, 16 tests.
  - `npm run test:db-contract` passed, 27 tests.
  - `npm run test:backend-contract` passed, 110 tests.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npm run check:engineering-lessons` passed.
  - `npm run test:engineering-lessons` passed, 4 tests.
  - `npx tsc -b --noEmit` passed.
  - `npm run lint` passed.
  - `npm run smoke:e2e:admin-incident-workload` passed, 1 browser test.
  - `npm run ci:core` passed.

## Batch #107 Admin Incident Trend Analytics

- Started Batch #107 locally on `codex/batch107-incident-trend-analytics`.
- Measured Batch #106 baseline from git:
  - `39 files changed`;
  - `3872 insertions(+)`;
  - `48 deletions(-)`.
- Promoted the user's `+20%` batch-size requirement into a numeric gate:
  - minimum 47 changed files;
  - minimum 4647 insertions.
- Initial untracked-aware Batch #107 measurement was below target:
  - 23 files;
  - 3146 insertions;
  - 11 deletions.
- Expanded Batch #107 into a larger connected production batch:
  - admin incident trend API routes;
  - trend contracts;
  - service aggregation, anomaly and briefing logic;
  - frontend API client, hook and page;
  - admin navigation;
  - browser e2e;
  - runtime smoke markers;
  - PostgreSQL trend indexes;
  - DB manifest and DB guards;
  - production-scale guards;
  - backend/API docs;
  - testing docs;
  - project-memory decision, run and Lovable prompt files.
- Fixed Batch #107 issues found during validation:
  - service test and runtime smoke now omit UI sentinel filter values (`all`) before hitting backend trend contracts;
  - trend contract test now asserts Zod strips unknown aliases instead of expecting a throw;
  - DB contract aggregate now includes migration `0023_admin_incident_trend_analytics`;
  - trend UI dimension panel now renders `breached` instead of non-existent `overdue`.
- Confirmed Batch #107 validation:
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - `npm run test:admin-incidents-frontend` passed, 28 tests.
  - `npm run test:api` passed, 136 tests.
  - `npm run test:backend-contract` passed, 120 tests.
  - `npm run check:self-hosted-db` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run test:db-migrations` passed, 16 tests.
  - `npm run test:db-contract` passed, 27 tests.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npx tsc -b --noEmit` passed.
  - `npm run lint` passed.
  - `npm run smoke:e2e:admin-incident-trends` passed, 2 browser tests.
  - `npm run ci:core` passed.
  - `git diff --check` passed.
- Final Batch #107 size gate:
  - 53 changed files;
  - 4823 insertions;
  - 56 deletions;
  - +35.9% changed files vs Batch #106;
  - +24.6% insertions vs Batch #106.

- Started Batch #104 locally on `codex/batch104-incident-remediation-execution`.
- Added a durable admin incident execution tracker:
  - `packages/db/migrations/0021_admin_incident_execution.sql` creates `yorso_admin_incident_execution_items`;
  - execution items are keyed by `(incident_id, item_id)` and indexed for incident/status, assignee/status and source/status reads;
  - execution states are `open`, `in_progress`, `done`, `blocked` and `skipped`.
- Added self-hosted admin execution APIs:
  - `GET /v1/admin/incidents/:incidentId/execution`;
  - `GET /v1/admin/incidents/:incidentId/execution/export?format=json|csv`;
  - `POST /v1/admin/incidents/:incidentId/execution/:itemId`;
  - both routes stay behind admin session and role guards.
- Added execution item contracts, memory repository support, PostgreSQL repository support, service orchestration and audit actions.
- Added frontend execution support:
  - `src/lib/admin-incidents-api.ts` execution client methods;
  - `src/lib/use-admin-incident-detail.ts` execution loading and updates;
  - `src/pages/admin/AdminIncidentDetail.tsx` execution tracker with plan/status, JSON/CSV export, note/evidence/blocked reason controls and item actions.
- Extended Batch #104 tests and guards:
  - admin incident frontend tests;
  - focused admin incident API tests;
  - DB contract and migration tests;
  - self-hosted incident smoke markers;
  - admin incident detail e2e;
  - `check:self-hosted-db`, `check:self-hosted-api`, `check:production-scale-baseline`.
- Fixed process/code issues found during Batch #104:
  - API update validator initially erased the `updatedItem` narrowing; changed it to validate the base response and then assert the update-specific field.
  - DB guard marker initially did not match the exact `updated_by_user_id` DDL; aligned the guard with the migration text.
  - Adding migration `0021` required updates to all migration contract tests, not just guard scripts; updated `self-hosted-db-contract`, `packages/db/src/migrator.test.ts` and `packages/db/src/cli.test.ts`.
  - Execution export route expansion exposed a mock-ordering bug: `/execution/export?format=json` was initially caught by the generic `/incidents/export?format=json` mock. Tightened the mock to the exact route namespace.
- Confirmed Batch #104 validation:
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - focused admin incident API tests passed, 71 tests.
  - `npm run test:admin-incidents-frontend` passed, 15 tests.
  - `npm run check:self-hosted-db` passed.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npm run smoke:e2e:admin-incident-detail` passed, 1 browser test.
  - `npm run lint` passed.
  - `npx tsc -b --noEmit` passed.
  - `npm run ci:core` passed.

- Started Batch #105 locally on `codex/batch105-incident-execution-queue`.
- Added a cross-incident admin incident execution queue:
  - `GET /v1/admin/incidents/execution-queue`;
  - `GET /v1/admin/incidents/execution-queue/export?format=json|csv`;
  - `POST /v1/admin/incidents/execution-queue/bulk`;
  - frontend route `/admin/incident-execution`.
- Added bounded queue filters for execution status, priority, source, owner role,
  assignment, incident status, incident severity, incident SLA and overdue state.
- Added bulk update support capped at 50 `(incidentId, itemId)` refs with partial
  failure reporting and existing note/evidence hygiene rules.
- Added frontend API methods, queue hook, queue page, admin nav link, page tests,
  hook tests and API-backed browser e2e.
- Extended self-hosted admin incident smoke with queue read/filter/export/bulk
  markers and queue note hygiene guard.
- Updated production-scale docs, self-hosted incident smoke docs, backend
  architecture docs, validation docs, guard scripts and CI e2e wiring for Batch
  #105.
- Fixed process/code issues found during Batch #105:
  - Zod `.extend()` was attempted on a refined schema; factored the execution
    update base schema and reused the same refinement for single-item and bulk
    updates.
  - Page copy used `language` from `useLanguage`, but the context exposes
    `lang`; corrected the page and kept the test.
  - Queue tests initially matched export URLs and incident title text too
    narrowly; changed them to robust route/query and regex assertions.
  - Service test initially combined an open queue item's `itemId` with a stale
    `incidentId`; corrected it to use the pair from the selected queue item.
- Confirmed Batch #105 validation:
  - `npm run contracts:build` passed.
  - `npm run api:build` passed.
  - `npx tsc -b --noEmit` passed.
  - `npm run test:api` passed, 135 tests.
  - `npm run test:admin-incidents-frontend` passed, 19 tests.
  - `npm run check:self-hosted-api` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:self-hosted-admin-incidents:run` passed.
  - `npm run smoke:e2e:admin-incident-execution-queue` passed, 1 browser test.
  - `npm run lint` passed.
  - `npm run ci:core` passed.

## 2026-05-23

- Confirmed current repository state for the UX/UI audit:
  - repository root is `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`;
  - active branch is `main`;
  - current head is `dc6eec1`, `[codex] Batch #109 admin incident trend action queue (#160)`.
- Confirmed Batch #108 and Batch #109 are already merged to `main`:
  - Batch #108 added admin incident trend actions and durable trend action decisions;
  - Batch #109 added the dedicated admin incident trend action queue.
- Audited the implemented public UX/UI surfaces and confirmed the main routes from `src/App.tsx`:
  - `/`;
  - `/offers`;
  - `/offers/:id`;
  - `/suppliers`;
  - `/suppliers/:supplierId`;
  - `/how-it-works`;
  - `/for-suppliers`;
  - `/account/*`;
  - `/admin/*`.
- Fixed public metadata and repository context hygiene:
  - replaced Lovable default title, description and social metadata in `index.html`;
  - replaced the default Lovable README TODO with a YORSO Commerce Hub README.
- Fixed the first mobile scanability defects:
  - added overflow containment to the landing page and how-it-works page;
  - constrained how-it-works comparison matrices on narrow screens;
  - increased mobile header and supplier quick filter touch targets.
- Confirmed validation after the UX/UI patch:
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known warnings for Supabase type drift, stale Browserslist data and a large main chunk;
  - Playwright mobile overflow checks at 390px passed for `/`, `/how-it-works` and `/suppliers`.
- Updated project-memory after finding stale Batch #107 state in:
  - `docs/project-memory/CONTEXT_HEALTH.md`;
  - `docs/project-memory/PROJECT_STATE.yaml`;
  - `docs/project-memory/HANDOFF.md`;
  - `docs/project-memory/NEXT_ACTIONS.md`;
  - `docs/project-memory/ARTIFACTS.md`;
  - `docs/project-memory/RISKS.md`.
- Added `docs/project-memory/PROMPTS/prompt-109-lovable-sync.md` for Lovable sync confirmation after Batch #109.
- User confirmed Lovable sync for Batch #109 is clean with no conflicts:
  - HEAD is `dc6eec10`, `[codex] Batch #109 admin incident trend action queue (#160)`;
  - `/admin/incident-trend-actions` maps to `AdminIncidentTrendActions`;
  - migration `0025_admin_incident_trend_action_queue.sql` exists and is in the manifest;
  - routes `/v1/admin/incidents/trend-action-queue`, `/export` and `/bulk` are connected;
  - `e2e/admin-incident-trend-actions.spec.ts` and `smoke:e2e:admin-incident-trend-actions` are present.
- Continued the public UX/UI patch after Batch #109 sync confirmation:
  - hardened public mobile touch targets across header, footer, breadcrumbs, supplier rows, supplier filters, offer filters, certification chips, mobile offer card controls and public CTA blocks;
  - removed invalid nested `Link > Button` structures in public CTA blocks by switching to `Button asChild`;
  - kept desktop density with responsive `sm:` overrides where compact controls are still appropriate.
- Confirmed final validation after public UX/UI touch-target hardening:
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npx vitest run src/components/catalog/MobileOfferCard.touchTargets.test.tsx` passed, 8 tests;
  - `npm run build` passed with known warnings for Supabase type drift, stale Browserslist data and a large main chunk;
  - Playwright mobile audit at 390px passed with zero horizontal overflow and zero interactive targets below 44px for `/`, `/how-it-works`, `/suppliers`, `/offers` and `/for-suppliers`.
- Created branch `codex/batch110-public-ux-mobile-scan` for the validated public UX/UI patch.
- Committed Batch #110 as `[codex] Batch #110 public UX mobile scan`.
- Pushed branch `codex/batch110-public-ux-mobile-scan` to `origin`.
- Opened Draft PR #161: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/161`.
- Investigated PR #161 CI failure:
  - failing check: `Core Type And Build Gate`;
  - root cause: `check:engineering-lessons` required the risk markers `API-backed browser specs can fail in generic smoke` and `Parallel Vite builds can race on shared dist`;
  - fix: restored those process-risk entries in `docs/project-memory/RISKS.md`.
- Investigated the next PR #161 CI failure after the engineering-lessons fix:
  - failing check: `Core Type And Build Gate`;
  - root cause: DB migration CLI/planner tests still expected 25 migrations and stopped at `0024_admin_incident_trend_actions`, while Batch #109 added `0025_admin_incident_trend_action_queue`;
  - fix: updated `packages/db/src/cli.test.ts` and `packages/db/src/migrator.test.ts` to include the `0025` migration and 26 pending migrations.
- Confirmed validation after the PR #161 migration-test fixture fix:
  - `npm run test:db-migrations` passed, 16 tests;
  - `npm run ci:core` passed with the known non-blocking warnings for Supabase type drift, stale Browserslist data and large production chunk.
- Pushed PR #161 follow-up commit `19252cc`, `[codex] Fix migration tests for trend action queue`.
- Confirmed GitHub PR #161 `Core Type And Build Gate` passed after the migration-test fixture fix:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access browser suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #161 ready and merged it to `main` as `2e8fb7b`, `[codex] Batch #110 public UX mobile scan`.
- Added `docs/project-memory/PROMPTS/prompt-110-lovable-sync.md` for Batch #110 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #110 is clean with no conflicts:
  - GitHub commit synced to `ff989407`, including Batch #110 commit `2e8fb7b`;
  - `index.html`, `README.md`, public routes `/`, `/how-it-works`, `/suppliers`, `/offers` and `/for-suppliers`, and the migration manifest were checked;
  - no conflicts were found and the worktree was clean;
  - known warnings remain: Supabase generated types drift, stale Browserslist data and large main JS chunk.
- Started Batch #111 on branch `codex/batch111-public-route-seo`.
- Implemented Batch #111 public route SEO:
  - extended `src/lib/seo.ts` for route-owned social metadata and global SEO restoration;
  - added `src/lib/public-route-seo.ts` for shared public route OG image, locale and title helpers;
  - added route-owned SEO marker/canonical/OG/Twitter/JSON-LD coverage to `/`, `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`;
  - refreshed global meta descriptions in EN/RU/ES with buyer-first procurement language;
  - kept supplier directory SEO from exposing exact supplier company names in locked states;
  - fixed homepage H1 text boundary so screen-reader/textContent output reads `Prices. Full` instead of a glued sentence.
- Confirmed Batch #111 validation:
  - `npx vitest run src/pages/PublicRouteSeo.test.tsx src/i18n/locale-document-meta-ru.test.tsx src/pages/Blog.seoHardening.test.tsx src/pages/ForSuppliers.test.tsx src/pages/Suppliers.test.tsx src/pages/Offers.catalogPaging.test.tsx` passed, 53 tests;
  - `npx vitest run src/pages/PublicRouteSeo.test.tsx` passed, 9 tests after the H1 and canonical-cleanup follow-up;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run build` passed with known warnings for Supabase type drift, stale Browserslist data and large main chunk;
  - Playwright head/mobile check at 390px confirmed marker, canonical, OG/Twitter, JSON-LD and no horizontal overflow on `/`, `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.
- Committed Batch #111 as `0d9319d`, `[codex] Batch #111 public route SEO`.
- Pushed branch `codex/batch111-public-route-seo` to `origin`.
- Opened Draft PR #162: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/162`.
- Pushed project-memory follow-up commit `8b04f71`, `[codex] Update Batch 111 project memory`.
- Confirmed GitHub PR #162 `Core Type And Build Gate` passed:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #162 ready and merged it to `main` as `17fc484`, `[codex] Batch #111 public route SEO`.
- Added `docs/project-memory/PROMPTS/prompt-111-lovable-sync.md` for Batch #111 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #111 is clean with no conflicts:
  - HEAD is `01734e1d`, including Batch #111 commit `17fc4841`;
  - `src/lib/seo.ts`, `src/lib/public-route-seo.ts`, public route SEO markers, JSON-LD ids and route SEO tests are present;
  - public mobile UX routes render;
  - supplier company names do not leak in supplier-directory SEO;
  - known warnings remained before Batch #112: Supabase generated types drift, stale Browserslist data and large main production JS chunk.
- Started Batch #112 locally on `codex/batch112-route-code-splitting`.
- Implemented Batch #112 route code splitting:
  - converted `src/App.tsx` route page imports to `React.lazy`;
  - wrapped routes in `Suspense` with a lightweight skeleton fallback;
  - kept global providers, legacy redirects and supplier approval notifier eager;
  - split `src/i18n/translations.ts` into a named `i18n-translations` production chunk;
  - added `src/test/app-route-code-splitting.test.ts` to guard lazy route imports and the translation chunk rule.
- Rejected manual third-party vendor chunking during Batch #112:
  - the first vendor split caused `Cannot read properties of undefined (reading 'createContext')` in production preview;
  - the narrowed vendor split then caused `Cannot access 'S' before initialization` in the chart chunk;
  - final implementation avoids manual vendor chunks and keeps only route lazy loading plus the local translation chunk.
- Confirmed Batch #112 validation:
  - `npx vitest run src/test/app-route-code-splitting.test.ts` passed, 2 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run build` passed with only known Supabase type drift and Browserslist warnings;
  - the previous Vite large-chunk warning is gone;
  - production build entry chunk is `352.18 kB` minified and `112.99 kB` gzip;
  - `i18n-translations` chunk is `311.45 kB` minified and `98.15 kB` gzip;
  - `E2E_BASE_URL=http://127.0.0.1:4182 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium` passed, 9 tests.
- Committed Batch #112 as `4e89ff3`, `[codex] Batch #112 route code splitting`.
- Pushed branch `codex/batch112-route-code-splitting` to `origin`.
- Opened Draft PR #163: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/163`.
- Confirmed GitHub PR #163 `Core Type And Build Gate` passed:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #163 ready and merged it to `main` as `2430fef`, `[codex] Batch #112 route code splitting`.
- Added `docs/project-memory/PROMPTS/prompt-112-lovable-sync.md` for Batch #112 Lovable sync confirmation.

## 2026-05-24

- User confirmed Lovable sync for Batch #112 is clean with no conflicts:
  - HEAD is `45891e11`, including Batch #112 commit `2430fef4`;
  - `src/App.tsx` uses `React.lazy` for route pages and `<Suspense fallback={<RouteFallback />}>`;
  - global providers, `LegacyOfferRedirect`, `legacyRedirects` and `SupplierApprovalNotifier` remain eager;
  - `vite.config.ts` only splits `src/i18n/translations.ts` into `i18n-translations`;
  - no manual `vendor-react`, `vendor-charts` or `vendor-supabase` chunk rules were present;
  - `src/test/app-route-code-splitting.test.ts` is present;
  - public routes render, buyer-first narrative is preserved, and Batch #111 SEO plus Batch #110 mobile fixes remain in place.
- Started Batch #113 locally on `codex/batch113-route-chunk-error-boundary`.
- Implemented Batch #113 route chunk error boundary:
  - added `src/components/routing/RouteChunkErrorBoundary.tsx`;
  - wrapped lazy routes in `RouteChunkErrorBoundary` in `src/App.tsx`;
  - added a clear reload/go-back state for lazy route render or chunk-load failures;
  - added `src/components/routing/RouteChunkErrorBoundary.test.tsx`;
  - extended `src/test/app-route-code-splitting.test.ts` to guard route boundary wiring.
- Confirmed Batch #113 focused validation so far:
  - `npx vitest run src/components/routing/RouteChunkErrorBoundary.test.tsx src/test/app-route-code-splitting.test.ts` passed, 4 tests;
  - `npx tsc -b --noEmit` passed.
- Confirmed Batch #113 full local validation:
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only;
  - the Vite large-chunk warning stayed resolved;
  - production build entry chunk is `355.46 kB` minified and `114.16 kB` gzip;
  - `E2E_BASE_URL=http://127.0.0.1:4183 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium` passed, 9 tests.
  - In-app Browser MCP returned `Transport closed`, so local runtime verification used the production preview server plus Playwright.
- Committed Batch #113 as `fee82bf`, `[codex] Batch #113 route chunk error boundary`.
- Pushed branch `codex/batch113-route-chunk-error-boundary` to `origin`.
- Opened Draft PR #164: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/164`.
- Confirmed GitHub PR #164 `Core Type And Build Gate` passed:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #164 ready and merged it to `main` as `9860aa3`, `[codex] Batch #113 route chunk error boundary`.
- Added `docs/project-memory/PROMPTS/prompt-113-lovable-sync.md` for Batch #113 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #113 is clean with no conflicts:
  - HEAD is `9d3c90d2`, including Batch #113 commit `9860aa3` or newer;
  - `RouteChunkErrorBoundary` implementation, tests, route-shell wiring and Batch #113 production-scale notes are present;
  - eager providers, `LegacyOfferRedirect`, `legacyRedirects` and `SupplierApprovalNotifier` are preserved;
  - public route runtime, buyer-first narrative, Batch #110 mobile overflow fixes and Batch #111 SEO are intact;
  - Batch #112 code-splitting strategy is unchanged and the previous large-chunk warning remains resolved;
  - known warnings remain: Supabase generated types drift in non-strict mode and stale Browserslist data.
- Set the next planned UX batch to Batch #114 font-loading cleanup.
- Started Batch #114 locally on `codex/batch114-font-loading-cleanup`.
- Implemented Batch #114 font-loading cleanup:
  - removed the Google Fonts CSS `@import` from `src/index.css`;
  - added document-head preconnect links for `fonts.googleapis.com` and `fonts.gstatic.com`;
  - moved the existing Inter and Plus Jakarta Sans stylesheet request into `index.html`;
  - added `src/test/font-loading.test.ts` to guard the loading path and typography contract;
  - added the Batch #114 10,000 concurrent-user capacity review to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #114 full local validation:
  - `npx vitest run src/test/font-loading.test.ts` passed, 3 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only;
  - the Vite large-chunk warning stayed resolved;
  - production build entry chunk is `355.46 kB` minified and `114.16 kB` gzip;
  - production CSS bundle is `125.44 kB` minified and `20.79 kB` gzip;
  - `E2E_BASE_URL=http://127.0.0.1:4184 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium` passed, 9 tests.
- Committed Batch #114 as `18f165a`, `[codex] Batch #114 font loading cleanup`.
- Pushed branch `codex/batch114-font-loading-cleanup` to `origin`.
- Opened Draft PR #165: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/165`.
- Confirmed GitHub PR #165 `Core Type And Build Gate` passed:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #165 ready and merged it to `main` as `df5b66f`, `[codex] Batch #114 font loading cleanup`.
- Added `docs/project-memory/PROMPTS/prompt-114-lovable-sync.md` for Batch #114 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #114 is clean with no conflicts:
  - HEAD is `3be3d6d2`, `[codex] Add Batch 114 Lovable sync prompt`, on branch `main` and on top of Batch #114 `df5b66f`;
  - `src/index.css` has no Google Fonts `@import`, body uses Inter and headings use Plus Jakarta Sans;
  - `index.html` has Google Fonts preconnects and a single stylesheet for Plus Jakarta Sans weights `400,500,600,700,800` plus Inter weights `400,500,600` with `display=swap`;
  - `src/test/font-loading.test.ts` and Batch #114 production-scale notes are present;
  - routes `/`, `/offers`, `/suppliers`, `/suppliers/:supplierId`, `/blog`, `/for-suppliers` and `/account/:section` remain declared in `src/App.tsx` with lazy loading, `RouteChunkErrorBoundary` and `Suspense`;
  - buyer-first narrative, Batch #110 mobile overflow fixes, Batch #111 SEO, Batch #112 i18n-only manual chunking and Batch #113 route chunk boundary are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #115 locally on `codex/batch115-catalog-locale-hardening`.
- Ran the route-level proof/trust review with local Vite plus Playwright at 1440px and 390px for `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers`.
- Found a concrete `/offers` English-locale UX defect:
  - locked offer cards displayed legacy Russian `Цена по запросу`;
  - desktop analytics trigger and sr-only hints displayed Russian `Аналитика цен и рынка` / `Разворачивает...`;
  - mobile trend analytics aria/title used Russian `Показать аналитику цен`.
- Implemented Batch #115 catalog locale hardening:
  - added `src/lib/catalog-display-labels.ts` to map legacy redacted price labels into the active locale label;
  - localized desktop and mobile catalog analytics trigger copy through `src/i18n/translations.ts`;
  - kept existing analytics selectors, aria-controls, aria-expanded, aria-describedby and panel region contracts;
  - added textContent spacing before the price unit so locked labels read as `Exact price locked per kg`;
  - added focused locale and display-label regression tests;
  - added the Batch #115 10,000 concurrent-user capacity review.
- Confirmed Batch #115 local validation:
  - `npx vitest run src/lib/catalog-display-labels.test.ts src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/catalog/CatalogOfferRow.analyticsA11y.test.tsx src/components/catalog/MobileOfferCard.analyticsToggle.test.tsx` passed, 16 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only;
  - production preview Playwright check for `/offers` desktop and mobile passed: no horizontal overflow, no visible Russian locked-price label, no visible Russian analytics trigger/hint, and locked price textContent includes a space before `per kg`.
- Committed Batch #115 as `67ff3f4`, `[codex] Batch #115 catalog locale hardening`.
- Pushed branch `codex/batch115-catalog-locale-hardening` to `origin`.
- Opened Draft PR #166: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/166`.
- Confirmed GitHub PR #166 `Core Type And Build Gate` passed in 10m52s:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #166 ready and merged it to `main` as `eec49ec`, `[codex] Batch #115 catalog locale hardening`.
- Added `docs/project-memory/PROMPTS/prompt-115-lovable-sync.md` for Batch #115 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #115 is clean:
  - HEAD is `040e17b9`, `[codex] Add Batch 115 Lovable sync prompt`, on `main` and on top of Batch #115 `eec49ec`;
  - catalog locale hardening files, focused regression tests, EN/RU/ES analytics labels and Batch #115 production-scale notes are present;
  - public routes remain declared in `src/App.tsx` with lazy loading, `RouteChunkErrorBoundary` and `Suspense`;
  - no conflicts were found and Lovable did not modify files;
  - buyer-first narrative, supplier trust mechanism, access gating, supplier identity redaction, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting, Batch #113 route chunk boundary and Batch #114 font loading are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Recorded Batch #115 Lovable sync in project-memory and pushed `main` as `a320088`, `[codex] Record Batch 115 Lovable sync`.
- Started Batch #116 on `codex/batch116-offers-proof-anchor-fallback`.
- Ran route-level proof/trust review on `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers` at desktop and mobile widths.
- Found a concrete `/offers` trust-proof navigation defect:
  - on mobile, the `Procurement intelligence` proof button targeted the hidden desktop-only `catalog-anchor-intelligence` panel and did not move the buyer to visible evidence;
  - the `Document readiness` proof landed on the procurement filter bar instead of offer-card evidence where document status is visible.
- Implemented Batch #116 offers proof anchor fallback:
  - `TrustProofStrip` now resolves a visible primary anchor first and can fall back to a visible anchor when the primary target is hidden;
  - `Procurement intelligence` falls back to `catalog-anchor-results` on mobile;
  - `Document readiness` points directly to offer results;
  - existing `catalog_trust_proof_click` telemetry still fires with the resolved anchor id.
- Added `src/components/catalog/TrustProofStrip.test.tsx` and `e2e/offers-trust-proof-anchors.spec.ts`.
- Extended `smoke:e2e:offers-catalog:run` to include the trust-proof anchor e2e spec.
- Added Batch #116 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #116 local validation:
  - `npx vitest run src/components/catalog/TrustProofStrip.test.tsx` passed, 3 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4187 npx playwright test e2e/offers-trust-proof-anchors.spec.ts --project=chromium` passed, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4187 npx playwright test e2e/offers-catalog-paging.spec.ts e2e/offers-trust-proof-anchors.spec.ts --project=chromium` passed, 6 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only.
- Committed Batch #116 as `6eb713c`, `[codex] Batch #116 offers proof anchor fallback`.
- Pushed branch `codex/batch116-offers-proof-anchor-fallback` to `origin`.
- Opened Draft PR #167: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/167`.
- Confirmed GitHub PR #167 `Core Type And Build Gate` passed:
  - core CI passed;
  - account report smoke and report verification passed;
  - browser smoke, API-backed access suite, frontend no-Supabase smoke, self-hosted auth/access smoke and admin smoke steps passed.
- Marked PR #167 ready and merged it to `main` as `33d92c3`, `[codex] Batch #116 offers proof anchor fallback (#167)`.
- Added `docs/project-memory/PROMPTS/prompt-116-lovable-sync.md` for Batch #116 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #116 is clean:
  - HEAD is `3bca7961`, `[codex] Add Batch 116 Lovable sync prompt`, on `main` and on top of Batch #116 `33d92c3`;
  - `TrustProofStrip` visible-anchor fallback, focused unit tests, mobile e2e guard, offers-catalog smoke wiring and Batch #116 production-scale notes are present;
  - public routes remain declared with lazy loading and `RouteChunkErrorBoundary`;
  - no conflicts were found and Lovable did not modify files;
  - buyer-first narrative, supplier trust mechanism, access gating, supplier identity redaction, Batch #110 mobile fixes, Batch #111 SEO, Batch #112 code-splitting, Batch #113 route chunk boundary, Batch #114 font loading and Batch #115 locale hardening are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Recorded Batch #116 Lovable sync in project-memory and pushed `main` as `1651d68`, `[codex] Record Batch 116 Lovable sync`.
- Started Batch #117 on `codex/batch117-offers-request-anchor`.
- Ran runtime review for the `/how-it-works` buyer request-access CTA and `/offers#request` landing.
- Found a concrete cross-route conversion defect:
  - `/how-it-works` CTAs linked to `/offers#request`;
  - `/offers` did not expose a `#request` anchor;
  - catalog search-param normalization rewrote the URL and stripped the hash.
- Implemented Batch #117 offers request anchor:
  - added a stable `#request` anchor around the existing catalog access/value strip;
  - changed `/how-it-works` request-access CTAs to object `to={{ pathname: "/offers", hash: "#request" }}`;
  - changed `/offers` URL normalization to preserve `location.hash`;
  - added a hash-scroll effect after catalog render.
- Added `e2e/how-it-works-request-anchor.spec.ts` and wired it into `smoke:e2e:run`.
- Added Batch #117 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #117 local validation:
  - `E2E_BASE_URL=http://127.0.0.1:4188 npx playwright test e2e/how-it-works-request-anchor.spec.ts --project=chromium` passed, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4188 npx playwright test e2e/offers-catalog-paging.spec.ts --project=chromium` passed, 4 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only.
- Committed Batch #117 as `d1acb7f`, `[codex] Batch #117 offers request anchor`.
- Pushed branch `codex/batch117-offers-request-anchor` to `origin`.
- Opened Draft PR #168: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/168`.
- Confirmed GitHub PR #168 `Core Type And Build Gate` passed in 10m54s.
- Marked PR #168 ready and merged it to `main` as `c2c5ff3`, `[codex] Batch #117 offers request anchor (#168)`.
- Added `docs/project-memory/PROMPTS/prompt-117-lovable-sync.md` for Batch #117 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #117 is clean:
  - HEAD is on `main` on top of Batch #117 `c2c5ff3`, PR #168;
  - `Offers.tsx` has the stable `#request` anchor around the access/value strip, hash-preserving URL normalization and hash-scroll effect after render;
  - `HowItWorks.tsx` and `FinalCTA.tsx` use structured React Router targets to `/offers#request`;
  - `e2e/how-it-works-request-anchor.spec.ts` and `smoke:e2e:run` wiring are present;
  - no conflicts were found and files were not modified in Lovable;
  - buyer-first narrative, access gating, supplier identity redaction, Batch #110 mobile fix, Batch #111 SEO, Batch #112 code-splitting, Batch #113 RouteChunkErrorBoundary, Batch #114 font loading, Batch #115 locale hardening and Batch #116 proof anchor fallback are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #118 on `codex/batch118-for-suppliers-cta-semantics`.
- Ran runtime review on `/for-suppliers` after Batch #117 and found nested interactive CTA markup:
  - hero and final `Register as supplier` / `See buyer requests` CTAs rendered as both a link and a button in the same visual target;
  - runtime DOM query showed nested `a button` / `button a` controls before the fix.
- Implemented Batch #118 for-suppliers CTA semantics:
  - converted the four supplier CTA wrappers to the existing `Button asChild` pattern;
  - preserved `/register` and `/offers` destinations, analytics events and visual classes;
  - added `src/pages/ForSuppliers.test.tsx` coverage against nested interactive controls;
  - added `e2e/for-suppliers-cta-semantics.spec.ts` and wired it into `smoke:e2e:run`;
  - added Batch #118 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #118 local validation:
  - `npx vitest run src/pages/ForSuppliers.test.tsx` passed, 4 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4190 npx playwright test e2e/for-suppliers-cta-semantics.spec.ts --project=chromium` passed, 1 test;
  - runtime Playwright check confirmed zero nested interactive controls, visible supplier CTAs and zero horizontal overflow at 390px;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only.
- Committed Batch #118 as `f5b947f`, `[codex] Batch #118 for-suppliers CTA semantics`.
- Pushed branch `codex/batch118-for-suppliers-cta-semantics` to `origin`.
- Opened Draft PR #169: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/169`.
- Confirmed GitHub PR #169 `Core Type And Build Gate` passed in 10m36s.
- Marked PR #169 ready and merged it to `main` as `f025e7b`, `[codex] Batch #118 for-suppliers CTA semantics (#169)`.
- Added `docs/project-memory/PROMPTS/prompt-118-lovable-sync.md` for Batch #118 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #118 is clean:
  - HEAD is `dc78e094`, `[codex] Add Batch 118 Lovable sync prompt`, on `main` and on top of Batch #118 `f025e7b`;
  - `ForSuppliers.tsx` hero and final CTAs use `Button asChild` with links to `/register` and `/offers`;
  - analytics `supplier_page_cta_register_click` and `supplier_page_cta_requests_click` remain attached with `surface: hero|final`;
  - `ForSuppliers.test.tsx`, `e2e/for-suppliers-cta-semantics.spec.ts`, `smoke:e2e:run` wiring and Batch #118 production-scale notes are present;
  - no conflicts were found and files were not modified in Lovable;
  - buyer-first narrative, access gating, supplier identity redaction, price lock, Batch #110 mobile fix, Batch #111 SEO, Batch #112 code-splitting, Batch #113 RouteChunkErrorBoundary, Batch #114 font loading, Batch #115 locale hardening, Batch #116 proof anchor fallback and Batch #117 request anchor are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #119 on `codex/batch119-offers-cta-semantics`.
- Ran runtime review on `/offers` after Batch #118 and found nested interactive CTA markup:
  - locked-buyer `Create account` and `Respond` CTAs rendered as both a link and a button in the same visual target;
  - runtime DOM query showed nested `a button` controls before the fix.
- Implemented Batch #119 offers CTA semantics:
  - converted `AccessLevelBanner`, `CatalogValueStrip` and `RelatedRequests` locked-buyer link CTAs to the existing `Button asChild` pattern;
  - preserved `/register` destinations, catalog copy, visual classes, access gating, supplier redaction, price locks, sorting, filtering and pagination;
  - added `src/pages/Offers.catalogPaging.test.tsx` coverage against nested interactive controls;
  - added `e2e/offers-cta-semantics.spec.ts` and wired it into offers-catalog and full e2e smoke scripts;
  - added Batch #119 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #119 local validation:
  - `npx vitest run src/pages/Offers.catalogPaging.test.tsx` passed, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4191 npx playwright test e2e/offers-cta-semantics.spec.ts --project=chromium` passed, 1 test;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only.
- Committed Batch #119 as `dfc4d43`, `[codex] Batch #119 offers CTA semantics`.
- Pushed branch `codex/batch119-offers-cta-semantics` to `origin`.
- Opened Draft PR #170: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/170`.
- Confirmed GitHub PR #170 `Core Type And Build Gate` passed in 11m44s.
- Marked PR #170 ready and merged it to `main` as `e17810e`, `[codex] Batch #119 offers CTA semantics (#170)`.
- Added `docs/project-memory/PROMPTS/prompt-119-lovable-sync.md` for Batch #119 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #119 is clean:
  - HEAD is `851ad960`, `[codex] Record Batch 121 Lovable sync`, on `main` and on top of Batch #119 `e17810e`, Batch #120 `700d4484` and Batch #121 `9b8f9434`;
  - `AccessLevelBanner` anonymous locked CTA uses `Button asChild` with a direct `/register` Link, while `registered_locked` stays a normal simulation button and `qualified_unlocked` stays info-only;
  - `CatalogValueStrip` anonymous locked CTA uses `Button asChild` with a direct `/register` Link and the registered buyer CTA remains a normal dialog button;
  - `RelatedRequests` locked `Respond` CTA uses `Button asChild` with a direct `/register` Link and the unlocked branch remains a normal `MessageSquare` button;
  - `Offers.catalogPaging.test.tsx`, `e2e/offers-cta-semantics.spec.ts`, `smoke:e2e:offers-catalog:run`, `smoke:e2e:run` wiring and Batch #119 production-scale notes are present;
  - `/offers` locked-buyer CTAs are single semantic links, nested `a button` / `button a` controls are zero and 390px mobile has no horizontal overflow;
  - no conflicts were found and files were not modified in Lovable;
  - buyer-first narrative, access gating, supplier identity redaction, price-lock, URL-backed catalog controls, Batch #116 proof-anchor fallback, Batch #117 request anchor, Batch #118 for-suppliers CTA semantics, Batch #120 auth CTA semantics and Batch #121 offer detail CTA semantics are preserved.
- Started Batch #120 on `codex/batch120-auth-cta-semantics`.
- Reviewed `/signin` and `/reset-password` after Batch #119 and confirmed the remaining nested interactive CTA markup:
  - `/signin` home back-link rendered as `Link` around `Button`;
  - `/reset-password` sign-in back-link rendered as `Link` around `Button`.
- Implemented Batch #120 auth CTA semantics:
  - converted the two auth back links to the existing `Button asChild` pattern;
  - preserved auth copy, form behavior, redirect behavior, self-hosted API integration, Supabase prototype recovery behavior, route shell and visual classes;
  - added `src/pages/AuthCtaSemantics.test.tsx`;
  - added `e2e/auth-cta-semantics.spec.ts` and wired it into a dedicated smoke script plus full e2e smoke;
  - added Batch #120 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #120 local validation:
  - `npx vitest run src/pages/AuthCtaSemantics.test.tsx` passed, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4192 npx playwright test e2e/auth-cta-semantics.spec.ts --project=chromium` passed, 2 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only.
- Committed Batch #120 as `853b08c`, `[codex] Batch #120 auth CTA semantics`.
- Pushed branch `codex/batch120-auth-cta-semantics` to `origin`.
- Opened Draft PR #171: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/171`.
- Confirmed GitHub PR #171 `Core Type And Build Gate` passed in 10m50s.
- Marked PR #171 ready and merged it to `main` as `276f790`, `[codex] Batch #120 auth CTA semantics (#171)`.
- Added `docs/project-memory/PROMPTS/prompt-120-lovable-sync.md` for Batch #120 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #120 is clean:
  - HEAD is `700d4484`, `[codex] Add Batch 120 Lovable sync prompt`, on `main` and on top of Batch #120 `276f790`, PR #171;
  - `SignIn.tsx` and `ResetPassword.tsx` use `Button asChild` with direct links for auth back CTAs;
  - `AuthCtaSemantics.test.tsx`, `e2e/auth-cta-semantics.spec.ts`, `smoke:e2e:auth-cta-semantics:run` and full `smoke:e2e:run` wiring are present;
  - no conflicts were found and the working tree was clean;
  - `/signin` and `/reset-password` render, self-hosted auth runtime, Supabase legacy fallback, password-recovery observer, buyer access gating, supplier redaction and price-lock behavior are unchanged;
  - auth back CTAs are single semantic links, forgot-password remains a non-navigation button, nested `a button, button a` is 0 and mobile 390px has no overflow;
  - Batch #112 code-splitting and Batch #113 RouteChunkErrorBoundary are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #121 on `codex/batch121-offer-detail-cta-semantics`.
- Reviewed `/offers/:id` after Batch #120 and confirmed remaining nested interactive CTA markup:
  - anonymous offer detail had three nested CTA controls: `Register Free`, `Sign up to view exact prices`, and `Register to Contact Supplier`;
  - registered-locked offer detail had two nested hash CTA controls for `Open access panel`;
  - unknown offer fallback had one nested `Browse all offers` CTA.
- Implemented Batch #121 offer detail CTA semantics:
  - converted offer detail load-error, not-found, locked access banner and sticky mobile CTAs to the existing `Button asChild` pattern;
  - converted the anonymous price-lock CTA in `OfferSummary` to `Button asChild`;
  - preserved `/register`, `/offers` and `#offer-supplier-access` destinations, offer detail copy, visual classes, return-to-catalog behavior, access-request behavior, access gating, supplier identity redaction and exact-price locks;
  - added `e2e/offer-detail-cta-semantics.spec.ts`;
  - added `smoke:e2e:offer-detail-cta-semantics:run` and wired the spec into full `smoke:e2e:run`;
  - added Batch #121 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #121 local validation:
  - pre-fix Playwright runtime scan found nested controls on anonymous, registered-locked and unknown offer detail states;
  - post-fix Playwright runtime scan confirmed zero nested controls and zero horizontal overflow on all three states at 390px;
  - `E2E_BASE_URL=http://127.0.0.1:4193 npx playwright test e2e/offer-detail-cta-semantics.spec.ts --project=chromium` passed, 3 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4193 npx playwright test e2e/offer-detail-access.spec.ts e2e/offer-detail-cta-semantics.spec.ts --project=chromium` passed, 6 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run build` passed with known Supabase type drift and Browserslist warnings only;
  - `npm run smoke:e2e:offer-detail-cta-semantics:run` passed, 3 tests;
  - `npm run smoke:e2e:run` passed, 114 tests.
- Committed Batch #121 as `84b615b`, `[codex] Batch #121 offer detail CTA semantics`.
- Pushed branch `codex/batch121-offer-detail-cta-semantics` to `origin`.
- Opened Draft PR #172: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/172`.
- The first GitHub PR #172 `Core Type And Build Gate` run failed in unrelated `e2e/account-company-edit-contract.spec.ts`; local isolated account-company smoke and full browser smoke passed.
- Reran the failed GitHub check; `Core Type And Build Gate` passed on rerun in 10m56s.
- Marked PR #172 ready and merged it to `main` as `809d35f`, `[codex] Batch #121 offer detail CTA semantics (#172)`.
- Added `docs/project-memory/PROMPTS/prompt-121-lovable-sync.md` for Batch #121 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #121 is clean:
  - HEAD is `9b8f9434`, `[codex] Add Batch 121 Lovable sync prompt`, on `main` and on top of Batch #121 `809d35f`, PR #172;
  - `OfferDetail.tsx` uses `Button asChild` plus `Link` or hash anchor for load-error fallback, not-found fallback, anonymous `/register` banner, registered-locked `#offer-supplier-access` banner, sticky mobile anonymous CTA and sticky mobile registered-locked CTA;
  - `OfferSummary.tsx` uses `Button asChild` plus `Link to="/register"` for the price-lock CTA;
  - `e2e/offer-detail-cta-semantics.spec.ts`, dedicated smoke script and full `smoke:e2e:run` wiring are present;
  - no conflicts were found and files were not modified in Lovable;
  - `/offers/:id` renders in English on desktop and mobile through lazy routes and `RouteChunkErrorBoundary`;
  - anonymous and registered-locked offer detail states keep supplier identity, exact price and access gating locked as expected;
  - unknown offer fallback exposes `Browse all offers` as a link;
  - nested `a button, button a` is 0, mobile 390px has no overflow, and Batches #117-#120 remain unchanged;
  - Batch #112 code-splitting and Batch #113 RouteChunkErrorBoundary are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #122 on `codex/batch122-runtime-ux-a11y-audit`.
- Ran runtime scan after Batch #121 and confirmed remaining nested interactive CTA markup:
  - homepage `/` had nested controls in desktop `View all offers` and certification chips inside linked landing offer cards;
  - shared info/legal routes `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press` and `/partners` had nested back-link CTA markup from `InfoPageLayout`;
  - mobile horizontal overflow stayed at zero on the checked routes.
- Implemented Batch #122 public CTA semantics:
  - converted homepage desktop `View all offers` to the existing `Button asChild` pattern;
  - added `interactive={false}` support to `CertificationBadges` and used it in landing `OfferCard` so certification proof chips inside clickable cards render as static spans;
  - converted shared `InfoPageLayout` back CTA to `Button asChild`;
  - preserved buyer-first copy, offer-card destinations, public route SEO behavior, route shell, access gating, supplier identity redaction, price locks and visual styling;
  - added `src/pages/PublicCtaSemantics.test.tsx`;
  - added `e2e/public-cta-semantics.spec.ts` and wired it into a dedicated smoke script plus full `smoke:e2e:run`;
  - added Batch #122 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #122 local validation:
  - post-fix Playwright runtime scan confirmed zero nested controls and zero horizontal overflow on `/` and shared info/legal routes at 390px;
  - `npx vitest run src/pages/PublicCtaSemantics.test.tsx` passed, 2 tests;
  - `npm run smoke:e2e:public-cta-semantics` passed, 12 tests;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:run` passed, 126 tests.
- Committed Batch #122 as `9829df0`, `[codex] Batch #122 public CTA semantics`.
- Pushed branch `codex/batch122-runtime-ux-a11y-audit` to `origin`.
- Opened Draft PR #173: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/173`.
- Added `docs/project-memory/PROMPTS/prompt-122-lovable-sync.md` for Batch #122 Lovable sync confirmation after merge.
- Marked PR #173 ready after no draft-only checks appeared.
- Confirmed GitHub PR #173 `Core Type And Build Gate` passed in 11m31s.
- Merged PR #173 to `main` as `dc2a3ca`, `[codex] Batch #122 public CTA semantics (#173)`.
- Updated `docs/project-memory/PROMPTS/prompt-122-lovable-sync.md` to use GitHub `main` at commit `dc2a3ca` or newer as Lovable's sync source of truth.
- User confirmed Lovable sync for Batch #122 is clean:
  - HEAD is `98335bd5`, `[codex] Record Batch 122 merge`, on `main` and on top of Batch #122 `dc2a3ca`, PR #173;
  - `LiveOffers.tsx`, `OfferCard.tsx`, `CertificationBadges.tsx`, `InfoPageLayout.tsx`, `PublicCtaSemantics.test.tsx`, `e2e/public-cta-semantics.spec.ts`, package smoke wiring and Batch #122 production-scale notes are present;
  - no conflicts were found and no files were modified in Lovable;
  - `/` renders on desktop and mobile in English, `View all offers` is a single direct `/offers` link, and landing offer cards link to `/offers/:id` with static certification chips;
  - `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press` and `/partners` expose `Back to homepage` as one direct `/` link with zero nested controls and zero 390px overflow;
  - Batches #117-#121, access gating, supplier redaction, price-lock, Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #123 on `codex/batch123-public-runtime-a11y-audit`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #122 and found unnamed visible input controls:
  - homepage hero search input had no programmatic accessible name;
  - `/signin` email and password inputs had no programmatic accessible names in email mode;
  - phone-mode and forgot-password states were included in the fix scope to prevent alternate-state regressions.
- Implemented Batch #123 public input accessibility:
  - added a locale-owned hidden label for homepage offer search and a stable `home-offer-search` input id;
  - connected `/signin` visible labels to email, phone, password and forgot-password email inputs;
  - hardened `CountryPhoneInput` with `inputId` and optional aria-label props, named country selector, named country-search input and named mobile close control;
  - preserved homepage search routing, auth runtime selection, sign-in submits, password reset, buyer session behavior, public copy and visual layout;
  - added `src/pages/PublicInputA11y.test.tsx`;
  - added `e2e/public-input-a11y.spec.ts` and wired it into a dedicated smoke script plus full `smoke:e2e:run`;
  - added Batch #123 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #123 local validation:
  - `npx vitest run src/pages/PublicInputA11y.test.tsx` passed, 4 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4195 npx playwright test e2e/public-input-a11y.spec.ts --project=chromium` passed, 3 tests;
  - `npm run smoke:e2e:public-input-a11y` passed, 3 tests after production build;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:run` passed, 129 tests.
- Batch #123 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #123 as `f75cf50`, `[codex] Batch #123 public input accessibility`.
- Pushed branch `codex/batch123-public-runtime-a11y-audit` to `origin`.
- Opened Draft PR #174: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/174`.
- Confirmed GitHub PR #174 `Core Type And Build Gate` passed in 11m31s.
- Marked PR #174 ready and merged it to `main` as `5105f3c`, `[codex] Batch #123 public input accessibility`.
- Added `docs/project-memory/PROMPTS/prompt-123-lovable-sync.md` for Batch #123 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #123 is clean:
  - HEAD is `50b10bc1`, `[codex] Add Batch 123 Lovable sync prompt`, on `main` and on top of Batch #123 `5105f3c`, PR #174;
  - `Hero.tsx`, `translations.ts`, `SignIn.tsx`, `CountryPhoneInput.tsx`, `PublicInputA11y.test.tsx`, `e2e/public-input-a11y.spec.ts`, package smoke wiring and Batch #123 production-scale notes are present;
  - no conflicts were found and files were not modified in Lovable;
  - homepage search has localized accessible labels in EN/RU/ES and keeps `/offers?q=...` routing unchanged;
  - public auth email, phone and forgot-password modes expose named fields; country selector, country search and mobile close button are named;
  - submit handlers, phone handling, buyer session behavior, buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#122 are preserved;
  - Batch #112 code-splitting and Batch #113 RouteChunkErrorBoundary are preserved, and the large-chunk warning remains resolved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #124 on `codex/batch124-public-runtime-a11y-audit`.
- Ran the next scoped public UX/SEO runtime audit after Batch #123 and found heading outline defects:
  - footer column labels rendered as H4 page headings, creating heading-level skips on public routes;
  - `/suppliers` supplier rows rendered as H3 headings immediately after the page H1.
- Implemented Batch #124 public heading structure:
  - changed footer columns to named navigation groups while keeping the same visible labels, links and analytics;
  - added a screen-reader-visible H2 `Supplier results` above `/suppliers` result cards with EN/RU/ES translations;
  - updated footer and supplier tests;
  - added `e2e/public-heading-structure.spec.ts` and wired it into a dedicated smoke script plus full `smoke:e2e:run`;
  - added Batch #124 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #124 local validation:
  - runtime audit confirmed zero heading-level skips and zero footer headings on `/`, `/offers`, `/suppliers`, `/how-it-works`, `/for-suppliers`, `/signin` and `/reset-password`;
  - `npx vitest run src/components/landing/Footer.test.tsx src/pages/Suppliers.test.tsx` passed, 24 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4196 npx playwright test e2e/public-heading-structure.spec.ts --project=chromium` passed, 8 tests;
  - `npm run smoke:e2e:public-heading-structure` passed, 8 tests after production build;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:run` passed, 137 tests.
- Batch #124 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #124 as `13e3e5e`, `[codex] Batch #124 public heading structure`.
- Pushed branch `codex/batch124-public-runtime-a11y-audit` to `origin`.
- Opened Draft PR #175: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/175`.
- Confirmed GitHub PR #175 `Core Type And Build Gate` passed in 11m28s.
- Marked PR #175 ready and merged it to `main` as `fdaf76a`, `[codex] Batch #124 public heading structure`.
- Added `docs/project-memory/PROMPTS/prompt-124-lovable-sync.md` for Batch #124 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #124 is clean:
  - HEAD is `05d09f4b` on `main`, including Batch #124 / PR #175 `fdaf76a`;
  - `Footer.tsx`, `Footer.test.tsx`, `Suppliers.tsx`, `translations.ts`, `Suppliers.test.tsx`, `e2e/public-heading-structure.spec.ts` and package smoke wiring are present;
  - no conflicts were found and files were not modified in Lovable;
  - footer columns render as named nav groups with visible p labels and no footer H1-H6 headings;
  - `/suppliers` outline starts `H1 Seafood suppliers`, `H2 Supplier results`, then H3 supplier cards;
  - supplier directory search, filters, sorting, pagination, selected preview and profile links are unchanged;
  - Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary are preserved;
  - buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#123 are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #125 on `codex/batch125-public-runtime-ux-a11y-audit`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #124 and found unnamed visible landmarks:
  - desktop `Header` navigation had no accessible landmark name;
  - open mobile `Header` navigation had no accessible landmark name;
  - `/how-it-works` supplier/trust asides, `/blog` sidebar and `/blog/:slug` article tools aside were visible complementary landmarks without accessible names.
- Implemented Batch #125 public landmark labels:
  - added EN/RU/ES locale-owned labels for desktop and mobile header navigation landmarks;
  - labelled `/how-it-works` supplier/trust asides from their existing visible headings;
  - added locale-owned labels for `/blog` sidebar and `/blog/:slug` article tools aside;
  - added `src/components/landing/Header.landmarks.test.tsx`;
  - added `e2e/public-landmark-labels.spec.ts` and wired it into a dedicated smoke script plus full `smoke:e2e:run`;
  - added Batch #125 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #125 local validation:
  - `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx` passed, 8 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `E2E_BASE_URL=http://127.0.0.1:4197 npx playwright test e2e/public-landmark-labels.spec.ts --project=chromium` passed, 39 tests;
  - `npm run smoke:e2e:public-landmark-labels` passed, 39 tests after production build;
  - `npm run lint` passed;
  - `npm run smoke:e2e:run` passed, 176 tests.
- Batch #125 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #125 as `edf8a25`, `[codex] Batch #125 public landmark labels`.
- Pushed branch `codex/batch125-public-runtime-ux-a11y-audit` to `origin`.
- Opened Draft PR #176: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/176`.
- Confirmed GitHub PR #176 `Core Type And Build Gate` passed in 11m52s.
- Marked PR #176 ready and merged it to `main` as `7196cc8`, `[codex] Batch #125 public landmark labels (#176)`.
- Added `docs/project-memory/PROMPTS/prompt-125-lovable-sync.md` for Batch #125 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #125 is clean:
  - HEAD is `a984c87` on `main`, including Batch #125 `7196cc8` / PR #176;
  - `Header.tsx`, `Header.landmarks.test.tsx`, `HowItWorks.tsx`, `BusinessOutcomes.tsx`, `Blog.tsx`, `BlogArticle.tsx`, `translations.ts`, `aria-tooltips-localized.ru.test.tsx`, `e2e/public-landmark-labels.spec.ts` and package smoke wiring are present;
  - no conflicts were found and files were not modified in Lovable;
  - visible `nav`/`aside`/`role=navigation|complementary` landmarks are named across all 19 public routes;
  - desktop Header exposes `Main navigation`, and the open mobile menu exposes `Mobile navigation`;
  - links, destinations, open/close behavior, Batch #112 code splitting and Batch #113 RouteChunkErrorBoundary are unchanged;
  - buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#124 are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #126 on `codex/batch126-public-skip-main-target`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #125 and found skip-to-main defects:
  - homepage `/` had no main landmark;
  - public routes had no reliable keyboard skip-to-main path;
  - some public route shells and fallback/detail states lacked a stable `main#main` target.
- Implemented Batch #126 public skip-to-main target:
  - added opt-in `showSkipLink` and `mainId` props to `Header`;
  - added locale-owned EN/RU/ES `aria_skipToMain` copy;
  - made the skip link focus and scroll the target, then normalize the URL to `#main`;
  - normalized audited public routes to exactly one `main#main`;
  - added Header unit coverage for the skip link;
  - added `e2e/public-skip-main-target.spec.ts` and wired it into a dedicated smoke script plus full `smoke:e2e:run`;
  - added Batch #126 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #126 local validation:
  - runtime Playwright pre-check passed on local dev server for public `main#main`, skip-link presence and homepage skip-link focus;
  - `E2E_BASE_URL=http://127.0.0.1:4198 npx playwright test e2e/public-skip-main-target.spec.ts --project=chromium` passed, 43 tests;
  - `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx` passed, 8 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:public-skip-main-target` passed, 43 tests after production build;
  - `npm run lint` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 219 tests.
- Batch #126 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #126 as `ac2318f`, `[codex] Batch #126 public skip-to-main target`.
- Pushed branch `codex/batch126-public-skip-main-target` to `origin`.
- Opened Draft PR #177: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/177`.
- Confirmed GitHub PR #177 `Core Type And Build Gate` passed in 11m54s.
- Marked PR #177 ready and merged it to `main` as `c1ebd76`, `[codex] Batch #126 public skip-to-main target (#177)`.
- Added `docs/project-memory/PROMPTS/prompt-126-lovable-sync.md` for Batch #126 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #126 is clean:
  - HEAD is `6a27659` on `main`, including Batch #126 `c1ebd76` / PR #177;
  - `Header.tsx`, `Header.landmarks.test.tsx`, `translations.ts`, `aria-tooltips-localized.ru.test.tsx`, public route shells, `e2e/public-skip-main-target.spec.ts` and package smoke wiring are present;
  - no conflicts were found and the tree is clean;
  - each listed public route exposes one hidden-until-focus `Skip to main content` link;
  - skip-link activation focuses `main#main` and replaces the URL hash with `#main`;
  - each route has exactly one `main#main`, zero `main:not(#main)` and no 390px horizontal overflow;
  - Batch #125 landmark labels, Batch #113 RouteChunkErrorBoundary and Batch #112 code splitting are intact;
  - buyer-first copy, access gating, supplier identity redaction, price-lock and Batches #110-#125 are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #127 on `codex/batch127-public-runtime-ux-a11y-audit`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #126:
  - no visible unnamed interactives were found on audited public routes;
  - no focusable `aria-hidden` controls were found;
  - no missing image alt issues were found;
  - mobile 390px target-size audit found undersized targets on `/blog` filter chips, popular topic chips, read links, see-all-updates and some breadcrumbs;
  - mobile 390px target-size audit found undersized targets on `/blog/:slug` breadcrumbs and mobile TOC links.
- Implemented Batch #127 public blog mobile tap targets:
  - added reusable mobile target classes in `src/pages/Blog.tsx`;
  - enlarged existing blog breadcrumbs, filter chips, read links, popular topic chips and see-all-updates link without changing destinations or copy;
  - added reusable mobile target classes in `src/pages/BlogArticle.tsx`;
  - enlarged existing article breadcrumbs, mobile TOC summary/links, FAQ summaries and back-to-index CTA without changing article content or SEO;
  - added `e2e/blog-mobile-tap-targets.spec.ts`;
  - wired `smoke:e2e:blog-mobile-tap-targets` and full `smoke:e2e:run` in `package.json`;
  - added Batch #127 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #127 local validation:
  - post-fix runtime Playwright scan passed for `/blog` and `/blog/atlantic-salmon-q1-price-pressure` at 390px: zero marked targets below 44px and zero horizontal overflow;
  - `E2E_BASE_URL=http://127.0.0.1:4199 npx playwright test e2e/blog-mobile-tap-targets.spec.ts --project=chromium` passed, 2 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:blog-mobile-tap-targets` passed, 2 tests after production build;
  - `npm run smoke:e2e:run` passed, 221 tests.
- Batch #127 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #127 as `ac0a4fd`, `[codex] Batch #127 public blog mobile tap targets`.
- Pushed branch `codex/batch127-public-runtime-ux-a11y-audit` to `origin`.
- Opened Draft PR #178: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/178`.
- Confirmed GitHub PR #178 `Core Type And Build Gate` passed in 12m16s.
- Marked PR #178 ready and merged it to `main` as `3aed8dd`, `[codex] Batch #127 public blog mobile tap targets (#178)`.
- Added `docs/project-memory/PROMPTS/prompt-127-lovable-sync.md` for Batch #127 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #127 is clean:
  - HEAD is `e8d096f` on `main`, including Batch #127 `3aed8dd` / PR #178;
  - `Blog.tsx`, `BlogArticle.tsx`, `e2e/blog-mobile-tap-targets.spec.ts`, package smoke wiring and Batch #127 production-scale notes are present;
  - no conflicts were found and files were not modified in Lovable;
  - `/blog` and `/blog/:slug` mobile targets are marked, min-h/min-w hardened where needed and covered by the 390px e2e guard;
  - blog copy, routes, in-page anchors, SEO, Batch #126 skip-to-main, Batch #125 landmark labels, Batch #113 RouteChunkErrorBoundary and Batch #112 code splitting are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #128 on `codex/batch128-public-runtime-ux-a11y-audit`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #127 and found registration-flow gaps:
  - `/register`, `/register/email`, `/register/verify`, `/register/details`, `/register/onboarding`, `/register/countries` and `/register/ready` had no stable `main#main` and no skip-to-main link;
  - registration header/footer/legal/secondary controls could render below the 44px mobile target baseline;
  - registration OTP inputs were unnamed and lacked `one-time-code` autocomplete;
  - registration email/details, sign-in and reset-password fields lacked useful browser completion hints;
  - `/register/ready` had a nested `Link > Button` CTA.
- Implemented Batch #128 public auth and registration accessibility:
  - added a hidden-until-focus skip-to-main link and exactly one `main#main` to `RegistrationLayout`;
  - hardened registration shell, footer, legal and secondary actions to mobile-safe target sizes;
  - added `inputAutoComplete` support to `CountryPhoneInput`;
  - added labels and completion hints to registration email, verify, details, sign-in and reset-password fields;
  - hardened onboarding/countries chip and skip controls;
  - changed `/register/ready` CTA to the existing `Button asChild` pattern;
  - added `e2e/public-auth-registration-a11y.spec.ts`;
  - wired `smoke:e2e:public-auth-registration-a11y` and full `smoke:e2e:run` in `package.json`;
  - added Batch #128 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #128 local validation:
  - `E2E_BASE_URL=http://127.0.0.1:4200 npx playwright test e2e/public-auth-registration-a11y.spec.ts --project=chromium` passed, 10 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4200 npx playwright test e2e/public-input-a11y.spec.ts e2e/auth-cta-semantics.spec.ts --project=chromium` passed, 5 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run lint` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:public-auth-registration-a11y` passed, 10 tests after production build;
  - `npm run smoke:e2e:run` passed, 231 tests.
- Batch #128 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #128 as `2c74e3b`, `[codex] Batch #128 public auth registration accessibility`.
- Pushed branch `codex/batch128-public-runtime-ux-a11y-audit` to `origin`.
- Opened Draft PR #179: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/179`.
- Confirmed GitHub PR #179 `Core Type And Build Gate` passed in 11m57s.
- Marked PR #179 ready and merged it to `main` as `912230c`, `[codex] Batch #128 public auth registration accessibility (#179)`.
- Added `docs/project-memory/PROMPTS/prompt-128-lovable-sync.md` for Batch #128 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #128 is clean:
  - HEAD is `f1f482b` on `main`, including Batch #128 `912230c` / PR #179;
  - `RegistrationLayout.tsx`, `CountryPhoneInput.tsx`, `SignIn.tsx`, `ResetPassword.tsx`, `RegisterChoose/Email/Verify/Details/Onboarding/Countries/Ready`, `e2e/public-auth-registration-a11y.spec.ts`, `package.json` and Batch #128 production-scale notes are present;
  - no conflicts were found and files were not modified in Lovable;
  - auth and registration fields expose expected labels and autocomplete hints;
  - all seven registration routes expose one `main#main` and a skip link through `t.aria_skipToMain`;
  - nested interactive controls are absent and `/register/ready` final CTA uses `Button asChild` with `Link to="/offers"`;
  - registration mobile targets meet the 44px baseline at 390px with no horizontal overflow;
  - Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary, Batch #125 landmarks, Batch #126 skip-to-main and Batch #127 blog tap targets are intact;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #129 on `codex/batch129-public-runtime-ux-a11y-audit`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #128 and focused the fix on `/offers/:id`, the buyer decision route:
  - visible gallery/photo controls were unnamed;
  - back-to-catalog, breadcrumbs, delivery-basis chips, supplier verification disclosure and full specifications disclosure could render below the 44px mobile target baseline;
  - no horizontal overflow or nested interactive controls were present before the fix.
- Implemented Batch #129 offer detail mobile accessibility:
  - named and resized `PhotoGallery` previous/next/open-gallery controls, thumbnails and lightbox controls using locale-owned EN/RU/ES labels;
  - hardened `OfferDetail` back-to-catalog and breadcrumb links to mobile-safe target sizes;
  - hardened `OfferSummary` delivery-basis controls in locked and unlocked states;
  - added `aria-expanded` and mobile-safe target sizes to `SupplierTrustPanel` review-scope disclosure and `FullSpecifications` disclosure;
  - added `e2e/offer-detail-mobile-a11y.spec.ts`;
  - wired `smoke:e2e:offer-detail-mobile-a11y` and full `smoke:e2e:run` in `package.json`;
  - added Batch #129 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #129 local validation:
  - focused runtime Playwright scan passed on `/offers/:id` at 390px with zero horizontal overflow, zero nested controls, zero unnamed visible buttons and zero marked targets below 44px;
  - `E2E_BASE_URL=http://127.0.0.1:4201 npx playwright test e2e/offer-detail-mobile-a11y.spec.ts --project=chromium` passed, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4201 npx playwright test e2e/offer-detail-cta-semantics.spec.ts e2e/offer-detail-runtime.spec.ts e2e/offer-detail-mobile-a11y.spec.ts --project=chromium` passed, 9 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run lint` passed;
  - `npm run smoke:e2e:offer-detail-mobile-a11y` passed, 2 tests after production build;
  - `npm run smoke:e2e:run` passed, 233 tests.
- Recorded Batch #129 build metrics from dedicated smoke: CSS 126.72 kB / 21.00 kB gzip; entry 355.46 kB / 114.16 kB gzip; i18n-translations 315.30 kB / 99.25 kB gzip; OfferDetail 49.03 kB / 12.56 kB gzip.
- Batch #129 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #129 as `947cb25`, `[codex] Batch #129 offer detail mobile accessibility`.
- Pushed branch `codex/batch129-public-runtime-ux-a11y-audit` to `origin`.
- Opened Draft PR #180: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/180`.
- Confirmed GitHub PR #180 `Core Type And Build Gate` passed in 12m46s.
- Marked PR #180 ready and merged it to `main` as `f81ee18`, `[codex] Batch #129 offer detail mobile accessibility (#180)`.
- Added `docs/project-memory/PROMPTS/prompt-129-lovable-sync.md` for Batch #129 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #129 is clean:
  - HEAD is `2550a29` on `main`, including Batch #129 PR #180 `f81ee18`;
  - `PhotoGallery.tsx`, `OfferSummary.tsx`, `SupplierTrustPanel.tsx`, `FullSpecifications.tsx`, `OfferDetail.tsx`, `translations.ts`, `e2e/offer-detail-mobile-a11y.spec.ts` and `package.json` were checked;
  - no conflicts were found and files were not modified in Lovable;
  - `PhotoGallery.tsx` uses `useLanguage()` and gallery control names are localized in EN/RU/ES;
  - `data-offer-detail-mobile-target` markers are present for gallery controls, delivery basis controls, disclosures, back-to-catalog and breadcrumbs;
  - supplier review scope and full specifications disclosures expose `aria-expanded`;
  - access gating, supplier identity redaction, price lock and Batch #121 CTA semantics are unchanged;
  - Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#128 are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #130 on `codex/batch130-public-runtime-ux-a11y-audit`.
- Ran the next scoped public UX/accessibility runtime audit after Batch #129 and focused the fix on `/suppliers/:id`, the supplier trust/supply route:
  - breadcrumb `Home` and `Suppliers` links could render below the 44px mobile target baseline;
  - supplier profile trust tabs could render at 36px height on mobile;
  - unknown supplier fallback directory recovery link could render below the 44px mobile target baseline;
  - no horizontal overflow or nested interactive controls were present before the fix.
- Implemented Batch #130 supplier profile mobile accessibility:
  - localized the supplier profile breadcrumb landmark through the existing `aria_breadcrumb` translation;
  - hardened breadcrumb Home/Suppliers links to mobile-safe 44px target boxes;
  - hardened supplier profile tab triggers with `min-h-11` and target markers;
  - hardened unknown supplier fallback directory recovery link with a mobile-safe target and marker;
  - added `e2e/supplier-profile-mobile-a11y.spec.ts`;
  - wired `smoke:e2e:supplier-profile-mobile-a11y` and full `smoke:e2e:run` in `package.json`;
  - added Batch #130 to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #130 local validation:
  - `E2E_BASE_URL=http://127.0.0.1:4202 npx playwright test e2e/supplier-profile-mobile-a11y.spec.ts --project=chromium` passed, 2 tests;
  - `E2E_BASE_URL=http://127.0.0.1:4202 npx playwright test e2e/supplier-profile-mobile-a11y.spec.ts e2e/supplier-profile-detail.spec.ts e2e/supplier-profile-access.spec.ts e2e/supplier-directory-profile-flow.spec.ts --project=chromium` passed, 12 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:supplier-profile-mobile-a11y` passed, 2 tests after production build;
  - `npm run smoke:e2e:run` passed, 235 tests.
- Recorded Batch #130 build metrics from dedicated smoke: CSS 126.72 kB / 21.00 kB gzip; entry 355.46 kB / 114.16 kB gzip; i18n-translations 315.30 kB / 99.25 kB gzip; SupplierProfile 60.56 kB / 15.45 kB gzip.
- Batch #130 build preserved the known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. The Vite large-chunk warning stayed resolved.
- Committed Batch #130 as `984e05a`, `[codex] Batch #130 supplier profile mobile accessibility`.
- Pushed branch `codex/batch130-public-runtime-ux-a11y-audit` to `origin`.
- Opened Draft PR #181: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/181`.
- Confirmed GitHub PR #181 `Core Type And Build Gate` passed in 12m26s.
- Marked PR #181 ready and merged it to `main` as `1449efa`, `[codex] Batch #130 supplier profile mobile accessibility (#181)`.
- Added `docs/project-memory/PROMPTS/prompt-130-lovable-sync.md` for Batch #130 Lovable sync confirmation.
- User confirmed Lovable sync for Batch #130 is clean:
  - HEAD synced to `1449efa` on `main`, including PR #181 Batch #130 supplier profile mobile accessibility;
  - `src/pages/SupplierProfile.tsx`, `e2e/supplier-profile-mobile-a11y.spec.ts`, `package.json` and `docs/backend/production-scale-baseline.md` were checked;
  - no conflicts were found and files were not modified in Lovable;
  - `SupplierProfile.tsx` breadcrumb landmark uses `t.aria_breadcrumb`;
  - `data-supplier-profile-mobile-target` markers are present for `breadcrumb-home`, `breadcrumb-suppliers`, `not-found-directory` and five `profile-tab` controls;
  - package smoke scripts and full `smoke:e2e:run` wiring are present;
  - Batch #130 production-scale notes are present;
  - access gating, supplier identity redaction, approval refresh and directory bridge are unchanged;
  - no nested interactive controls and no 390px horizontal overflow were found;
  - Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#129 are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.

- Started Batch #131 locally on `codex/batch131-public-runtime-ux-a11y-audit`.
- Audited recent public Pulse additions after Batch #130 Lovable sync and found homepage Pulse badges looked live while estimate disclosure was only title-level, and Pulse ping animations lacked reduced-motion guards.
- Updated `src/components/PulseBadge.tsx` so estimate disclosure is localized and programmatic through `aria-label` and `title`, with `motion-reduce:animate-none` on the ping animation.
- Updated `src/components/offer-detail/MarketPulse.tsx` so the panel is a section labelled by its visible heading and the ping animation respects reduced motion.
- Added `src/components/PulseBadge.test.tsx` for compact programmatic estimate disclosure, RU localization and reduced-motion class coverage.
- Added `e2e/public-pulse-disclosure.spec.ts` for homepage Pulse badges and offer-detail MarketPulse at 390px, including zero nested controls and zero horizontal overflow.
- Wired `smoke:e2e:public-pulse-disclosure` and the full `smoke:e2e:run` guard in `package.json`.
- Added Batch #131 production-scale notes to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #131 validation:
  - `npx vitest run src/components/PulseBadge.test.tsx` passed, 3 tests.
  - `E2E_BASE_URL=http://127.0.0.1:4203 npx playwright test e2e/public-pulse-disclosure.spec.ts --project=chromium` passed, 2 tests.
  - `E2E_BASE_URL=http://127.0.0.1:4203 npx playwright test e2e/public-heading-structure.spec.ts e2e/public-landmark-labels.spec.ts --project=chromium` passed, 47 tests.
  - `npx tsc -b --noEmit` passed.
  - `npm run lint` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:e2e:public-pulse-disclosure` passed, 2 tests after production build.
  - `npm run smoke:e2e:run` passed, 237 tests.
- Opened draft PR #183 for Batch #131: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/183`.
- PR #183 initially reported a dirty base because `origin/main` advanced to `da880e4`, `Сделал пульсацию динамичной`.
- Rebasing Batch #131 onto `origin/main` produced one conflict in `src/components/PulseBadge.tsx`.
- Resolved the conflict by preserving the new dynamic count drift and adding Batch #131 estimate disclosure plus `motion-reduce:animate-none`.
- Confirmed post-rebase validation:
  - `npx vitest run src/components/PulseBadge.test.tsx` passed, 3 tests.
  - `npx tsc -b --noEmit` passed.
  - `npm run lint` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:e2e:public-pulse-disclosure` passed, 2 tests after production build.
  - `npm run smoke:e2e:run` passed, 237 tests.
- Force-with-lease pushed the rebased Batch #131 branch to PR #183.
- Confirmed GitHub PR #183 `Core Type And Build Gate` passed in 10m13s.
- Marked PR #183 ready and merged it to `main` as `8590361`, `[codex] Batch #131 public pulse estimate disclosure`.
- Added `docs/project-memory/PROMPTS/prompt-131-lovable-sync.md` for Batch #131 Lovable sync confirmation.
- Pushed `main` to `84f71ba`, `[codex] Add Batch 131 Lovable sync prompt`, on top of Batch #131 merge commit `8590361`.
- Added a follow-up project-memory checkpoint on `main` so recovery instructions point to the Batch #131 Lovable sync prompt without depending on an exact post-checkpoint HEAD hash.
- User confirmed Lovable sync for Batch #131 is clean:
  - HEAD synced to `6655d11` on `main`, on top of PR #183 Batch #131 `8590361`;
  - `src/components/PulseBadge.tsx`, `src/components/PulseBadge.test.tsx`, `src/components/offer-detail/MarketPulse.tsx`, `src/lib/pulse-seed.ts`, `e2e/public-pulse-disclosure.spec.ts`, `package.json` and `docs/backend/production-scale-baseline.md` were checked;
  - no conflicts were found and files were not modified in Lovable;
  - PulseBadge estimate disclosure is present;
  - Dynamic Pulse behavior is preserved;
  - MarketPulse labelled section and reduced-motion guards are present;
  - Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#130 are preserved;
  - known warnings remain: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Started Batch #132 on `codex/batch132-public-runtime-ux-a11y-audit`.
- Ran scoped public UX/UI audit with buyer-first B2B lens and found hardcoded Russian visible/programmatic labels on English public offer routes:
  - `MobileOfferCard` details link aria-label used `Открыть карточку: ...`;
  - `MobileOfferCard` delivery-basis link aria-label used `Базис поставки ..., срок ...`;
  - `MobileOfferCard` mixed-orientation photo hint used Russian visible/title/aria copy;
  - `OfferSummary` used Russian stock, inventory, certification, delivery basis, min lot and locked price/supplier labels in the English offer-detail summary.
- Implemented Batch #132 public offer locale a11y hardening:
  - localized `MobileOfferCard` details link aria-label, delivery-basis aria-label and mixed-orientation hint copy through EN/RU/ES `translations.ts` keys;
  - localized `OfferSummary` stock labels, inventory label, capacity meter aria-label, certification label, delivery-basis label, min-lot label and locked price/supplier status;
  - extended `CatalogOfferRow.locale.test.tsx` to guard English mobile card aria-labels and no Russian aria leakage;
  - added `src/components/offer-detail/OfferSummary.locale.test.tsx`;
  - added `e2e/public-offer-locale-a11y.spec.ts`;
  - wired `smoke:e2e:public-offer-locale-a11y` and full `smoke:e2e:run` in `package.json`;
  - added Batch #132 production-scale notes to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #132 local validation:
  - `npx vitest run src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/offer-detail/OfferSummary.locale.test.tsx` passed, 4 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run smoke:e2e:public-offer-locale-a11y` passed, 2 tests after production build;
  - `npm run smoke:e2e:public-offer-locale-a11y:run` passed, 2 tests;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:run` passed, 239 tests.
- Recorded Batch #132 build metrics from dedicated smoke: CSS 126.77 kB / 21.01 kB gzip; entry 355.47 kB / 114.18 kB gzip; i18n-translations 320.54 kB / 100.99 kB gzip; MobileOfferCard 42.80 kB / 12.15 kB gzip; OfferDetail 51.27 kB / 12.81 kB gzip.
- Browser plugin runtime was unavailable for in-app manual inspection; Playwright browser smoke covered the changed real routes `/offers` and `/offers/:id`.
- Batch #132 preserved known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale. Vite large-chunk warning stayed resolved.
- Committed Batch #132 locally as `e5b5633`, opened draft PR #184, then fetched `origin/main` and saw it had advanced to `35317b0`.
- Rebased Batch #132 onto `origin/main` `35317b0` without conflicts; new branch head before memory amend was `170199c`.
- Confirmed post-rebase Batch #132 validation:
  - `npx vitest run src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/offer-detail/OfferSummary.locale.test.tsx` passed, 4 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:public-offer-locale-a11y` passed, 2 tests after production build.
- Amended Batch #132 after the rebase and force-with-lease pushed the updated branch to PR #184.
- Marked PR #184 ready for review. GitHub `Core Type And Build Gate` remained queued with no job steps started, so Batch #132 was not merged yet.
- GitHub `Core Type And Build Gate` failed after PR #184 was rebased onto `origin/main` `35317b0`; root cause was `e2e/public-pulse-disclosure.spec.ts` still requiring visible `estimate` text after `main` intentionally removed the compact visible estimate chip.
- Updated `e2e/public-pulse-disclosure.spec.ts` to match the current PulseBadge contract: visible activity count, no visible compact estimate chip, estimate disclosure through `aria-label` and `title`.
- Updated project memory and Batch #131 production-scale notes so future work does not restore the stale visible-chip contract.
- Confirmed CI-fix validation:
  - `npx vitest run src/components/PulseBadge.test.tsx src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/offer-detail/OfferSummary.locale.test.tsx` passed, 7 tests.
  - `npx tsc -b --noEmit` passed.
  - `npm run lint` passed.
  - `npm run check:production-scale-baseline` passed.
  - `npm run smoke:e2e:public-pulse-disclosure` passed, 2 tests after production build.
  - `npm run smoke:e2e:public-offer-locale-a11y:run` passed, 2 tests.
  - `npm run smoke:e2e:run` passed, 239 tests.
- Amended Batch #132 to `98170a9` and force-with-lease pushed PR #184.
- Confirmed GitHub `Core Type And Build Gate` passed on PR #184.
- Squash-merged PR #184 into `main` as `ab46fd3`, `[codex] Batch #132 public offer locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-132-lovable-sync.md` for Batch #132 Lovable sync confirmation.
- Updated project memory to point the next action at Lovable sync for Batch #132.
- User confirmed Lovable sync for Batch #132 is clean:
  - HEAD synced to `d1bf472` on `main`, including Batch #132 / PR #184 and user commits `0846d5f`, `35317b0`, `6c86b3c`;
  - checked `MobileOfferCard`, `OfferSummary`, `translations`, `PulseBadge`, locale tests, e2e specs, `package.json`, `/offers`, `/offers/:id` and homepage Pulse;
  - no conflicts were found;
  - all 7 focused tests passed;
  - public offer locale/a11y status is OK with no Russian leakage in English labels or aria-labels;
  - Pulse compact disclosure contract is preserved: no visible estimate chip, estimate disclosure through `aria-label`/`title`, `motion-reduce:animate-none` and hidden-height stability;
  - Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and known warnings are preserved.
- Started Batch #133 on `codex/batch133-public-runtime-ux-a11y-audit`.
- Ran scoped public UX/UI audit with buyer-first B2B lens and found hardcoded English breadcrumb landmark labels on localized public routes:
  - `/suppliers` used `aria-label="Breadcrumb"`;
  - `/blog` used `aria-label="Breadcrumb"`;
  - `/blog/:slug` used `aria-label="Breadcrumb"`.
- Implemented Batch #133 public breadcrumb locale a11y hardening:
  - changed `Suppliers`, `Blog` and `BlogArticle` to use `t.aria_breadcrumb`;
  - extended `src/i18n/aria-tooltips-localized.ru.test.tsx` to guard Suppliers, Blog and BlogArticle under RU;
  - added `e2e/public-breadcrumb-locale-a11y.spec.ts` for `/suppliers`, `/blog` and `/blog/atlantic-salmon-q1-price-pressure` at 390px;
  - wired `smoke:e2e:public-breadcrumb-locale-a11y` and full `smoke:e2e:run` in `package.json`;
  - added Batch #133 production-scale notes to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #133 local validation:
  - `npx vitest run src/i18n/aria-tooltips-localized.ru.test.tsx` passed, 7 tests;
  - `npm run smoke:e2e:public-breadcrumb-locale-a11y` passed, 3 tests after production build;
  - `npm run smoke:e2e:public-breadcrumb-locale-a11y:run` passed, 3 tests;
  - `npm run smoke:e2e:blog-mobile-tap-targets:run` passed, 2 tests;
  - `npm run smoke:e2e:suppliers-directory:run` passed, 5 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:run` passed, 242 tests.
- Batch #133 preserved supplier directory behavior, blog/article routing, SEO route ownership, mobile tap-target hardening, access gating, supplier identity redaction, price-lock, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #117-#132 public UX/a11y safeguards.
- Committed Batch #133 as `19832d1`, opened draft PR #185, and pushed branch
  `codex/batch133-public-runtime-ux-a11y-audit`.
- GitHub `Core Type And Build Gate` initially failed in the full browser smoke
  on the existing `e2e/suppliers-directory-paging.spec.ts` test. The new
  `public-breadcrumb-locale-a11y` spec had already passed in that run.
- Reran the failed GitHub job without code changes. The same `Core Type And
  Build Gate` passed, including full browser smoke, API-backed access smoke,
  frontend-without-Supabase smoke, self-hosted auth/access smoke and admin
  smoke steps.
- Marked PR #185 ready and squash-merged it to `main` as `ca1438b`,
  `[codex] Batch #133 public breadcrumb locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-133-lovable-sync.md` and updated
  project memory to point the next action at Lovable sync for Batch #133.
- User confirmed Lovable sync for Batch #133 is clean:
  - GitHub commit synced to `main` @ Batch #133, PR #185, `ca1438b` or newer;
  - checked `src/pages/Suppliers.tsx`, `src/pages/Blog.tsx`,
    `src/pages/BlogArticle.tsx`, `src/pages/OfferDetail.tsx`,
    `src/i18n/aria-tooltips-localized.ru.test.tsx`,
    `e2e/public-breadcrumb-locale-a11y.spec.ts`, `package.json` and
    `docs/backend/production-scale-baseline.md`;
  - no conflicts were found;
  - public breadcrumb locale/a11y status is OK, including RU
    `Хлебные крошки` and no hardcoded `aria-label="Breadcrumb"` on the audited
    pages;
  - supplier/blog route behavior, access gating, supplier redaction,
    exact-price lock, analytics, buyer-first copy, Pulse compact contract,
    Batch #112 code splitting and Batch #113 route chunk error boundary are
    preserved;
  - known warnings remain Supabase generated types out of sync in non-strict
    mode and Browserslist data stale.
- Recorded Batch #133 Lovable sync in project memory and moved next action to
  the next scoped public UX/UI audit batch.
- Started Batch #134 on `codex/batch-134-supplier-directory-locale-a11y`.
- Ran scoped public UX/UI audit with buyer-first B2B lens on `/suppliers` and found hardcoded English programmatic supplier trust labels under localized UI:
  - selected supplier aside used `aria-label="Selected supplier"`;
  - supplier rows used `Supplier signals`, `Product catalog preview` and `Delivery markets preview`;
  - supplier row and selected panel images used hardcoded English alt phrases `reference image for` and `product preview from`.
- Implemented Batch #134 supplier directory locale a11y hardening:
  - changed the selected supplier aside to use `t.selectedSupplier_aboutLabel`;
  - added EN/RU/ES supplier-row trust labels and image alt templates in `src/i18n/translations.ts`;
  - changed `SupplierRow` and `SelectedSupplierPanel` to use locale-owned aria labels and image alt text;
  - extended `src/pages/Suppliers.i18n.test.tsx` to guard RU supplier trust labels and image alt text against English leakage;
  - added `e2e/suppliers-directory-locale-a11y.spec.ts` for `/suppliers` at 390px;
  - wired `smoke:e2e:suppliers-directory-locale-a11y` and full `smoke:e2e:run` in `package.json`;
  - added Batch #134 production-scale notes to `docs/backend/production-scale-baseline.md`.
- Updated `src/components/suppliers/__snapshots__/SupplierRow.snapshot.test.tsx.snap` with `vitest -u`; the snapshot was stale relative to the current mobile-safe SupplierRow DOM contract and now matches the existing implementation.
- Confirmed Batch #134 local validation:
  - `npx vitest run src/pages/Suppliers.i18n.test.tsx src/components/suppliers/SupplierRow.test.tsx src/components/suppliers/SupplierRow.snapshot.test.tsx` passed, 24 tests;
  - `npm run smoke:e2e:suppliers-directory-locale-a11y` passed, 1 test after production build;
  - `npm run smoke:e2e:suppliers-directory:run` passed, 5 tests, with one retry-resolved existing supplier paging flake;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 243 tests.
- Recorded Batch #134 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.47 kB / 114.18 kB gzip; i18n-translations 321.51 kB / 101.25 kB gzip; Suppliers 36.46 kB / 9.07 kB gzip.
- Batch #134 preserved supplier directory sorting/filtering/pagination, selected panel behavior, shortlist behavior, supplier profile routing, directory/profile approval bridge, buyer-first narrative, access gating, supplier identity redaction, exact-price lock, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #117-#133 public UX/a11y safeguards.
- Batch #134 preserved known warnings: Supabase generated types are out of sync in non-strict mode and Browserslist data is stale.
- Committed Batch #134 as `033df30`, `[codex] Batch #134 supplier directory locale a11y`.
- Pushed branch `codex/batch-134-supplier-directory-locale-a11y` to `origin`.
- Opened draft PR #186: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/186`.
- GitHub `Core Type And Build Gate` initially failed in the full browser smoke on the known `e2e/suppliers-directory-paging.spec.ts` test. The new `suppliers-directory-locale-a11y` spec passed in that run.
- Reran the failed GitHub job without code changes. The rerun passed `Core Type And Build Gate` in 12m07s.
- Marked PR #186 ready and squash-merged it to `main` as `6cd21e9`, `[codex] Batch #134 supplier directory locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-134-lovable-sync.md` and updated project memory to point the next action at Lovable sync for Batch #134.
- User confirmed Lovable sync for Batch #134 is clean:
  - GitHub commit synced to `main` @ Batch #134, PR #186, `6cd21e9` or newer;
  - checked `src/i18n/translations.ts`, `src/pages/Suppliers.tsx`, `src/components/suppliers/SupplierRow.tsx`, `src/components/suppliers/SelectedSupplierPanel.tsx`, `src/pages/Suppliers.i18n.test.tsx`, `e2e/suppliers-directory-locale-a11y.spec.ts`, `package.json` and `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no files were modified in Lovable;
  - RU supplier directory labels and image alt text are localized with no hardcoded English leakage;
  - supplier directory behavior, access gating, redaction, exact-price/supplier locks, SEO, analytics, buyer-first copy, Pulse compact contract, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#133 are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict mode and Browserslist data stale.
- Recorded Batch #134 Lovable sync in project memory and moved next action to the next scoped public UX/UI audit batch.
- Started Batch #135 on `codex/batch-135-supplier-profile-logo-locale-a11y`.
- Ran scoped public UX/UI audit with buyer-first B2B lens on `/suppliers/:id` and found wrong-locale supplier logo programmatic copy:
  - `SupplierLogoCard` used hardcoded Russian wrapper aria-label copy, `Логотип {name}`;
  - supplier logo image alt text used hardcoded English suffix, `{name} logo`.
- Implemented Batch #135 supplier profile logo locale a11y hardening:
  - `src/pages/SupplierProfile.tsx` now derives both supplier logo wrapper `aria-label` and image `alt` from the existing `supplier_logo_aria` EN/RU/ES template;
  - `src/pages/__tests__/SupplierProfile.i18n.test.tsx` now guards EN/RU/ES supplier logo accessible names and image alt text;
  - added `e2e/supplier-profile-logo-locale-a11y.spec.ts` for `/suppliers/sup-no-001` at 390px in EN/RU/ES;
  - wired `smoke:e2e:supplier-profile-logo-locale-a11y` and the full smoke suite in `package.json`;
  - added Batch #135 production-scale notes to `docs/backend/production-scale-baseline.md`.
- Confirmed Batch #135 focused local validation:
  - `npx vitest run src/pages/__tests__/SupplierProfile.i18n.test.tsx` passed, 24 tests;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:supplier-profile-logo-locale-a11y` passed, 3 tests after production build;
  - `npm run smoke:e2e:supplier-profile-mobile-a11y:run` passed, 2 tests;
  - `npm run smoke:e2e:supplier-profile-detail:run` passed, 4 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - explicit `SupplierProfile` unit suite passed, 81 tests passed and 2 skipped.
- Confirmed Batch #135 final validation:
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 246 tests.
- Recorded Batch #135 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.47 kB / 114.16 kB gzip; i18n-translations 321.51 kB / 101.25 kB gzip; SupplierProfile 60.58 kB / 15.43 kB gzip.
- Batch #135 preserves supplier profile route behavior, access gating, supplier identity redaction, approval refresh, profile tabs, directory/profile bridge, SEO, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#134 public UX/a11y safeguards.
- Known warnings remain Supabase generated types out of sync in non-strict mode and Browserslist data stale.
- Committed Batch #135 as `93aaf3f`, `[codex] Batch #135 supplier profile logo locale a11y`.
- Pushed branch `codex/batch-135-supplier-profile-logo-locale-a11y` to `origin`.
- Opened draft PR #187: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/187`.
- GitHub `Core Type And Build Gate` passed on PR #187 in 12m21s.
- Marked PR #187 ready and squash-merged it to `main` as `eb23d5f`, `[codex] Batch #135 supplier profile logo locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-135-lovable-sync.md` and updated project memory to point the next action at Lovable sync for Batch #135.
- User confirmed Lovable sync for Batch #135 is clean:
  - GitHub commit synced to `main` @ Batch #135, PR #187, `eb23d5f` or newer;
  - checked `src/pages/SupplierProfile.tsx`, `src/i18n/translations.ts`, `src/pages/__tests__/SupplierProfile.i18n.test.tsx`, `e2e/supplier-profile-logo-locale-a11y.spec.ts`, `package.json` and `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no files were modified in Lovable;
  - EN/RU/ES supplier profile logo accessible names and image alt text are localized with no cross-locale leakage;
  - supplier profile behavior, access gating, identity redaction, approval refresh, profile tabs, directory/profile bridge, route SEO, buyer-first trust copy, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#134 are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict mode and Browserslist data stale.
- Recorded Batch #135 Lovable sync in project memory and moved next action to the next scoped public UX/UI audit batch.
- Started Batch #136 on `codex/batch-136-offer-detail-supplier-trust-locale-a11y`.
- Ran scoped public UX/UI audit with buyer-first B2B lens on `/offers/:id` and found hardcoded English supplier trust panel UI labels inside localized RU/ES offer detail UI.
- Confirmed affected labels in `SupplierTrustPanel`: `Verified Supplier`, `Pending Full Verification`, `What was reviewed?`, `Hide details`, `In business`, `Response`, `Certifications`, `Reviewed documents`, `View Supplier Profile`, `Contact Supplier`, `Save to Shortlist` and `Compare Similar Offers`.
- Implemented Batch #136 offer detail supplier trust locale a11y hardening:
  - `src/components/offer-detail/SupplierTrustPanel.tsx` now uses typed EN/RU/ES `offerDetail_*` supplier trust labels, no-date fallback copy and pluralized years-in-business text;
  - `src/lib/supplier-i18n.ts` helper comment now reflects broader public supplier/trust use;
  - `src/pages/OfferDetail.tsx` route shells use `overflow-x-hidden` after the new RU disclosure guard exposed 15px mobile overflow at 390px;
  - `src/components/offer-detail/SupplierTrustPanel.access.test.tsx` guards RU/ES trust labels and qualified CTAs;
  - `e2e/offer-detail-supplier-trust-locale-a11y.spec.ts` covers RU/ES trust labels, disclosure target height, nested controls and zero horizontal overflow at 390px;
  - `package.json` wires the dedicated and full e2e smoke scripts;
  - `docs/backend/production-scale-baseline.md` contains the Batch #136 10,000 concurrent-user capacity note.
- Confirmed Batch #136 local validation:
  - `npx vitest run src/components/offer-detail/SupplierTrustPanel.access.test.tsx` passed, 4 tests;
  - `npm run smoke:e2e:offer-detail-supplier-trust-locale-a11y` passed, 2 tests after production build;
  - `npm run smoke:e2e:offer-detail-mobile-a11y:run` passed, 2 tests;
  - `npm run smoke:e2e:public-offer-locale-a11y:run` passed, 2 tests;
  - `npm run check:production-scale-baseline` passed;
  - `git diff --check` passed;
  - `npm run lint` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run smoke:e2e:run` passed, 248 tests.
- Batch #136 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.47 kB / 114.17 kB gzip; i18n-translations 324.98 kB / 102.16 kB gzip; OfferDetail 51.78 kB / 12.87 kB gzip.
- Batch #136 preserves buyer-first offer detail narrative, access gating, supplier identity redaction, exact-price lock, supplier access requests, Market Pulse, route SEO, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#135 public UX/a11y safeguards.
- Committed Batch #136 as `288903a`, `[codex] Batch #136 offer detail supplier trust locale a11y`.
- Pushed branch `codex/batch-136-offer-detail-supplier-trust-locale-a11y` to `origin`.
- Opened draft PR #188: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/188`.
- GitHub `Core Type And Build Gate` passed on PR #188 in 11m57s.
- Marked PR #188 ready and squash-merged it to `main` as `3720708`, `[codex] Batch #136 offer detail supplier trust locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-136-lovable-sync.md` and updated project memory to point the next action at Lovable sync for Batch #136.
- User confirmed Lovable sync for Batch #136 is clean:
  - GitHub commit synced to `main` @ Batch #136, PR #188, `3720708` or newer;
  - checked `src/components/offer-detail/SupplierTrustPanel.tsx`, `src/i18n/translations.ts`, `src/pages/OfferDetail.tsx`, `src/components/offer-detail/SupplierTrustPanel.access.test.tsx`, `e2e/offer-detail-supplier-trust-locale-a11y.spec.ts`, `package.json` and `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no files were modified in Lovable;
  - RU and ES supplier trust labels are localized, hardcoded English labels do not leak into RU/ES UI, the disclosure button has `min-h-11` and nested interactive controls are absent;
  - offer detail behavior, access gating, supplier identity redaction, exact-price lock, SupplierAccessRequestPanel, MarketPulse, SEO, analytics, buyer-first copy, Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#135 safeguards are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict mode and Browserslist data stale.
- Recorded Batch #136 Lovable sync in project memory and moved next action to the next scoped public UX/UI audit batch.

## 2026-05-27

- Started Batch #137 on `codex/batch-137-offer-detail-decision-support-locale-a11y`.
- Ran scoped public UX/UI audit with buyer-first B2B lens on `/offers/:id` lower decision-support sections.
- Found hardcoded English UI labels in `TrustSection`, `FullSpecifications`, `SimilarOffers`, `SimilarProducts`, `RelatedArticles` and `DecisionFAQ` inside localized RU/ES offer detail UI.
- Found locked-buyer leakage risk in similar offer/product recommendations: those sections rendered raw mock `priceRange` values instead of the localized locked-price label.
- Implemented Batch #137 offer detail decision-support locale/a11y hardening:
  - lower decision-support sections now use typed EN/RU/ES `offerDetail_*` translation keys;
  - `OfferDetail` passes effective `renderAccessLevel` into lower trust/recommendation blocks;
  - similar offer/product cards show exact prices only for `qualified_unlocked` buyers;
  - related insight cards are real links to `/blog/:slug`;
  - FAQ disclosures expose `aria-expanded`, `aria-controls` and mobile-safe target markers;
  - `src/components/offer-detail/DecisionSupport.locale.test.tsx` guards RU/ES locale behavior;
  - `e2e/offer-detail-decision-support-locale-a11y.spec.ts` covers 390px locale, locked-price, link, FAQ and overflow behavior;
  - `package.json` wires the dedicated and full e2e smoke scripts;
  - `docs/backend/production-scale-baseline.md` contains the Batch #137 10,000 concurrent-user capacity note.
- Confirmed Batch #137 local validation:
  - `npx tsc -b --noEmit` passed;
  - `npx vitest run src/components/offer-detail/DecisionSupport.locale.test.tsx` passed, 2 tests;
  - `npm run smoke:e2e:offer-detail-decision-support-locale-a11y` passed, 2 tests after production build;
  - `npm run smoke:e2e:offer-detail-supplier-trust-locale-a11y:run` passed, 2 tests;
  - `npm run smoke:e2e:offer-detail-mobile-a11y:run` passed, 2 tests;
  - `npm run smoke:e2e:public-offer-locale-a11y:run` passed, 2 tests;
  - `npm run check:production-scale-baseline` passed;
  - `npm run lint` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 250 tests.
- Batch #137 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.47 kB / 114.17 kB gzip; i18n-translations 340.35 kB / 106.73 kB gzip; OfferDetail 51.80 kB / 12.06 kB gzip.
- Attempted Codex in-app browser preview verification, but browser-client/browser MCP connection was unavailable. Mobile runtime verification was covered by Playwright at 390px.
- Batch #137 preserves buyer-first offer detail narrative, access gating, supplier identity redaction, exact-price lock, supplier access requests, Market Pulse, route SEO, Batch #112 code splitting, Batch #113 RouteChunkErrorBoundary and Batches #110-#136 public UX/a11y safeguards.
- Committed Batch #137 as `9171da4`, `[codex] Batch #137 offer detail decision support locale a11y`.
- Pushed branch `codex/batch-137-offer-detail-decision-support-locale-a11y` to `origin`.
- Opened draft PR #189: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/189`.
- GitHub `Core Type And Build Gate` passed on PR #189 in 12m23s.
- Marked PR #189 ready and squash-merged it to `main` as `15fc5f8`, `[codex] Batch #137 offer detail decision support locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-137-lovable-sync.md` and updated project memory to point the next action at Lovable sync for Batch #137.
- User confirmed Lovable sync for Batch #137 is clean:
  - GitHub commit synced to `main` @ Batch #137, PR #189, `15fc5f8` or newer;
  - checked `src/pages/OfferDetail.tsx`, `TrustSection.tsx`, `FullSpecifications.tsx`, `SimilarOffers.tsx`, `SimilarProducts.tsx`, `RelatedArticles.tsx`, `DecisionFAQ.tsx`, `src/i18n/translations.ts`, `DecisionSupport.locale.test.tsx`, `e2e/offer-detail-decision-support-locale-a11y.spec.ts`, `package.json` and `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no files were modified in Lovable;
  - RU/ES lower decision-support labels are localized, hardcoded English labels are removed, FAQ/Full Specs expose `aria-expanded`/`aria-controls`, related insights are links, nested controls are absent and 390px overflow is absent;
  - locked buyers see localized locked-price labels in SimilarOffers/SimilarProducts, `Lower price` reason is skipped for locked buyers, and access gating, supplier identity redaction, exact-price lock, SupplierAccessRequestPanel, Market Pulse, SEO, sticky mobile CTA and buyer-first copy are unchanged;
  - Batch #112 code splitting, Batch #113 route chunk error boundary and Batches #110-#136 are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict mode and Browserslist data stale.
- Recorded Batch #137 Lovable sync in project memory and moved next action to the next scoped public UX/UI audit batch.
- Started Batch #138 public info route SEO on `codex/batch-138-public-info-route-seo`.
- Audited public info/legal trust routes and found they still used generic global site metadata instead of route-owned SEO despite serving buyer trust, legal and partner-diligence jobs.
- Implemented Batch #138:
  - `InfoPageLayout` now applies localized route-owned title, description, canonical URL, OG/Twitter metadata and WebPage JSON-LD;
  - `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/gdpr`, `/anti-fraud`, `/careers`, `/press` and `/partners` pass existing localized intro copy and canonical paths through the shared layout;
  - `src/pages/InfoPageSeo.test.tsx` guards route-owned metadata and JSON-LD;
  - `e2e/public-info-route-seo.spec.ts` covers all 10 routes at 390px plus RU direct entry;
  - `package.json` wires the dedicated and full smoke scripts;
  - `docs/backend/production-scale-baseline.md` contains the Batch #138 10,000 concurrent-user capacity note.
- Confirmed Batch #138 local validation:
  - `npx vitest run src/pages/InfoPageSeo.test.tsx src/i18n/locale-document-meta-ru.test.tsx` passed, 14 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:public-info-route-seo` passed, 11 tests after production build;
  - `npm run smoke:e2e:public-cta-semantics:run` passed, 12 tests;
  - `npm run smoke:e2e:public-landmark-labels:run` passed, 39 tests;
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 261 tests.
- Batch #138 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB gzip; entry 355.53 kB / 114.18 kB gzip; i18n-translations 340.35 kB / 106.73 kB gzip; InfoPageLayout 2.13 kB / 1.13 kB gzip.
- Committed Batch #138 as `2e302df`, `[codex] Batch #138 public info route SEO`.
- Pushed branch `codex/batch-138-public-info-route-seo` to `origin`.
- Opened draft PR #190: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/190`.
- GitHub `Core Type And Build Gate` passed on PR #190 in 12m42s.
- Marked PR #190 ready and squash-merged it to `main` as `7eea5ce`,
  `[codex] Batch #138 public info route SEO`.
- Added `docs/project-memory/PROMPTS/prompt-138-lovable-sync.md` and updated
  project memory to point the next action at Lovable sync for Batch #138.
- User confirmed Lovable sync for Batch #138 is clean:
  - GitHub commit synced to `main` @ Batch #138, PR #190, `7eea5ce` or newer;
  - checked `src/components/InfoPageLayout.tsx`, all 10 info/legal pages,
    `src/pages/InfoPageSeo.test.tsx`,
    `src/i18n/locale-document-meta-ru.test.tsx`,
    `e2e/public-info-route-seo.spec.ts`, `package.json` and
    `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no files were modified in Lovable;
  - route-owned SEO sets localized `{title} | YORSO`, canonical paths,
    localized descriptions, OG/Twitter metadata and one info-page JSON-LD
    script;
  - `/about` uses `AboutPage`, `/contact` uses `ContactPage`, and the other
    info/legal routes use `WebPage`;
  - RU direct entry on `/anti-fraud` uses localized RU route metadata and
    `og:locale=ru_RU`;
  - `Back to homepage` remains a single direct link, nested controls are absent,
    390px overflow is absent, Batch #112 code splitting, Batch #113 route chunk
    error boundary and Batches #110-#137 safeguards are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict
    mode and Browserslist data stale.
- Recorded Batch #138 Lovable sync in project memory and moved next action to
  the next scoped public UX/UI audit batch.
- Started Batch #139 on `codex/batch-139-public-language-selector-a11y`.
- Ran scoped public UX/UI audit with buyer-first multilingual lens on the public
  header language selector.
- Found language selector a11y gaps:
  - desktop selector exposed abbreviated visible text like `EN` without a
    localized programmatic purpose;
  - mobile language chips did not expose selected-language state.
- Implemented Batch #139 public language selector a11y hardening:
  - `src/components/landing/Header.tsx` adds localized language selector,
    current-language and select-language names;
  - desktop selector exposes `aria-label`, `aria-expanded`, `aria-controls` and
    `aria-haspopup`;
  - desktop and mobile language option groups are named and each option exposes
    `aria-pressed`;
  - `src/i18n/translations.ts` adds EN/RU/ES selector/current/select labels;
  - `src/components/landing/Header.landmarks.test.tsx` covers EN/RU/ES desktop
    and mobile language selector labels;
  - `src/i18n/aria-tooltips-localized.ru.test.tsx` guards RU header labels
    against English leakage;
  - `e2e/public-language-selector-a11y.spec.ts` covers desktop and mobile
    selector behavior, localStorage persistence, nested controls and 390px
    overflow;
  - `package.json` wires the dedicated and full e2e smoke scripts;
  - `docs/backend/production-scale-baseline.md` contains the Batch #139
    10,000 concurrent-user note.
- Confirmed Batch #139 local validation:
  - `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx` passed, 13 tests;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:public-language-selector-a11y` passed, 10 tests after production build;
  - `npm run smoke:e2e:public-landmark-labels:run` passed, 39 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 271 tests.
- Batch #139 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB
  gzip; entry 355.53 kB / 114.16 kB gzip; i18n-translations 340.69 kB /
  106.86 kB gzip; Header 50.30 kB / 14.14 kB gzip.
- Batch #139 preserves visible header layout, route structure,
  `localStorage["yorso-lang"]`, public route SEO, access gating, supplier
  identity redaction, exact-price lock, Batch #112 code splitting, Batch #113
  route chunk error boundary and Batches #110-#138 public UX/a11y safeguards.
- Committed Batch #139 on the branch as
  `[codex] Batch #139 public language selector a11y`.
- Pushed branch `codex/batch-139-public-language-selector-a11y` to `origin`.
- Opened draft PR #191:
  `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/191`.
- GitHub `Core Type And Build Gate` passed on PR #191 in 12m27s.
- Marked PR #191 ready and squash-merged it to `main` as `6721b65`,
  `[codex] Batch #139 public language selector a11y`.
- Added `docs/project-memory/PROMPTS/prompt-139-lovable-sync.md` and updated
  project memory to point the next action at Lovable sync for Batch #139.
- User confirmed Lovable sync for Batch #139 is clean:
  - GitHub commit synced to `main` @ Batch #139, PR #191, `6721b65` or newer;
  - checked `src/components/landing/Header.tsx`,
    `src/i18n/translations.ts`,
    `src/components/landing/Header.landmarks.test.tsx`,
    `src/i18n/aria-tooltips-localized.ru.test.tsx`,
    `e2e/public-language-selector-a11y.spec.ts`, `package.json` and
    `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no files were modified in Lovable;
  - EN/RU/ES selector/current/select labels are present;
  - desktop selector exposes localized `aria-label`, `aria-expanded`,
    `aria-haspopup`, `aria-controls`, and desktop dropdown/options expose group
    naming plus `aria-pressed`;
  - mobile language chips expose localized group naming and `aria-pressed`;
  - visible header layout, navigation destinations and
    `localStorage["yorso-lang"]` are unchanged;
  - public routes keep zero nested controls and zero 390px overflow across the
    checked routes;
  - public SEO, access gating, supplier identity redaction, exact-price locks,
    Batch #112 code splitting, Batch #113 route chunk error boundary and
    Batches #110-#138 safeguards are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict
    mode and Browserslist data stale.
- Recorded Batch #139 Lovable sync in project memory and moved next action to
  the next scoped public UX/UI audit batch.
- Started Batch #140 on `codex/batch-140-public-account-menu-a11y`.
- Ran scoped public UX/UI audit with signed-in buyer header lens.
- Found signed-in account menu a11y gaps:
  - desktop account chip exposed only buyer display name/email without a
    localized menu purpose;
  - desktop dropdown was not associated through `aria-controls` and did not
    expose a named group;
  - mobile signed-in account panel did not expose localized account-menu
    context as a named group.
- Implemented Batch #140 public account menu a11y hardening:
  - `src/components/landing/Header.tsx` adds localized account-menu and
    current-account labels;
  - desktop account chip exposes localized `aria-label`, `aria-expanded`,
    `aria-haspopup` and `aria-controls`;
  - desktop account dropdown and mobile signed-in account panel expose named
    groups;
  - `src/i18n/translations.ts` adds EN/RU/ES account menu/current account
    labels;
  - `src/components/landing/Header.landmarks.test.tsx` covers EN/RU/ES signed-in
    desktop and mobile account-menu labels;
  - `src/i18n/aria-tooltips-localized.ru.test.tsx` guards RU signed-in account
    labels against English leakage;
  - `e2e/public-account-menu-a11y.spec.ts` covers desktop and mobile signed-in
    account menu behavior, nested controls and 390px overflow;
  - `package.json` wires the dedicated and full e2e smoke scripts;
  - `docs/backend/production-scale-baseline.md` contains the Batch #140
    10,000 concurrent-user note.
- Confirmed Batch #140 local validation:
  - `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx` passed, 17 tests;
  - `npm run check:production-scale-baseline` passed;
  - `npm run smoke:e2e:public-account-menu-a11y` passed, 9 tests after production build;
  - `npm run smoke:e2e:public-language-selector-a11y:run` passed, 10 tests;
  - `npm run smoke:e2e:public-landmark-labels:run` passed, 39 tests;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:run` passed, 280 tests.
- Batch #140 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB
  gzip; entry 355.53 kB / 114.17 kB gzip; i18n-translations 340.92 kB /
  106.94 kB gzip; Header 50.54 kB / 14.20 kB gzip.
- Batch #140 preserves visible header layout, account destinations, session
  storage contract, route structure, public SEO, access gating, supplier
  identity redaction, exact-price lock, Batch #112 code splitting, Batch #113
  route chunk error boundary and Batches #110-#139 public UX/a11y safeguards.
- Committed Batch #140 implementation as `ea0880d`,
  `[codex] Batch #140 public account menu a11y`.
- Pushed branch `codex/batch-140-public-account-menu-a11y` to `origin`.
- Opened draft PR #192:
  `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/192`.
- Updated project memory to point the next action at GitHub validation for
  Batch #140.
- Marked PR #192 ready after GitHub reported checks only after ready-for-review.
- GitHub `Core Type And Build Gate` passed on PR #192 in 12m54s.
- Squash-merged PR #192 to `main` as `8ad19a6`,
  `[codex] Batch #140 public account menu a11y`.
- Added `docs/project-memory/PROMPTS/prompt-140-lovable-sync.md` and updated
  project memory to make Lovable sync the next action.
- User confirmed Lovable sync for Batch #140 is clean:
  - GitHub commit synced to `main` @ Batch #140, PR #192, `8ad19a6` or newer;
  - checked `src/components/landing/Header.tsx`,
    `src/i18n/translations.ts`,
    `src/components/landing/Header.landmarks.test.tsx`,
    `src/i18n/aria-tooltips-localized.ru.test.tsx`,
    `e2e/public-account-menu-a11y.spec.ts`, `package.json` and
    `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no local changes were present;
  - EN/RU/ES account-menu/current-account labels are present;
  - desktop account chip exposes localized `aria-label`, `aria-expanded`,
    `aria-haspopup` and `aria-controls`;
  - desktop dropdown exposes stable `id`, `role="group"` and localized
    `aria-label`;
  - mobile signed-in panel exposes `role="group"` with localized account
    context;
  - account link `/account`, sign-out behavior, visible layout, destinations
    and storage are unchanged;
  - E2E covers desktop chip naming/expanded/aria-controls/group naming/account
    link/sign-out, EN/RU/ES mobile panel and signed-in mobile stability on `/`,
    `/offers`, `/suppliers`, `/about`, `/blog`;
  - zero nested controls and zero 390px overflow are preserved;
  - public SEO, access gating, supplier identity redaction, exact-price locks,
    Batch #112 code splitting, Batch #113 route chunk error boundary and
    Batches #110-#139 safeguards are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict
    mode and Browserslist data stale.
- Recorded Batch #140 Lovable sync in project memory and moved next action to
  the next scoped public UX/UI audit batch.
- Started Batch #141 on `codex/batch-141-public-sheet-close-a11y`.
- Ran scoped public UX/UI audit with shared catalog drawer a11y lens.
- Found shared sheet close locale gap:
  - `src/components/ui/sheet.tsx` hardcoded the default close accessible name
    as `Close`;
  - public catalog drawer usages in `CompareTray` and `IntelligenceRail` did
    not pass a localized close label, so RU/ES sheet states could expose
    English programmatic copy.
- Implemented Batch #141 public sheet close locale a11y hardening:
  - `SheetContent` now accepts optional `closeLabel` while preserving the
    existing English fallback;
  - `CompareTray` and `IntelligenceRail` pass active-locale `t.aria_close`;
  - `src/components/catalog/SheetCloseLocale.test.tsx` covers RU/ES CompareTray
    and IntelligenceRail sheet close labels and no default English `Close`
    leakage;
  - `e2e/public-sheet-close-locale-a11y.spec.ts` opens the real `/offers`
    comparison drawer in RU/ES and checks localized close names, locked-buyer
    state, no nested controls and no horizontal overflow;
  - `package.json` wires the dedicated and full e2e smoke scripts;
  - `docs/backend/production-scale-baseline.md` contains the Batch #141
    10,000 concurrent-user note.
- Confirmed Batch #141 local validation:
  - `npx vitest run src/components/catalog/SheetCloseLocale.test.tsx` passed, 4 tests;
  - `npm run smoke:e2e:public-sheet-close-locale-a11y` passed, 2 tests after production build;
  - `npm run check:production-scale-baseline` passed;
  - `npx tsc -b --noEmit` passed;
  - `npm run lint` passed;
  - `git diff --check` passed;
  - `npm run smoke:e2e:public-account-menu-a11y:run` passed, 9 tests;
  - `npm run smoke:e2e:public-language-selector-a11y:run` passed, 10 tests;
  - `npm run smoke:e2e:run` passed, 282 tests.
- Batch #141 build metrics from dedicated smoke: CSS 126.84 kB / 21.02 kB
  gzip; entry 355.53 kB / 114.15 kB gzip; i18n-translations 340.92 kB /
  106.94 kB gzip; Offers 72.56 kB / 18.74 kB gzip.
- Batch #141 preserves visible catalog drawer layout, compare behavior, route
  structure, public SEO, access gating, supplier identity redaction, exact-price
  lock, Batch #112 code splitting, Batch #113 route chunk error boundary and
  Batches #110-#140 public UX/a11y safeguards.
- Committed Batch #141 implementation as `5160cde`,
  `[codex] Batch #141 public sheet close locale a11y`.
- Pushed branch `codex/batch-141-public-sheet-close-a11y` to `origin`.
- Opened PR #193:
  `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/193`.
- GitHub `Core Type And Build Gate` passed on PR #193 in 13m19s.
- Squash-merged PR #193 to `main` as `5eafcb7`,
  `[codex] Batch #141 public sheet close locale a11y`.
- Added `docs/project-memory/PROMPTS/prompt-141-lovable-sync.md` and updated
  project memory to make Lovable sync the next action.
- User confirmed Lovable sync for Batch #141 is clean:
  - GitHub commit synced to `main` @ Batch #141, PR #193, `5eafcb7` or newer;
  - checked `src/components/ui/sheet.tsx`,
    `src/components/catalog/CompareTray.tsx`,
    `src/components/catalog/IntelligenceRail.tsx`,
    `src/components/catalog/SheetCloseLocale.test.tsx`,
    `e2e/public-sheet-close-locale-a11y.spec.ts`, `package.json` and
    `docs/backend/production-scale-baseline.md`;
  - no conflicts were found and no local changes were present;
  - `SheetContent` accepts optional `closeLabel` with default `Close`;
  - `CompareTray` and `IntelligenceRail` pass `t.aria_close`;
  - RU/ES unit and e2e guards verify `Закрыть` / `Cerrar`, no English `Close`
    leakage, locked access state, zero nested controls and zero horizontal
    overflow;
  - visible `/offers` layout, compare tray behavior, signal drawer toggles,
    analytics, supplier identity redaction, access gating, exact-price locks,
    public SEO, route structure, language selector, `yorso-lang`, Batch #112
    code splitting, Batch #113 route chunk error boundary and Batches #110-#140
    safeguards are preserved;
  - known warnings remain Supabase generated types out of sync in non-strict
    mode and Browserslist data stale.
- Recorded Batch #141 Lovable sync in project memory and moved next action to
  the next scoped public UX/UI audit batch.

## 2026-05-27

- Closed Backend Phase 0 as a documented closure audit, not as a fully green
  suite.
- Added `docs/backend/phase-0-closure-audit.md` with Phase 0 exit criteria,
  gate results, route-contract status and explicit known test failures.
- Updated `docs/backend/frontend-backend-contract.md` from draft status to a
  Phase 0 closure-audited contract and expanded the active route map to cover
  current `src/App.tsx` public, info/legal, account, dashboard, admin, redirect,
  dev and `*` routes.
- Phase 0 validation run:
  - `npm run lint` passed;
  - `npm run build` passed with known non-blocking Supabase generated type and
    Browserslist warnings;
  - `npm run contracts:build` passed;
  - `npm test` failed and was documented as known failures: 18 failed tests,
    1250 passed, 2 skipped.
- Moved next action from another public UX/UI audit batch to focused Phase 0
  remediation before Backend Phase 1 Account Source Of Truth.

## 2026-05-27

- Completed the focused Backend Phase 0 remediation pass.
- Updated stale RU/i18n tests for current homepage offer cards, `/offers`
  catalog copy, footer anchors, NotFound title contract, semantic registration
  links and locked/qualified catalog states.
- Pinned sign-in locale persistence tests to the local auth contract by stubbing
  self-hosted/Supabase auth env values during those unit renders.
- Wrapped registration funnel e2e coverage in `BuyerSessionProvider`.
- Localized qualified catalog exact-price rendering through active-locale
  `formatPrice` in row, desktop card and mobile card surfaces.
- Localized catalog category filter labels while preserving the same filter
  values and URL contract.
- Bounded Supabase-backed public access smoke handling so transient Supabase
  network failures are warnings, while `42501` insufficient privilege remains a
  hard failure.
- Confirmed Phase 0 remediation validation:
  - focused remediation Vitest suite passed: 12 files, 67 tests;
  - `src/test/offer-detail-access.test.ts` plus
    `src/test/rls-public-access.test.ts` passed: 11 tests;
  - `npm test` passed: 184 files, 1268 tests, 2 skipped;
  - `npm run lint` passed;
  - `npm run contracts:build` passed;
  - `npm run build` passed with known non-blocking Supabase generated type and
    Browserslist warnings.
- Updated Phase 0 status to closed with green gates and moved next action to
  Backend Phase 1: Account Source Of Truth.

## 2026-05-28

- Recorded the user-provided Lovable sync report for Phase 0 Remediation commit
  `dc5ab55` in `docs/project-memory/LOVABLE_PROGRESS.md`.
- Locally checked the commit history and Phase 0 audit docs; did not rerun the
  full Phase 0 gate commands, so the tracker marks those results as previous
  validation/documented status rather than a fresh local run.

## 2026-05-28

- Added `docs/project-memory/LOVABLE_PROGRESS.md` as the Russian-language
  plan/fact tracker for every Lovable prompt and Lovable sync response.
- Established the required future batch summary table:
  `План`, `Факт / проверено`, `Будет реализовано`, `Статус точности`.
- Added the first tracker row for Batch #141 using the user-provided Lovable
  sync report and local file checks; runtime/e2e pass counts are explicitly
  marked as previous validation/Lovable-reported, not newly rerun.

## 2026-05-28

- Completed Backend Phase 1 Account Source Of Truth discovery/audit.
- Added `docs/backend/phase-1-account-source-of-truth-discovery-audit.md`.
- Confirmed backend strengths:
  - self-hosted auth/session endpoints exist;
  - protected account routes validate `x-yorso-session-id` through the auth
    service before trusting `x-yorso-user-id`;
  - account/company/workspace contracts exist in `packages/contracts`;
  - PostgreSQL migrations cover users, companies, workspace collections,
    files/documents, auth sessions and auth security events;
  - production config requires PostgreSQL, Redis auth backpressure, Redis
    session cache, fail-closed auth/session modes and observability.
- Confirmed Phase 1 gap:
  - `/account/*` still initializes from localStorage/mock account profile;
  - API hydration runs after local render;
  - account edits save localStorage before remote sync;
  - account shell access is gated by sessionStorage buyer session rather than
    required `/v1/auth/session` validation.
- Defined next implementation scope as Backend Phase 1A: Account Session
  Authority Gate.
- Updated project memory so the next action is Phase 1A, not another public
  UX/UI batch.

## 2026-05-28

- Implemented Backend Phase 1A: Account Session Authority Gate.
- Changed `src/pages/account/Account.tsx` so API-enabled `/account/*`:
  - validates the current browser session with `readCurrentAuthSession()`
    before rendering editable account sections;
  - uses `createAccountApiClient({ userId: session.userId, sessionId:
    session.id })` for backend account hydration and save calls;
  - redirects missing/invalid sessions to `/signin` after clearing
    `buyerSession`;
  - shows `account-backend-unavailable` and keeps editable sections closed if
    backend account load fails;
  - updates UI after backend save success in API-enabled mode instead of
    writing localStorage first.
- Changed `src/components/account/AccountShell.tsx` so the account note reflects
  backend source mode vs local prototype mode.
- Added EN/RU/ES account loading, backend-unavailable, backend-source and
  remote-save-failed copy to `src/i18n/translations.ts`.
- Added `docs/backend/phase-1-account-session-authority-gate.md`.
- Added the Phase 1A 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Added account tests for backend session validation, backend profile
  authority, missing-session redirect, backend-unavailable fail-closed state and
  remote-first save headers/localStorage behavior.
- Targeted validation passed:
  - `npx vitest run src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-api.test.ts src/lib/auth-runtime.test.ts`;
  - 4 files passed;
  - 51 tests passed.
- Additional validation passed:
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run api:build`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-CSSVMLIT.js` 109.62 kB / 25.11 kB gzip.
- Known non-blocking warnings preserved:
  - React Router v7 future flag warnings in existing test harness;
  - existing `act(...)` warnings in legacy account editable tests.

## 2026-05-28

- Implemented Backend Phase 1G: Account Storage Transaction Boundary.
- Added `docs/backend/phase-1-account-storage-transaction-boundary.md` with a
  Russian plan/fact table, explicit outbox decision and 10,000 concurrent-user
  review.
- Added `deleteObject` to the object storage contract and local storage driver.
- Added `createCompanyDocumentWithFileAsset` and `deleteFileAssetForUser` to
  the file repository contract.
- Updated PostgreSQL document upload metadata to write `yorso_file_assets` and
  `yorso_company_documents` in one atomic CTE statement.
- Updated file service upload paths to delete object bytes if metadata
  persistence fails after object write.
- Updated media upload route to clean up the newly created asset/object if
  company profile media update fails after file asset creation.
- Deferred outbox table/queue intentionally because current account storage
  processing is synchronous and has no async worker, retry policy or operator
  status surface.
- Added storage tests for atomic document metadata SQL and object cleanup after
  metadata failure.
- Added the Phase 1G 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - 1 file passed;
  - 6 tests passed;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - 3 files passed;
  - 86 tests passed;
  - `npx tsc -b --noEmit`.
- Full release validation passed:
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run api:build`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

## 2026-05-28

- Implemented Backend Phase 1H: Account Workspace Replace Transaction
  Boundary.
- Added `docs/backend/phase-1-account-workspace-replace-transaction-boundary.md`
  with a Russian plan/fact table and 10,000 concurrent-user review.
- Updated `PostgresAccountRepository.replaceBranches`,
  `replaceProducts`, `replaceMetaRegions` and `replaceNotifications` so each
  bulk replacement runs as one atomic PostgreSQL CTE statement with `input`,
  `deleted`, `touched` and `insert ... returning`.
- Preserved route paths, request payloads and response contracts.
- Updated repository test fake PostgreSQL client to support CTE replacements.
- Added repository assertions that all four bulk replacement paths use the CTE
  shape with `deleted` and `touched`.
- Added the Phase 1H 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts`;
  - 1 file passed;
  - 17 tests passed;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - 3 files passed;
  - 86 tests passed;
  - `npx tsc -b --noEmit`.
- Full release validation passed:
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run api:build`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

## 2026-05-28

- Implemented Backend Phase 1D: Account Strict Precondition Policy.
- Added API config flag `ACCOUNT_VERSION_PRECONDITION_MODE=optional|required`.
- Kept local/dev/test default as `optional` for compatibility.
- Added production self-hosted runtime guard requiring
  `ACCOUNT_VERSION_PRECONDITION_MODE=required`.
- Updated account route handling so strict mode rejects normal `/v1/account/*`
  mutations without `x-yorso-account-version` as
  `428 account_version_required`.
- Preserved Phase 1C stale-write behavior:
  `409 account_snapshot_conflict` when a supplied account version is stale.
- Added strict-mode API regression and production config guard coverage in
  `apps/api/src/server.test.ts`.
- Added `docs/backend/phase-1-account-strict-precondition-policy.md`.
- Added the Phase 1D 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`;
  - 2 API files passed;
  - 79 tests passed;
  - `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
  - 2 frontend files passed;
  - 37 tests passed.
- Full release validation passed:
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run api:build`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict mode;
  - Browserslist data stale;
  - existing React Router v7 future flag and `act(...)` warnings.

## 2026-05-28

- Implemented Backend Phase 1F: Account Storage Client Authority Boundary.
- Updated `src/lib/account-api.ts` so enabled self-hosted account API calls no
  longer use `DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID` when no explicit,
  buyer-session or configured account user id exists.
- Added fail-closed behavior:
  - missing account user in enabled mode throws `account_api_session_required`
    before fetch;
  - disabled local prototype mode keeps the previous local fallback behavior.
- Updated `CompanyDocumentsCard` to accept an account API client from its parent.
- Updated `/account/company` to pass the validated session-bound client into
  company documents, keeping document list/create on the same account authority
  as company profile and media writes.
- Added `docs/backend/phase-1-account-storage-client-authority-boundary.md`.
- Added the Phase 1F 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`;
  - 3 files passed;
  - 52 tests passed.
- Full release validation passed:
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict mode;
  - Browserslist data stale;
  - React Router v7 future flag warnings;
  - existing `act(...)` warnings in account editable tests.

## 2026-05-28

- Implemented Backend Phase 1E: Account Media/Document Version Boundary.
- Added shared `apps/api/src/modules/account/version-precondition.ts` for
  `x-yorso-account-version` parsing and strict missing-header enforcement.
- Updated account routes to use the shared precondition helper.
- Updated storage routes so:
  - `GET /v1/account/documents` returns `accountVersion`;
  - `POST /v1/account/documents` checks the account version precondition,
    returns `428 account_version_required` when strict mode requires a header,
    returns `409 account_snapshot_conflict` for stale headers and returns a
    refreshed `accountVersion` after success;
  - `POST /v1/account/company/media/logo|cover` follows the same strict/stale
    precondition contract and returns refreshed `accountVersion`.
- Updated account version sources:
  - PostgreSQL account version now includes `yorso_file_assets.created_at` and
    `yorso_company_documents.updated_at`;
  - memory repository exposes `touchAccountVersion` so storage mutations can
    bump account snapshot version.
- Updated frontend account API storage response types to include
  `accountVersion`.
- Updated `src/lib/account-api.test.ts` so document create sends the version
  learned from document list.
- Added strict storage regression coverage to `apps/api/src/server.test.ts`.
- Added `docs/backend/phase-1-account-media-document-version-boundary.md`.
- Added the Phase 1E 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts`;
  - 2 API files passed;
  - 80 tests passed;
  - `npx vitest run src/lib/account-api.test.ts`;
  - 1 frontend file passed;
  - 16 tests passed;
  - `npx tsc -b --noEmit`.
- Full release validation passed:
  - `npm run contracts:build`;
  - API repository/server tests: 2 files passed, 80 tests passed;
  - frontend account API/editable tests: 2 files passed, 37 tests passed;
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run api:build`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict mode;
  - Browserslist data stale;
  - existing React Router v7 future flag and `act(...)` warnings in focused
    frontend tests.

## 2026-05-28

- Implemented Backend Phase 1C: Account Conflict Version Handling.
- Added account snapshot version support to account repositories:
  - `MemoryAccountRepository` keeps a monotonic account version and bumps it on
    user, company and workspace mutations;
  - `PostgresAccountRepository` computes account version from max `updated_at`
    across user, company, media, workspace collection and notification tables;
  - PostgreSQL collection replacements touch the parent company/user row so
    deletes and empty replacements advance the version.
- Updated account routes so account responses include `accountVersion`.
- Added stale mutation protection: when a current frontend write sends stale
  `x-yorso-account-version`, backend returns `409 account_snapshot_conflict`.
- Kept missing version headers accepted for backward compatibility with legacy
  clients until a later strict precondition-required decision.
- Updated `src/lib/account-api.ts` so the frontend remembers
  `accountVersion`, sends `x-yorso-account-version` on writes, runs full save
  and row-level collection sync sequentially, and rethrows
  `AccountApiConflictError`.
- Updated `/account/*` UI so stale saves keep the edited card open, show inline
  conflict copy and render a reloadable `account-save-conflict` banner.
- Added EN/RU/ES conflict copy to `src/i18n/translations.ts`.
- Added `docs/backend/phase-1-account-conflict-version-handling.md`.
- Added the Phase 1C 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`;
  - 2 API files passed;
  - 77 tests passed;
  - `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
  - 2 frontend files passed;
  - 37 tests passed;
  - `npx tsc -b --noEmit`.
- Full release validation passed:
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip.

## 2026-05-28

- Implemented Backend Phase 1B: Account Section-Scoped Mutations.
- Replaced API-mode `/account/*` broad six-endpoint save for normal edits with
  section-scoped account mutations.
- Added `syncAccountProfileSectionToApi` in `src/lib/account-api.ts` with
  section keys for `personal`, `company`, `branches`, `products`,
  `meta-regions` and `notifications`.
- Wired `src/pages/account/Account.tsx` so each account section passes its
  section ownership into API-mode save.
- Updated branch, product, meta-region and notification form saves to wait for
  backend success before closing and show `account_remoteSaveFailed` inline on
  backend failure.
- Added endpoint-granularity tests for personal, company, branch, product,
  meta-region and notification section sync.
- Added API-mode UI coverage for a personal scoped save and a row-level branch
  create.
- Added `docs/backend/phase-1-account-section-scoped-mutations.md`.
- Added the Phase 1B 10,000 concurrent-user capacity note to
  `docs/backend/production-scale-baseline.md`.
- Targeted validation passed:
  - `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/auth-runtime.test.ts`;
  - 4 files passed;
  - 56 tests passed.
- Focused changed-file validation passed:
  - `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
  - 2 files passed;
  - 34 tests passed.
- Additional validation passed:
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-4Y7df4zk.js` 111.70 kB / 25.36 kB gzip.
- Known non-blocking warnings preserved:
  - React Router v7 future flag warnings in existing test harness;
  - existing `act(...)` warnings in legacy account editable tests.

## 2026-05-29

- Started Backend Phase 1I: Account Workspace Aggregate Read.
- Added shared `accountWorkspaceSnapshotSchema` and `AccountWorkspaceSnapshot`.
- Added authenticated `GET /v1/account/workspace` returning user, company, branches, products, metaRegions, notifications, accountVersion and requestId.
- Added `getWorkspaceSnapshot` to account service/repository boundaries.
- Implemented PostgreSQL workspace snapshot as one scoped SQL query with JSON aggregation and account-version calculation.
- Updated `src/lib/account-api.ts` so self-hosted account hydration calls `/v1/account/workspace` instead of six account section endpoints.
- Updated API repository/server and frontend account tests for the aggregate read path.
- Added `docs/backend/phase-1-account-workspace-aggregate-read.md` and production-scale baseline notes.
- Targeted validation passed:
  - `npm run contracts:build`;
  - `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`;
  - 3 frontend files passed;
  - 52 tests passed;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`;
  - 2 API files passed;
  - 83 tests passed;
  - `npx tsc -b --noEmit`.
- Full release validation passed:
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `git diff --check`;
  - `npm run api:build`;
  - `npm run build`.
- Production build metric:
  - Account route chunk `Account-CK-9-38I.js` 112.88 kB / 25.69 kB gzip.

## 2026-05-29

- Implemented Backend Phase 1J: Account Source Of Truth Closure Audit.
- Added `docs/backend/phase-1-account-source-of-truth-closure-audit.md` with:
  - Russian plan/fact table;
  - Phase 1 exit criteria status;
  - Phase 1A-1I implementation map;
  - explicit self-contained production boundary for account runtime;
  - remaining product debt outside Phase 1;
  - 10,000 concurrent-user review.
- Updated `docs/backend/frontend-backend-contract.md` so `/account/*` maps to
  the self-hosted account workspace snapshot in API-enabled production, with
  localStorage/mock limited to API-disabled preview mode.
- Updated project-memory checkpoint files for Phase 1J.
- No production runtime code changed in Phase 1J.
- Validation passed:
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:production-scale-baseline`;
  - `npm run lint`;
  - `git diff --check`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2A: Registration-To-Account Source Of Truth.
- Added backend-owned registration draft persistence:
  - migration `0026_registration_account_source.sql`;
  - manifest and migration test updates;
  - draft indexes for email diagnostics and expired-draft cleanup.
- Added self-hosted `/v1/auth/register/*` route set:
  - start;
  - verify email;
  - details;
  - phone send;
  - phone verify;
  - onboarding;
  - markets;
  - complete.
- Added shared registration contracts in `packages/contracts/src/auth.ts`.
- Implemented registration completion against owned storage:
  - user;
  - auth credential;
  - company;
  - company media row;
  - roles;
  - notification defaults;
  - optional target-market meta-region;
  - auth session.
- Updated frontend registration API boundary:
  - API-enabled registration calls the self-hosted backend;
  - API-disabled Lovable/local preview keeps the mock flow;
  - self-hosted completion errors fail closed instead of creating a local
    pseudo-session.
- Updated `RegisterReady` so successful self-hosted completion stores the
  backend-issued session with `source: "self_hosted"`.
- Kept external email/SMS delivery out of scope; backend owns verification
  state and delivery/outbox remains a future self-hosted infrastructure
  decision.
- Added `docs/backend/phase-2a-registration-account-source-of-truth.md`.
- Updated `docs/backend/frontend-backend-contract.md` and
  `docs/backend/production-scale-baseline.md`.
- Validation passed:
  - `npm run contracts:build`;
  - `npx vitest run src/lib/api-contracts.registration.test.ts`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`;
  - `npx vitest run src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/lib/auth-runtime.test.ts`;
  - `npx tsc -b --noEmit`;
  - `npm run test:db-migrations`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 3A: Catalog Supabase Fallback Removal.
- Removed catalog Supabase prototype fallback from code:
  - deleted `src/lib/legacy-catalog-supabase-adapter.ts`;
  - removed `fetchLegacyCatalogOffers`, `fetchLegacyCatalogOfferById` and
    `SupplierPublicRow` from `src/lib/catalog-api.ts`;
  - `src/lib/catalog-api.ts` now delegates only to
    `createOfferCatalogApiClient().listOffers()` and `.getOfferById()`.
- Preserved catalog runtime behavior:
  - configured deployments use owned `/v1/offers` and `/v1/offers/:id`;
  - API-disabled preview uses local fixtures inside `offer-catalog-api`;
  - supplier identity redaction, exact-price lock and access shaping remain
    owned by existing catalog fallback helpers.
- Updated landing/source naming:
  - `useLandingOffers` source is now `catalog-api` / `mock-fallback`;
  - `live_offers_source_resolved` no longer emits `source: "supabase"`.
- Updated guards:
  - `src/lib/catalog-api.boundary.test.ts` asserts the removed adapter file
    stays absent and catalog-api is free of legacy fallback markers;
  - `scripts/check-self-hosted-api.mjs` and
    `scripts/check-production-scale-baseline.mjs` guard Phase 3A.
- Updated docs:
  - `docs/backend/phase-3a-catalog-supabase-fallback-removal.md`;
  - frontend/backend contract, production-scale baseline, self-hosted
    architecture/validation and backend implementation plan.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Catalog facade | Убрать runtime-путь `catalog-api` → legacy Supabase adapter. | Реализовано: facade вызывает только owned catalog API adapter. | Не возвращать `fetchLegacyCatalog*`. |
| Adapter file | Удалить catalog Supabase fallback. | Реализовано: `legacy-catalog-supabase-adapter.ts` удалён. | Guard blocks return. |
| Landing source | Убрать `supabase` source из landing offers. | Реализовано: `catalog-api` / `mock-fallback`. | Дашборды читать новый source. |
| Remaining debt | Сузить Supabase debt после Phase 3A. | Реализовано: остались supplier-access fallback, reference tooling/tests, empty env keys, dependency. | Phase 3B: supplier-access removal. |

- Validation passed:
  - `npx vitest run src/lib/catalog-api.boundary.test.ts src/lib/useLandingOffers.test.ts src/components/landing/LiveOffers.highlight.test.tsx src/components/landing/offers-anchor.test.tsx src/components/landing/offers-highlight-focus.test.tsx src/components/landing/LiveOffers.empty-fallback.test.tsx`;
  - `npm run test:offer-catalog-frontend`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:supabase-boundary`;
  - `npx tsc -b --noEmit`;
  - `npm run test:api`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run smoke:self-hosted-offer-detail:run`;
  - `git diff --check`;
  - `npm run build`;
  - `npm run smoke:e2e:frontend-no-supabase-env`.
- Commit: `b5d1e9f8` (`[codex] Backend Phase 3A catalog fallback removal`).
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2G: Password Recovery Delivery Runtime.
- Added password recovery delivery processing:
  - `PasswordRecoveryDeliveryWorker`;
  - `PasswordRecoveryDeliveryScheduler`;
  - `createPasswordRecoveryDeliveryRuntime`;
  - `FileSpoolPasswordRecoverySender`.
- Added memory and PostgreSQL repository support:
  - `leasePasswordRecoveryDeliveryJobs`;
  - `markPasswordRecoveryDeliverySent`;
  - `markPasswordRecoveryDeliveryFailed`.
- PostgreSQL leasing uses bounded ordered `for update skip locked` candidates
  and excludes expired or already used recovery tokens before delivery.
- File-spool handoff writes one `0600` JSON file per sent recovery delivery:
  - delivery id;
  - recovery id;
  - backend-only destination;
  - masked destination preview;
  - reset URL;
  - recovery token for owned operator/channel handoff;
  - no provider credentials or hosted BaaS metadata.
- Sender failure errors redact email, phone and password-recovery-token shaped
  values before persistence.
- `createApiServer` now starts/stops the password recovery delivery scheduler
  with the HTTP server lifecycle when
  `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_ENABLED=true`.
- Added production fail-closed configuration:
  - `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_ENABLED=true`;
  - `YORSO_PASSWORD_RECOVERY_DELIVERY_SENDER=file_spool`;
  - absolute `YORSO_PASSWORD_RECOVERY_DELIVERY_SPOOL_DIR`.
- Added password recovery delivery worker metrics without email, destination,
  recovery id or reset-token labels.
- Updated `.env.example`, `.env.production.example`, `infra/docker-compose.yml`,
  self-hosted guard scripts, backend docs, production-scale baseline,
  frontend/backend contract and deployment docs.
- Kept out of scope:
  - hosted email provider integration;
  - public UI changes;
  - password policy/KDF changes;
  - expired token cleanup/retention job.
- Validation passed:
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-delivery-worker.test.ts apps/api/src/modules/auth/password-recovery-delivery-sender.test.ts apps/api/src/modules/auth/password-recovery-delivery-runtime.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`;
  - `npx tsc -b --noEmit`;
  - `npm run test:db-migrations`;
  - `npm run check:self-hosted-db`;
  - `npm run check:self-hosted-infra`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run test:api`;
  - `npm run lint`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.
- Committed Backend Phase 2G implementation locally as `9485bd36`
  (`[codex] Backend Phase 2G password recovery delivery runtime`).

- Corrected the stale Phase 2E project-memory status: Phase 2E is committed
  locally at `c1afa712` and preserved.
- Implemented Backend Phase 2F: Password Recovery Source Of Truth.
- Added owned self-hosted password reset endpoints:
  - `POST /v1/auth/password-reset/request`;
  - `POST /v1/auth/password-reset/complete`.
- Added reset request privacy behavior:
  - known and unknown accounts receive the same public success shape;
  - public responses do not expose reset tokens or raw emails.
- Added `PasswordRecoveryTokenIssuer` and backend-only token codec:
  - deterministic token lookup hash;
  - salted token secret;
  - AES-GCM sealed handoff material for backend outbox use.
- Added migration `0029_auth_password_recovery`:
  - `yorso_auth_password_recovery_tokens`;
  - `yorso_auth_password_recovery_outbox`;
  - active-expiry and outbox-ready indexes for bounded scans/worker leasing.
- Updated memory and PostgreSQL auth repositories:
  - create and read password recovery records;
  - complete recovery by updating `yorso_auth_credentials`;
  - revoke/delete sessions for the reset user.
- Updated `AuthService`:
  - validates token hash/secret/expiry/used state;
  - records password-reset security events;
  - deletes session-cache entries for revoked sessions.
- Updated `src/lib/auth-runtime.ts`:
  - self-hosted reset request uses `/v1/auth/password-reset/request`;
  - self-hosted reset completion reads token from `?token=` or `#token=`;
  - Supabase recovery remains prototype fallback only when self-hosted API is
    disabled.
- Updated `docs/backend/phase-2f-password-recovery-source-of-truth.md`,
  `docs/backend/production-scale-baseline.md`,
  `docs/backend/frontend-backend-contract.md` and self-hosted guard scripts.
- Validation passed:
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts`;
  - `npx vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts packages/db/src/migrator.test.ts packages/db/src/cli.test.ts src/test/self-hosted-db-contract.test.ts`;
  - `npm run check:self-hosted-db`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run test:db-migrations`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run lint`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.
- Committed Backend Phase 2F implementation locally as `4c2da272`
  (`[codex] Backend Phase 2F password recovery source`).
- Added a documentation-only project-memory checkpoint after the Phase 2F
  implementation commit so the next handoff starts from Backend Phase 2G
  instead of a stale "commit pending" state.

## 2026-05-29

- Implemented Backend Phase 2E: Registration Verification Code Policy.
- Added per-request OTP generation:
  - `RegistrationVerificationCodeIssuer` issues fresh numeric email/phone
    verification codes;
  - tests can inject deterministic codes without changing production behavior;
  - API-enabled backend no longer accepts the fixed prototype `123456` code.
- Added durable expiry and attempt policy:
  - migration `0028_registration_verification_code_policy.sql`;
  - `email_code_expires_at`, `phone_code_expires_at`;
  - `email_code_attempt_count`, `phone_code_attempt_count`;
  - `registration_code_expired` and `registration_rate_limited` handling.
- Added sealed backend-only delivery code handoff:
  - `verification_code_sealed` on `yorso_registration_delivery_outbox`;
  - AES-256-GCM codec using `YORSO_REGISTRATION_VERIFICATION_CODE_SECRET`;
  - Postgres worker decrypts only after leasing a delivery job;
  - file-spool handoff includes backend-only `verificationCode`.
- Preserved browser hygiene:
  - registration start and phone-send responses still include only masked
    delivery metadata;
  - tests assert generated codes are absent from public responses;
  - delivery sender failure errors redact email, phone and OTP-shaped values
    before persistence;
  - RegisterVerify prototype dev skip is available only in API-disabled local
    mock mode.
- Updated env examples, Docker Compose and guard scripts for
  `YORSO_REGISTRATION_VERIFICATION_CODE_SECRET`.
- Updated backend docs, production-scale baseline, frontend/backend contract and
  project-memory.
- Targeted validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/verification-code.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/server.test.ts`.
- Full release validation passed:
  - `npx tsc -b --noEmit`;
  - `npm run contracts:build`;
  - `npm run test:db-migrations`;
  - `npm run check:self-hosted-infra`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:self-hosted-api`;
  - `npx vitest run src/lib/api-contracts.registration.test.ts src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/i18n/locale-register-substeps-ru.test.tsx`;
  - `npm run lint`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2C: Registration Verification Worker Lease
  Processing.
- Added `RegistrationDeliveryWorker`:
  - leases bounded delivery outbox batches through the auth repository;
  - calls an injectable self-hosted delivery sender;
  - marks successful jobs `sent`;
  - requeues failed jobs until retry budget is exhausted;
  - marks exhausted jobs `failed`;
  - sanitizes sender error text before persistence.
- Extended memory and PostgreSQL auth repositories:
  - `leaseRegistrationDeliveryJobs`;
  - `markRegistrationDeliverySent`;
  - `markRegistrationDeliveryFailed`.
- Hardened PostgreSQL lease selection:
  - ordered `for update skip locked`;
  - `attempt_count < max_attempts`;
  - active registration draft required before lease;
  - expired/completed drafts are not claimed.
- Kept provider/runtime scope explicit:
  - no hosted email/SMS provider;
  - no Supabase function;
  - no always-on daemon/scheduler;
  - no public registration UI changes.
- Added worker tests for:
  - successful send;
  - retry and terminal failure;
  - expired draft skip;
  - phone/WhatsApp delivery channel.
- Added `docs/backend/phase-2c-registration-verification-worker-lease.md`.
- Updated `docs/backend/frontend-backend-contract.md`,
  `docs/backend/phase-2b-registration-verification-delivery-outbox.md` and
  `docs/backend/production-scale-baseline.md`.
- Validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts`;
  - `npx tsc -b --noEmit`;
  - `npm run contracts:build`;
  - `npm run test:db-migrations`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2B: Registration Verification Delivery Outbox.
- Added migration `0027_registration_verification_delivery_outbox.sql`:
  - `yorso_registration_delivery_outbox`;
  - purpose/channel/status fields;
  - destination hash and masked destination preview;
  - retry and worker lease fields;
  - ready, draft-recent and status-recent indexes.
- Updated registration auth contracts so start and phone-send responses can
  include delivery metadata.
- Updated self-hosted registration start:
  - creates the registration draft;
  - creates an email verification outbox row in the same PostgreSQL CTE;
  - returns only delivery id, purpose, channel, status and masked destination
    preview.
- Updated phone verification request:
  - updates phone verification state;
  - creates SMS/WhatsApp outbox row in the same PostgreSQL CTE;
  - does not return the verification code or full phone number.
- Updated memory auth runtime to mirror the delivery outbox contract for tests
  and local API runtime.
- Updated frontend API contract types and tests for delivery metadata.
- Updated `docs/backend/phase-2a-registration-account-source-of-truth.md`,
  `docs/backend/phase-2b-registration-verification-delivery-outbox.md`,
  `docs/backend/frontend-backend-contract.md` and
  `docs/backend/production-scale-baseline.md`.
- Validation passed:
  - `npm run contracts:build`;
  - `npx vitest run src/lib/api-contracts.registration.test.ts`;
  - `npm run test:db-migrations`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`;
  - `npx tsc -b --noEmit`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - `npm run lint`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2D: Registration Delivery Runtime.
- Added `FileSpoolRegistrationVerificationSender`:
  - writes one JSON handoff file per sent delivery job;
  - uses owned local spool storage;
  - writes files with mode `0600`;
  - includes delivery id, draft id, purpose, channel, destination,
    destination preview, template key and operator-readable text;
  - does not add provider credentials, Supabase functions or hosted SaaS
    delivery coupling.
- Added `RegistrationDeliveryScheduler`:
  - runs `RegistrationDeliveryWorker.processBatch` outside public request
    handlers;
  - passes bounded batch, lease and retry settings;
  - skips overlapping runs;
  - catches worker-level failures and emits metrics events.
- Added registration delivery runtime factory and server lifecycle wiring:
  - `createRegistrationDeliveryRuntime`;
  - scheduler starts on HTTP server `listening`;
  - scheduler stops on server `close`;
  - worker remains disabled by default outside explicit config.
- Added production fail-closed configuration:
  - `YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=true`;
  - `YORSO_REGISTRATION_DELIVERY_SENDER=file_spool`;
  - absolute `YORSO_REGISTRATION_DELIVERY_SPOOL_DIR`.
- Added worker metrics:
  - `yorso_api_registration_delivery_worker_runs_total`;
  - `yorso_api_registration_delivery_worker_jobs_total`;
  - no email, phone, destination or draft identifiers in metric labels.
- Updated env examples, Docker Compose spool volume and self-hosted guard
  scripts for the registration delivery runtime.
- Updated backend docs, production-scale baseline, frontend/backend contract,
  deployment docs and project-memory.
- Kept out of scope:
  - hosted SMTP/SMS/WhatsApp provider integration;
  - public registration UI changes;
  - changing OTP generation/verification policy.
- Validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`;
  - `npx tsc -b --noEmit`;
  - `npm run check:self-hosted-infra`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:self-hosted-api`;
  - `npm run contracts:build`;
  - `npm run test:db-migrations`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - `npm run lint`;
  - `npm run api:build`;
  - `git diff --check`;
  - `npm run build`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2H: Password Recovery Abuse-Control And Cleanup
  Policy.
- Added account-enumeration-safe password reset rate limiting:
  - `AuthRateLimiter` now has dedicated password reset check/record methods;
  - config adds `AUTH_PASSWORD_RESET_WINDOW_MS` and
    `AUTH_PASSWORD_RESET_MAX_REQUESTS`;
  - `requestPasswordReset` checks rate limit before account lookup;
  - known and unknown account requests keep the same public response shape until
    the shared rate limit is exceeded;
  - rate-limited responses return `auth_rate_limited` without email/account
    existence leakage.
- Added security/audit contract support:
  - `password_reset_rate_limited` security event type;
  - telemetry marker `auth.password_reset.rate_limited`;
  - no email, token or account-existence labels.
- Added password recovery cleanup policy:
  - `cleanupPasswordRecovery` repository method;
  - memory and PostgreSQL implementations;
  - `PasswordRecoveryCleanupWorker` with bounded retention cutoffs;
  - cleanup for expired/used reset tokens and terminal sent/failed/cancelled
    delivery rows.
- Added migration `0030_auth_password_recovery_abuse_cleanup.sql`:
  - password reset rate-limit security event type;
  - cleanup indexes for expired/used recovery tokens;
  - cleanup index for terminal recovery outbox rows.
- Updated env examples, Docker Compose, self-hosted guard scripts, runtime
  smoke, deployment docs, validation docs and production-scale baseline.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Rate limit | Защитить password reset от burst abuse без enumeration. | Реализовано и покрыто API/server тестами. | Наблюдать security event aggregates. |
| Cleanup | Удалять устаревшие token/outbox rows bounded batch'ами. | Реализовано repository + worker policy. | Phase 2I: подключить runtime/scheduler/CLI. |
| Self-hosted boundary | Не добавлять Supabase/BaaS/provider dependency. | Сохранено: только owned API, PostgreSQL, local runtime policy. | Продолжать тот же boundary. |

- Validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/rate-limit.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/rate-limit.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/modules/auth/observability.test.ts apps/api/src/server.test.ts -t "password reset|rate limiters|cleanup policy|auth observability"`;
  - `npm run contracts:build`;
  - `npm run test:db-migrations`;
  - `npm run check:self-hosted-db`;
  - `npm run check:self-hosted-infra`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run test:api`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run smoke:self-hosted-auth-api:run`;
  - `git diff --check`;
  - `npm run build`.
- Commit: `8a8ac50f` (`[codex] Backend Phase 2H password recovery abuse cleanup`).
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2I: Password Recovery Cleanup Runtime.
- Added `PasswordRecoveryCleanupScheduler`:
  - runs `PasswordRecoveryCleanupWorker.runOnce()` outside public request
    handlers;
  - skips overlapping runs with `already_running`;
  - emits success, failure and skipped events;
  - catches worker-level failures and lets the next interval retry.
- Added `createPasswordRecoveryCleanupRuntime`:
  - disabled by default for local/dev unless explicitly enabled;
  - wires cleanup interval, batch size, delivery retention, token retention and
    worker id from self-hosted config;
  - connects cleanup observations to the API metrics registry.
- Wired API server lifecycle:
  - starts cleanup scheduler on HTTP `listening`;
  - stops cleanup scheduler on server `close`;
  - keeps cleanup detached from public auth/password-reset request latency.
- Added production fail-closed configuration:
  - `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`;
  - `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_INTERVAL_MS`;
  - `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_BATCH_SIZE`;
  - `YORSO_PASSWORD_RECOVERY_CLEANUP_DELIVERY_RETENTION_MS`;
  - `YORSO_PASSWORD_RECOVERY_CLEANUP_TOKEN_RETENTION_MS`;
  - `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ID`.
- Added worker metrics:
  - `yorso_api_password_recovery_cleanup_worker_runs_total`;
  - `yorso_api_password_recovery_cleanup_worker_rows_total`;
  - no email, destination, recovery id or token labels.
- Updated env examples, Docker Compose, self-hosted guard scripts, auth API
  smoke, deployment docs, validation docs and production-scale baseline.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scheduler | Запускать cleanup вне request handlers. | Реализовано: scheduler вызывает worker, пропускает overlap и пишет outcome events. | Later queue-age visibility. |
| Runtime config | Включать worker только явной self-hosted настройкой. | Реализовано: disabled by default; production guard requires enabled worker. | Retention remains config-owned. |
| Smoke/metrics | Проверять runtime без PII/token labels. | Реализовано: Prometheus metrics + `password_recovery_cleanup_runtime_guard=ok`. | Alert thresholds later. |

- Validation passed:
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-cleanup-scheduler.test.ts apps/api/src/modules/auth/password-recovery-cleanup-runtime.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts -t "password recovery cleanup|metrics|production config"`;
  - `npx tsc -b --noEmit`;
  - `npm run check:self-hosted-infra`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run test:api`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run smoke:self-hosted-auth-api:run`;
  - `git diff --check`;
  - `npm run build`.
- Commit: `70d65de6` (`[codex] Backend Phase 2I password recovery cleanup runtime`).
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29

- Implemented Backend Phase 2J: Auth Surface Closure And Supabase Prototype
  Removal.
- Closed Phase 2A-2I as one self-hosted auth, registration and password
  recovery surface:
  - registration: `/v1/auth/register/*`;
  - sign-in/session/sign-out: `/v1/auth/sign-in`, `/v1/auth/session`,
    `/v1/auth/sign-out`;
  - password reset: `/v1/auth/password-reset/request`,
    `/v1/auth/password-reset/complete`;
  - delivery/cleanup: self-hosted workers/schedulers and file-spool handoff.
- Removed auth Supabase prototype fallback from code:
  - deleted `src/lib/legacy-auth-supabase-adapter.ts`;
  - removed `legacy-auth-supabase-adapter` dynamic import from
    `src/lib/auth-runtime.ts`;
  - removed `supabase_prototype` from auth runtime source, buyer session source
    and analytics source types;
  - removed `VITE_SUPABASE_*` auth branching from `auth-runtime.ts`.
- Updated `/reset-password` route comments to describe the self-hosted
  `?token=` / `#token=` completion path.
- Updated guards:
  - `src/lib/auth-runtime.boundary.test.ts` asserts the deleted adapter file
    stays absent;
  - `scripts/check-self-hosted-api.mjs` forbids auth Supabase fallback markers;
  - `scripts/check-production-scale-baseline.mjs` forbids the same markers and
    requires the Phase 2J closure doc.
- Added exact remaining debt list outside Phase 2J:
  - catalog Supabase fallback;
  - supplier-access Supabase fallback;
  - Supabase reference tooling/tests;
  - empty prototype env keys;
  - `@supabase/supabase-js` dependency.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Auth runtime | Убрать Supabase auth fallback из `/signin` и `/reset-password`. | Реализовано: runtime self-hosted/local-only. | Не возвращать hosted auth provider. |
| Adapter file | Удалить код вызова Supabase Auth. | Реализовано: `legacy-auth-supabase-adapter.ts` удалён. | Guard blocks return. |
| Source types | Убрать Supabase session source. | Реализовано: `self_hosted` / `local_contract` only. | Старые values больше не эмитятся. |
| Debt list | Точно выделить оставшийся debt вне auth. | Реализовано в Phase 2J doc. | Phase 3A: catalog fallback removal. |

- Validation passed:
  - `npx vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts src/lib/buyer-session.test.ts`;
  - `npm run test:auth-runtime`;
  - `npm run check:supabase-boundary`;
  - `npm run check:self-hosted-api`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run test:api`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run smoke:self-hosted-auth-api:run`;
  - `git diff --check`;
  - `npm run build`.
- Commit: `f753224f` (`[codex] Backend Phase 2J auth surface closure`).
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.

## 2026-05-29 Latest Checkpoint

- Latest implementation commit: `5b96f838` (`[codex] Backend Phase 3B supplier access fallback removal`).
- Phase 3B status: supplier-access Supabase fallback removed; `supplier-access-api.ts` is self-hosted API first with local preview only.
- Removed file: `src/lib/legacy-supplier-access-supabase-adapter.ts`.
- Runtime behavior:
  - configured deployments use `/v1/access/suppliers/:supplierId/request` and
    `/v1/access/notifications`;
  - API-disabled preview uses only `src/lib/supplier-access-requests.ts`;
  - configured API read failure clears stale local approval and returns `null`;
  - configured API request failure rejects and does not create a local mock
    request.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Supplier access facade | Убрать runtime-путь `supplier-access-api` → legacy Supabase adapter. | Реализовано: dynamic import/legacy branches удалены, файл adapter удалён. | Не возвращать legacy markers. |
| Production source of truth | Оставить configured deployments на owned `/v1/access/*`. | Реализовано: read/request/notifications/acknowledge идут через self-hosted API client. | Backend access hardening отдельными phases. |
| API-disabled preview | Сделать local-only без Supabase auth/RLS. | Реализовано: local mock только при пустом `VITE_YORSO_API_URL`. | Позже решить судьбу preview mock. |
| Fail-closed | Не разблокировать buyer через stale local data при API failures. | Реализовано: read clears stale approval; request rejects без local create. | UI error copy отдельно, если нужно. |
| Guards | Запретить возврат fallback. | Реализовано: boundary tests и self-hosted/production-scale guards. | Держать в `ci:core`. |

- Validation passed:
  - `npx vitest run src/lib/supplier-access-api.boundary.test.ts src/lib/supplier-access-api.test.ts`;
  - `npm run test:supplier-access-frontend`;
  - `npm run test:access-contract`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:supabase-boundary`;
  - `npx tsc -b --noEmit`;
  - `npm run test:api`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run build`;
  - `npm run smoke:e2e:api-backed-access-flows`;
  - `npm run smoke:e2e:frontend-no-supabase-env`;
  - `git diff --check`.
- Known non-blocking warnings preserved:
  - Supabase generated types out of sync in non-strict preview/build mode;
  - Browserslist data stale.
- Remaining Supabase/prototype debt: reference tooling/tests, empty prototype env keys and `@supabase/supabase-js`.
- Next scoped workstream: Backend Phase 3C Supabase reference tooling retirement.

## 2026-05-29 Phase 3C Checkpoint

- Latest implementation commit: `6c2f5368` (`[codex] Backend Phase 3C provider tooling retirement`).
- Phase 3C status: active Supabase/provider reference tooling retired from the tracked product surface.
- Removed active surface:
  - `supabase/`;
  - `src/integrations/supabase/`;
  - Supabase CLI/access/type scripts;
  - Supabase/RLS reference tests under `src/test/`;
  - `@supabase/supabase-js`;
  - `VITE_SUPABASE_*` values/comments from `.env` and `.env.example`.
- Replaced guards:
  - `check:supabase-boundary` -> `check:provider-boundary`;
  - `smoke:e2e:frontend-no-supabase-env` -> `smoke:e2e:frontend-provider-free-env`.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Provider files | Убрать активные Supabase project/reference files. | Реализовано: удалены `supabase/`, `src/integrations/supabase`, Supabase scripts и RLS/reference tests. | Исторические docs не считать runtime. |
| Dependency | Убрать hosted BaaS SDK из продукта. | Реализовано: `@supabase/supabase-js` удалён из package manifests. | Не возвращать SDK без нового ADR. |
| Env | Убрать Supabase env debt. | Реализовано: `.env` и `.env.example` без `VITE_SUPABASE_*`. | Provider secrets не хранить в repo. |
| Guard | Заменить Supabase-specific boundary. | Реализовано: `check:provider-boundary` сканирует production source roots. | Держать в `ci:core`. |
| Browser smoke | Проверить frontend без hosted BaaS env/SDK. | Реализовано: `frontend-provider-free-env` smoke прошёл. | Держать в `ci:full`. |

- Validation passed:
  - `npm run check:provider-boundary`;
  - `npm run check:self-hosted-production-runtime`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run check:self-hosted-db`;
  - `npm run check:backend-policy`;
  - `npm run check:self-hosted-infra`;
  - `npm run db:migrations:check`;
  - `npm test`;
  - `npm run lint`;
  - `npx tsc -b --noEmit`;
  - `npm run test:api`;
  - `npm run api:build`;
  - `npm run build`;
  - `npm run smoke:e2e:frontend-provider-free-env`;
  - `git diff --check`.
- Known non-blocking warning now:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4A Supplier Directory/Profile Source Of Truth Audit.

## 2026-05-29 Phase 4A Checkpoint

- Scoped workstream: Backend Phase 4A Supplier Directory/Profile Source Of Truth Audit.
- Confirmed source-of-truth gap:
  - `useSupplierDirectoryList` and `useSupplierDirectoryDetail` used the
    self-hosted supplier API when `VITE_YORSO_API_URL` was configured;
  - on API failure they could still substitute `mockSuppliers` / fallback
    supplier profile data in configured mode.
- Implemented fail-closed supplier directory/profile behavior:
  - API-enabled list/detail state initializes as `source: "api"`;
  - first-load API failure returns an empty live error state instead of local
    supplier rows/profile;
  - refresh failure can keep only previous successful API data, not
    `mockSuppliers`;
  - API-disabled preview remains local-only when `VITE_YORSO_API_URL` is empty.
- UI/copy updates:
  - `/suppliers` source chip now uses `Live directory error` instead of
    `Prototype fallback`;
  - `/suppliers/:supplierId` shows a retry state when the supplier API fails
    before profile data loads.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| `/suppliers` source | Убрать configured-mode prototype fallback. | Реализовано: error state без mock rows. | Держать через tests/guards. |
| `/suppliers/:supplierId` source | Убрать configured-mode fallback profile. | Реализовано: retry state без local profile. | Phase 4B profile data completeness. |
| Access safety | Не ослабить redaction/locks. | Реализовано: supplier identity, contacts and exact locked fields do not appear on failure. | Проверять при следующих supplier phases. |
| Documentation | Зафиксировать 10k review and plan/fact. | Реализовано: Phase 4A doc, contract, validation and baseline updated. | Commit after full validation. |

- Focused validation passed:
  - `npx vitest run src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`.
- Release validation passed:
  - `npm run test:supplier-directory-frontend`;
  - `npx tsc -b --noEmit`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run build`;
  - `git diff --check`.
- Implementation commit: `9362f458` (`[codex] Backend Phase 4A supplier source of truth`).
- Next scoped workstream after Phase 4A commit: Backend Phase 4B Supplier
  Profile Backend-Owned Dossier Completeness.

## 2026-05-29 Phase 4B Checkpoint

- Latest implementation commit: `799af493` (`[codex] Backend Phase 4B supplier dossier facts`).
- Scoped workstream: Backend Phase 4B Supplier Profile Backend-Owned Dossier Completeness.
- Implemented backend-owned supplier profile facts:
  - `packages/contracts/src/supplier-directory.ts` now defines
    `supplierProductionFactsSchema`, `supplierLogisticsFactsSchema`,
    `productionFacts` and `logisticsFacts`;
  - memory and PostgreSQL supplier repositories return those facts from the
    supplier directory record;
  - migration `0031_supplier_profile_dossier_facts.sql` adds
    `production_facts` and `logistics_facts` JSONB columns to
    `yorso_suppliers_directory`;
  - `SupplierProfile.tsx` renders production/logistics sections from
    `supplier?.productionFacts` and `supplier?.logisticsFacts`.
- Removed frontend profile synthesis:
  - page-level `buildProductionFacts`, `buildLogisticsFacts` and `hashSeed`
    are gone from `SupplierProfile.tsx`;
  - API-disabled preview uses explicit helpers in
    `src/lib/supplier-dossier-facts.ts` instead of hidden production logic.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Contract | Добавить backend-owned production/logistics facts. | Реализовано: contract schemas and fields added. | Owner/admin write API later. |
| Persistence | Хранить facts в self-hosted supplier table. | Реализовано: migration `0031_supplier_profile_dossier_facts`. | Backfill real supplier facts later. |
| Profile UI | Убрать hash-based synthesis из page. | Реализовано: profile reads facts from supplier record. | Phase 4C evidence/FAQ/shipment source audit. |
| Local preview | Сохранить Lovable/local preview separately. | Реализовано: explicit local preview helpers. | Demo-mode retirement later. |
| Guards | Зафиксировать no-synthesis/no-provider regression. | Реализовано: tests plus self-hosted/scale checks. | Keep in `ci:core`. |

- Validation passed:
  - `npx vitest run src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm run test:db-migrations`;
  - `npm run test:db-contract`;
  - `npm run contracts:build`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run test:supplier-directory-frontend`;
  - `npm run test:backend-contract`;
  - `npm run test:api`;
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm test`;
  - `npm run api:build`;
  - `npm run build`;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4C Supplier Profile Backend-Owned
  Evidence Blocks.

## 2026-05-29 Phase 4C Checkpoint

- Latest implementation commit: `d8988d50` (`[codex] Backend Phase 4C supplier evidence blocks`).
- Scoped workstream: Backend Phase 4C Supplier Profile Backend-Owned Evidence Blocks.
- Implemented backend-owned supplier profile evidence:
  - `packages/contracts/src/supplier-directory.ts` now defines
    `supplierShipmentCaseSchema`, `supplierFaqItemSchema`, `shipmentCases` and
    `faqItems`;
  - memory and PostgreSQL supplier repositories return those blocks from the
    supplier directory record;
  - migration `0032_supplier_profile_evidence_blocks.sql` adds
    `shipment_cases` and `profile_faq_items` JSONB columns to
    `yorso_suppliers_directory`;
  - `SupplierProfile.tsx` renders shipment evidence and FAQ from
    `supplier?.shipmentCases` and `supplier?.faqItems`.
- Removed frontend evidence/FAQ synthesis:
  - page-level `buildShipmentCasesI18n`, `buildFaqItemsI18n` and `hashSeed`
    are gone from supplier profile evidence rendering;
  - API-disabled preview uses explicit helpers in
    `src/lib/supplier-evidence-blocks.ts` instead of hidden production logic.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Contract | Добавить backend-owned shipment/FAQ evidence. | Реализовано: contract schemas and fields added. | Owner/admin write API later. |
| Persistence | Хранить evidence/FAQ в self-hosted supplier table. | Реализовано: migration `0032_supplier_profile_evidence_blocks`. | Backfill real supplier evidence later. |
| Profile UI | Убрать hash-based evidence/FAQ synthesis из page. | Реализовано: profile reads evidence/FAQ from supplier record. | Phase 4D legal/compliance source boundary. |
| Local preview | Сохранить Lovable/local preview separately. | Реализовано: explicit local preview helpers. | Demo-mode retirement later. |
| Guards | Зафиксировать no-synthesis/no-provider regression. | Реализовано: tests plus self-hosted/scale checks. | Keep in `ci:core`. |

- Validation passed:
  - TDD red: `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
    failed before implementation because backend evidence was ignored;
  - `npm run contracts:build`;
  - `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm run test:db-migrations`;
  - `npm run test:db-contract`;
  - `npx tsc -b --noEmit`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run build`;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4D Supplier Profile Legal/Compliance
  Details Source Boundary.

## 2026-05-31 Phase 4D Checkpoint

- Latest implementation commit: `84dd9588` (`[codex] Backend Phase 4D supplier legal details`).
- Scoped workstream: Backend Phase 4D Supplier Profile Legal/Compliance Details Source Boundary.
- Implemented backend-owned supplier profile legal/compliance details:
  - `packages/contracts/src/supplier-directory.ts` now defines
    `supplierLegalDetailsSchema` and `legalDetails`;
  - memory and PostgreSQL supplier repositories return legal details from the
    supplier directory record;
  - `apps/api/src/modules/suppliers/service.ts` exposes `legalDetails` only for
    `qualified_unlocked` buyers and returns null for locked buyers;
  - migration `0033_supplier_profile_legal_details.sql` adds `legal_details`
    JSONB object storage to `yorso_suppliers_directory`;
  - `SupplierProfile.tsx` renders the legal/compliance block from
    `supplier?.legalDetails`.
- Removed production profile legal synthesis:
  - `SupplierProfile.tsx` no longer calls the frontend legal helper;
  - API-disabled preview uses explicit `localPreviewSupplierLegalDetails` in
    `src/lib/supplier-legal.ts`.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Contract | Добавить backend-owned legal/compliance details. | Реализовано: contract schema and field added. | Owner/admin write validation later. |
| Persistence | Хранить legal details в self-hosted supplier table. | Реализовано: migration `0033_supplier_profile_legal_details`. | Backfill verified legal details later. |
| Access boundary | Не отдавать legal identifiers locked buyers. | Реализовано: locked responses get `legalDetails: null`. | Phase 4E restricted document payload boundary. |
| Profile UI | Убрать frontend legal synthesis из production profile. | Реализовано: profile reads legal details from supplier record. | Demo-mode retirement later. |
| Guards | Зафиксировать qualified-only legalDetails regression. | Реализовано: tests plus self-hosted/scale checks. | Keep in `ci:core`. |

- Validation passed:
  - TDD red: `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
    failed before implementation because backend legal details were ignored;
  - `npm run contracts:build`;
  - `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm run test:db-migrations`;
  - `npm run test:db-contract`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run build`;
  - `npm run test:api`;
  - `npm run test:supplier-directory-frontend`;
  - `npm run test:backend-contract`;
  - `npm run check:self-hosted-db`;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4E Supplier Profile Restricted Document
  Payload Boundary.

## 2026-05-31 Phase 4E Checkpoint

- Latest implementation commit: `7f566ca2` (`[codex] Backend Phase 4E supplier restricted documents`).
- Scoped workstream: Backend Phase 4E Supplier Profile Restricted Document
  Payload Boundary.
- Implemented backend-owned restricted supplier document metadata:
  - `packages/contracts/src/supplier-directory.ts` now defines
    `supplierDocumentPayloadSchema` and `supplierDocuments`;
  - memory and PostgreSQL supplier repositories return restricted document
    metadata from the supplier directory record;
  - `apps/api/src/modules/suppliers/service.ts` exposes `supplierDocuments`
    only for `qualified_unlocked` buyers and returns null for locked buyers;
  - migration `0034_supplier_profile_restricted_documents.sql` adds
    `supplier_documents` JSONB array storage to `yorso_suppliers_directory`;
  - `SupplierProfile.tsx` renders per-batch document metadata from
    `supplier?.supplierDocuments`.
- Protected browser payload boundary:
  - locked buyers do not receive document metadata or file names;
  - the profile payload does not expose file URLs, raw asset ids, storage keys
    or download material;
  - API-disabled preview uses explicit `localPreviewSupplierDocuments` in
    `src/lib/supplier-documents.ts`.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Contract | Добавить backend-owned restricted document metadata. | Реализовано: contract schema and field added. | Phase 4F download grant endpoint. |
| Persistence | Хранить document metadata в self-hosted supplier table. | Реализовано: migration `0034_supplier_profile_restricted_documents`. | Backfill verified supplier documents later. |
| Access boundary | Не отдавать document metadata locked buyers. | Реализовано: locked responses get `supplierDocuments: null`. | Grant download must re-check access. |
| Profile UI | Убрать static per-batch document list из production profile. | Реализовано: profile reads document metadata from supplier record. | Demo-mode retirement later. |
| Guards | Зафиксировать qualified-only supplierDocuments regression. | Реализовано: tests plus self-hosted/scale checks. | Keep in `ci:core`. |

- Validation passed:
  - TDD red: `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
    failed before implementation because backend document metadata was ignored;
  - `npm run contracts:build`;
  - `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm run test:db-migrations`;
  - `npm run test:db-contract`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm test`;
  - `npm run lint`;
  - `npm run api:build`;
  - `npm run build`;
  - `npm run test:api`;
  - `npm run test:supplier-directory-frontend`;
  - `npm run test:backend-contract`;
  - `npm run check:self-hosted-db`;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4F Supplier Document Download Grant
  Endpoint.

## 2026-05-31 Phase 4F Checkpoint

- Latest implementation commit: `75c42a60` (`[codex] Backend Phase 4F supplier document grants`).
- Scoped workstream: Backend Phase 4F Supplier Document Download Grant Endpoint.
- Implemented self-hosted supplier document download grants:
  - `POST /v1/suppliers/:supplierId/documents/:documentId/grant` requires an
    authenticated self-hosted account session;
  - supplier access is re-checked before document lookup and grant issuance;
  - locked buyers receive 403 `supplier_document_access_required` without
    document file asset leakage;
  - qualified buyers receive a short-lived grant response with `downloadPath`;
  - grant response omits `fileAssetId`, object keys, storage keys and direct
    file URLs.
- Added backend audit persistence:
  - migration `0035_supplier_document_download_grants.sql` creates
    `yorso_supplier_document_download_grants`;
  - audit statuses cover `granted`, `access_denied`, `document_not_found` and
    `document_unavailable`;
  - indexes cover buyer recent, supplier recent, status recent and expiry
    cleanup/read patterns.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Contract | Добавить typed grant response без storage details. | Реализовано: `supplierDocumentDownloadGrantSchema` и response schema. | Phase 4G валидирует grant при выдаче файла. |
| Endpoint | Выдавать grant только после access re-check. | Реализовано: POST grant route возвращает 403 без доступа и 200 после approved supplier access. | Добавить GET download route. |
| Audit | Записывать все grant attempts. | Реализовано: memory/PostgreSQL repository audit и migration 0035. | Добавить consumption/download audit. |
| Frontend API | Не создавать local fake grants. | Реализовано: только configured API; API-disabled preview возвращает явную ошибку. | Подключить UI action после serving endpoint. |
| Guards | Зафиксировать self-hosted boundary. | Реализовано: tests, smoke, self-hosted and scale guards. | Keep in release path. |

- Validation passed:
  - TDD red: focused grant endpoint test failed with 405 before route
    implementation;
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-api.test.ts`;
  - `npm run test:db-migrations`;
  - `npm run test:db-contract`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run api:build`;
  - `npm run smoke:self-hosted-account-api:run`;
  - `npm test`;
  - `npm run test:api`;
  - `npm run build`;
  - `npm run check:self-hosted-db`;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4G Supplier Document Grant Consumption
  / File Serving Endpoint.

## 2026-05-31 Phase 4G Checkpoint

- Latest implementation commit: `37cae608` (`[codex] Backend Phase 4G supplier document serving`).
- Scoped workstream: Backend Phase 4G Supplier Document Grant Consumption /
  File Serving Endpoint.
- Implemented self-hosted supplier document grant consumption:
  - `GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...`
    requires an authenticated self-hosted account session;
  - grant id, buyer user, supplier id, document id, expiry, granted status and
    current supplier access are validated before file bytes are read;
  - files are streamed through the API with attachment headers and
    `cache-control: private, no-store`;
  - browser responses do not expose `fileAssetId`, object keys, storage keys or
    direct file URLs.
- Added backend download audit persistence:
  - migration `0036_supplier_document_download_events.sql` creates
    `yorso_supplier_document_download_events`;
  - statuses cover `downloaded`, `grant_not_found`, `grant_denied`,
    `grant_expired`, `access_denied`, `document_unavailable` and
    `file_unavailable`;
  - indexes cover buyer recent, supplier recent, grant recent and status recent
    access patterns.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Download route | Добавить self-hosted file serving endpoint. | Реализовано: GET download route with grantId. | Phase 4H UI integration. |
| Validation | Проверить grant/buyer/supplier/document/expiry/access до чтения файла. | Реализовано: `consumeSupplierDocumentDownloadGrant`. | Cleanup/retention later. |
| File boundary | Не раскрывать storage identifiers. | Реализовано: API streams bytes; asset id stays backend-only. | UI must preserve boundary. |
| Audit | Записывать success/denied/expired attempts. | Реализовано: migration 0036 and repository event records. | Observability/retention later. |
| Guards | Зафиксировать runtime and 10k-user checks. | Реализовано: tests, smoke, self-hosted and scale guards. | Keep in release path. |

- Validation passed:
  - TDD red: focused file-serving endpoint test failed with 404 before route
    implementation;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "supplier document download grants"`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
  - `npm run test:db-migrations`;
  - `npm run test:db-contract`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run contracts:build`;
  - `npm run api:build`;
  - `npm run smoke:self-hosted-account-api:run`;
  - `npm run test:api`;
  - `npm run check:self-hosted-db`;
  - `npm test` passed: 177 files, 1261 passed, 2 skipped;
  - `npm run lint`;
  - `npm run build`;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4H Supplier Document Download UI
  Integration.

## 2026-05-31 Phase 4H Checkpoint

- Latest implementation commit: `06ef6922` (`[codex] Backend Phase 4H supplier document download UI`).
- Scoped workstream: Backend Phase 4H Supplier Document Download UI
  Integration.
- Implemented qualified supplier document download UI:
  - `downloadSupplierDocument` requests a self-hosted document grant and then
    fetches the returned API download path with buyer session headers;
  - `SupplierProfile.tsx` renders `supplier-document-download` only for
    approved qualified documents when the self-hosted API is configured;
  - locked buyers keep non-downloadable document-readiness states;
  - expired and failed download attempts show localized retry copy;
  - backend document rows remain visible in the production passport even when
    optional logistics facts are absent.
- Hardened browser payload boundary:
  - `redactSupplierDocumentFileAssets` strips `fileAssetId` before
    React-visible supplier document state;
  - tests/e2e assert that `fileAssetId`, object keys, storage keys and direct
    file URLs do not appear in DOM-visible output.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| UI download action | Подключить qualified supplier document rows к grant/download flow. | Реализовано: `supplier-document-download` calls `downloadSupplierDocument`. | Phase 4I owner/admin document decision. |
| Access boundary | Не показывать download locked buyers. | Реализовано: button only for approved qualified docs with configured API. | Keep access gating guarded. |
| Storage redaction | Не раскрывать backend storage identifiers. | Реализовано: `redactSupplierDocumentFileAssets` plus DOM/e2e assertions. | Keep backend guards from Phase 4E/4G. |
| Failure states | Показывать loading, expired grant and failed download copy. | Реализовано: EN/RU/ES copy in `translations.ts`. | Dedicated retry button later if needed. |
| Guards | Зафиксировать docs and 10k-user review. | Реализовано: Phase 4H docs, self-hosted guard and production-scale guard. | Keep in release path. |

- Validation passed:
  - TDD red: focused `downloadSupplierDocument` test failed before API client
    implementation;
  - TDD green: `npm test -- src/lib/supplier-directory-api.test.ts`;
  - TDD red: focused SupplierProfile download test failed before UI action;
  - `npm run test:supplier-directory-frontend`;
  - `npm run smoke:e2e:supplier-directory-profile-api-flow`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run build`;
  - `npm test` passed: 177 files, 1263 passed, 2 skipped;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4I Supplier Document Owner/Admin
  Management Decision.

## 2026-05-31 Phase 4I Checkpoint

- Latest implementation commit: `bd05bc60` (`[codex] Backend Phase 4I supplier document audit listing`).
- Scoped workstream: Backend Phase 4I Supplier Document Download Audit
  Listing.
- Implemented admin/operator download audit listing:
  - `GET /v1/admin/supplier-documents/download-events` requires an
    authenticated self-hosted admin session;
  - missing sessions return 401 and buyer/non-admin sessions return 403
    `admin_role_required`;
  - query params support optional `status`, `supplierId`, `buyerUserId`,
    `limit <= 100` and `offset <= 10000`;
  - admin JSON responses exclude `fileAssetId`, object keys, storage keys,
    direct file URLs and `downloadPath`;
  - reads emit audit action
    `admin.supplier_document_download_events.read`.
- Reused existing Phase 4G persistence:
  - no new table/migration was needed;
  - PostgreSQL reads `yorso_supplier_document_download_events` ordered by
    `created_at desc, id asc`;
  - filters align with existing recent indexes.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Решение по scope | Выбрать owner/admin upload или admin audit listing. | Выбрано audit listing, потому что event table уже есть после Phase 4G. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin endpoint | Дать admin bounded read по download events. | Реализовано: `/v1/admin/supplier-documents/download-events`. | Phase 4J: grant audit listing. |
| Role guard | Не отдавать audit buyer-сессиям. | Реализовано: 401 без сессии, 403 `admin_role_required` для buyer. | Возможные subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers. | Реализовано: в admin JSON нет `fileAssetId`, object keys, storage keys, direct file URLs и `downloadPath`. | Держать admin responses без storage identifiers. |
| Пагинация и индексы | Сделать bounded pagination и indexed filters. | Реализовано: `status`, `supplierId`, `buyerUserId`, `limit<=100`, `offset<=10000`; Postgres использует существующие recent indexes. | Cursor pagination только если объем audit этого потребует. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4I docs, self-hosted guard, production baseline, validation. | Держать в release path. |

- Validation passed:
  - TDD red: focused admin download-events test failed with 404 before route
    implementation;
  - TDD green: focused admin route test passed after implementation;
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document download audit without file asset leakage"`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm run test:api`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run build`;
  - `npm test` passed: 177 files, 1263 passed, 2 skipped;
  - `git diff --check`.
- Known non-blocking warning preserved:
  - Browserslist data stale.
- Next scoped workstream: Backend Phase 4J Supplier Document Grant Audit
  Listing.

## 2026-05-31 Phase 4J Checkpoint

- Latest implementation commit: `b5469880` (`[codex] Backend Phase 4J supplier document grant audit listing`).
- Scoped workstream: Backend Phase 4J Supplier Document Grant Audit Listing.
- Implemented admin/operator grant audit listing:
  - `GET /v1/admin/supplier-documents/download-grants` requires an
    authenticated self-hosted admin session;
  - missing sessions return 401 and buyer/non-admin sessions return 403
    `admin_role_required`;
  - query params support optional `status`, `supplierId`, `buyerUserId`,
    `limit <= 100` and `offset <= 10000`;
  - admin JSON responses exclude `fileAssetId`, object keys, storage keys,
    direct file URLs and `downloadPath`;
  - reads emit audit action
    `admin.supplier_document_download_grants.read`.
- Reused existing Phase 4F persistence:
  - no new table/migration was needed;
  - PostgreSQL reads `yorso_supplier_document_download_grants` ordered by
    `created_at desc, id asc`;
  - filters align with existing recent indexes.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Закрыть adjacent grant-audit gap после Phase 4I. | Реализован admin listing по `yorso_supplier_document_download_grants`. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin endpoint | Дать admin bounded read по grant attempts. | Реализовано: `/v1/admin/supplier-documents/download-grants`. | Решить, нужен ли admin UI над grant/download audit listings. |
| Role guard | Не отдавать audit buyer-сессиям. | Реализовано: 401 без сессии, 403 `admin_role_required` для buyer. | Возможные subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers. | Реализовано: в admin JSON нет `fileAssetId`, `downloadPath`, object keys, storage keys и direct file URLs. | Держать admin responses без storage identifiers. |
| Пагинация и индексы | Сделать bounded pagination и indexed filters. | Реализовано: `status`, `supplierId`, `buyerUserId`, `limit<=100`, `offset<=10000`; Postgres использует существующие recent indexes. | Cursor pagination только если объем audit этого потребует. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4J docs, self-hosted guard, production baseline, validation. | Держать в release path. |

- Validation passed:
  - TDD red: focused admin download-grants test failed with 404 before route
    implementation;
  - TDD green: focused admin route test passed after implementation;
  - `npm run contracts:build`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document grant audit without file asset leakage"`;
  - `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`;
  - `npm test -- src/test/self-hosted-contracts.test.ts`;
  - `npm run test:api`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run build`;
  - `npm test` passed: 177 files, 1264 passed, 2 skipped;
  - `git diff --check`.
- Known non-blocking warnings preserved:
  - Browserslist data stale;
  - existing React Router future flag / act warnings in the test suite.
- Next scoped decision: admin UI for document audit listings or supplier
  owner/admin document management.

## 2026-05-31 Phase 4K Checkpoint

- Latest implementation commit: `3b74b498` (`[codex] Backend Phase 4K supplier document audit admin UI`).
- Scoped workstream: Backend Phase 4K Supplier Document Audit Admin UI.
- Implemented read-only admin UI:
  - `/admin/supplier-document-audit` routes to `AdminSupplierDocumentAudit`;
  - `AdminOperatorNav` includes the Documents audit link;
  - `React.lazy` route loading and `RouteChunkErrorBoundary` are preserved.
- Implemented frontend API client and hook:
  - `createAdminSupplierDocumentAuditApiClient` supports `download_grants` and
    `download_events`;
  - client sends `x-yorso-user-id` and `x-yorso-session-id`;
  - missing sessions, API-disabled mode and `admin_role_required` are mapped
    to explicit UI states;
  - responses containing `fileAssetId`, `downloadPath`, `objectKey` or
    `storage` are rejected.
- Plan/fact:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Закрыть admin UI над audit listings Phase 4I/4J. | Реализован `/admin/supplier-document-audit`. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin UI | Дать bounded read-only view по grants/downloads. | Есть kind switch, status/supplier/buyer filters и sanitized rows. | Deep pagination/export только после отдельного operator requirement. |
| API client | Использовать self-hosted API и session headers. | Реализован `createAdminSupplierDocumentAuditApiClient`; 401/403 маппятся в явные UI states. | Возможные admin-subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers в браузере. | Client отвергает `fileAssetId`, `downloadPath`, `objectKey`, `storage`; UI не выводит эти поля. | Держать admin responses без storage identifiers. |
| Tests/smoke | Зафиксировать page/client/hook и browser smoke. | Реализованы unit tests и `e2e/admin-supplier-document-audit.spec.ts`. | Держать в release path. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4K doc, contract map, validation doc, production baseline, guard markers. | Держать в release path. |

- Validation passed:
  - TDD red: client/hook/page tests failed before implementation because the
    files did not exist;
  - TDD green: `npm test -- src/lib/admin-supplier-document-audit-api.test.ts src/lib/use-admin-supplier-document-audit.test.tsx src/pages/admin/AdminSupplierDocumentAudit.test.tsx src/test/app-route-code-splitting.test.ts`;
  - `npm run test:admin-supplier-document-audit-frontend`;
  - `npm run check:self-hosted-api`;
  - `npm run check:production-scale-baseline`;
  - `npm run smoke:e2e:admin-supplier-document-audit` passed, 2 browser tests;
  - `npx tsc -b --noEmit`;
  - `npm run lint`;
  - `npm run build` passed inside the e2e smoke;
  - `npm test` passed: 180 files, 1275 passed, 2 skipped;
  - `git diff --check`.
- Known non-blocking warnings preserved:
  - Browserslist data stale;
  - existing React Router future flag / act warnings in the test suite.
- Next scoped decision: supplier owner/admin document management ownership,
  upload/edit/delete validation and audit rules.
