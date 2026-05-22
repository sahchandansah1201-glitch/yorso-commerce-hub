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
  - `npm run ci:core` passed.

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
