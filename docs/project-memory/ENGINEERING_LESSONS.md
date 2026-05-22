# Engineering Lessons

This file records concrete mistakes found during batches and the prevention
mechanism added to the repository. It is not a retrospective narrative. Each
lesson must identify the symptom, root cause, fix and guard.

Batch #98 introduced this file as a required project-memory artifact and wired
it to `check:engineering-lessons` and `test:engineering-lessons`.

## Batch #96: deterministic admin review queue

Symptom: the supplier access review queue could order `sent` and `pending`
requests differently across memory and PostgreSQL repositories.

Root cause: the UI and tests assumed a stable operator queue, but the
repository contract did not explicitly normalize status priority and tie-breaks.

Fix: both repositories now sort pending requests before sent requests, then by
updated time and id.

Guard: API tests and self-hosted smoke assert deterministic review queue
behavior.

## Batch #96: admin review localization source

Symptom: admin review copy risked using stale or implicit language state.

Root cause: the page did not consistently read locale through the same
`useLanguage().lang` path used by other frontend surfaces.

Fix: admin review page uses `useLanguage().lang` and fallback copy.

Guard: frontend tests cover disabled, session-required and ready-state copy.

## Batch #97: memory repository display-name assumption

Symptom: self-hosted admin grants smoke initially asserted the production
supplier display name from a memory repository response.

Root cause: memory repository smoke tests should verify stable contract fields,
not production display names unavailable to the memory repository.

Fix: the smoke test now asserts `supplierId` for admin grant list identity and
keeps production name checks on offer access, where the mock catalog owns that
data.

Guard: `check:engineering-lessons` verifies the smoke uses `admin grants
supplier id` and does not reintroduce the brittle `admin grants supplier name`
assertion.

## Batch #97: API-backed e2e in generic browser smoke

Symptom: GitHub Actions failed because `e2e/admin-access-grants.spec.ts` was
included in generic `smoke:e2e:run`.

Root cause: API-backed e2e specs require `VITE_YORSO_API_URL` at Vite build
time. Generic browser smoke builds without that environment variable, so the
frontend correctly used local fallback mode and the API-backed route mocks were
never called.

Fix: API-backed e2e specs stay in dedicated `smoke:e2e:*` scripts that build
with `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`.

Guard: `scripts/lib/e2e-script-policy.mjs` derives all API-backed e2e scripts
from `package.json` and fails if their specs appear in generic
`smoke:e2e:run`.

## Batch #97: shared `dist/` race from parallel build-based e2e

Symptom: a local verification run failed after two build-based e2e commands
were launched at the same time.

Root cause: both commands write to the same Vite `dist/` directory. One build
used `VITE_YORSO_API_URL`; the other did not. Parallel execution allowed the
second build to replace the first one before Playwright finished.

Fix: build-based e2e commands must run sequentially unless each command has an
isolated output directory.

Guard: `check:engineering-lessons` fails on parallel e2e script patterns such
as `&`, `concurrently`, `npm-run-all --parallel` or `run-p`.

## Batch #102: select option strictness in browser tests

Symptom: the admin incidents e2e test failed in strict mode while selecting
`Assigned only`.

Root cause: Playwright `getByRole("option", { name: "Assigned only" })` also
matched `Unassigned only`. The UI copy was correct, but the test selector was
not precise enough for similar operator-filter labels.

Fix: the e2e selector now uses `exact: true` for the assignment filter option.

Guard: Batch #102 keeps the exact selector in
`e2e/admin-incidents.spec.ts`, and `check:self-hosted-api` requires the
assignment-filter e2e markers.

## Batch #102: guard literal must exist in the actual browser spec

Symptom: `check:self-hosted-api` failed after the bulk workflow UI was added.

Root cause: the guard expected the literal `admin-incidents-bulk-workflow`, but
the e2e test only exercised the flow indirectly. The feature existed in the UI,
but the guard could not prove the browser spec covered it.

Fix: the e2e spec now explicitly asserts the bulk workflow panel by test id.

Guard: `check:self-hosted-api` and `check:production-scale-baseline` both
require the bulk workflow, workload summary, escalation load and source mix
browser identifiers.

## Batch #102: localization edits must preserve required copy keys

Symptom: TypeScript failed after removing a duplicate Spanish `exportReady`
entry from the incident page copy map.

Root cause: the duplicate-key cleanup removed both Spanish entries instead of
leaving one required `IncidentsCopy.exportReady` value.

Fix: the Spanish copy now has a single `exportReady` value and the page compiles
against the full `IncidentsCopy` contract.

Guard: `npx tsc -b --noEmit` is required before publication, and Batch #102
keeps the incident copy object typed instead of using untyped translation
records.

## Batch #103: detail-page tests must prove the user-visible workflow result

Symptom: the incident detail page test failed after assigning an operator
because the page updated internal state but did not show the assigned operator
hash in the visible detail surface.

Root cause: the implementation connected the workflow mutation but the detail
UI did not expose the mutated assignment in a stable, scannable snapshot item.

Fix: the detail page now renders the assigned operator hash in the snapshot
panel, and the page test asserts that value after assignment.

Guard: `test:admin-incidents-frontend` includes
`src/pages/admin/AdminIncidentDetail.test.tsx`, which covers assignment and
handoff UI behavior.

## Batch #103: use package-resolved test binaries for focused runs

Symptom: a focused API test command failed with `zsh:1: command not found:
vitest`.

Root cause: the command used a bare `vitest` binary instead of the project
package resolution path.

Fix: focused runs use `npx vitest ...` or npm scripts.

Guard: publication validation still requires `ci:core`, and Batch #103
recorded the failed command so future agents do not treat it as a product
failure.

## Batch #103: nested array assertions must not pretend partial matching is enough

Symptom: remediation and handoff API tests failed even though the response had
the expected labels and titles.

Root cause: `toMatchObject` on arrays still expects matching array element
shape more strictly than a plain object subset. The test encoded partial array
items and produced noisy diffs.

Fix: the tests now extract stable labels/titles from the arrays and assert
membership directly.

Guard: Batch #103 keeps these assertions in
`src/lib/admin-incidents-api.test.ts` and `src/lib/use-admin-incident-detail.test.tsx`.

## Batch #103: smoke assertions must match emitted runtime copy exactly

Symptom: self-hosted admin incidents smoke failed on `Control-plane` while the
runtime emitted `control-plane`.

Root cause: the smoke marker asserted human copy with the wrong case instead
of matching the actual bounded remediation payload.

Fix: the smoke assertion now matches the emitted lowercase `control-plane`
phrase.

Guard: `smoke:self-hosted-admin-incidents:run` prints
`admin_incidents_remediation_plan=ok` only after the remediation payload,
rollback plan, verification checks and capacity notes are present and secret
safe.

## Batch #103: batch-size contract must be measured before commit

Symptom: the first staged Batch #103 size was `32 files changed, 2691 insertions, 54 deletions`,
which was still smaller than the Batch #102 baseline stored in project memory.

Root cause: the work had more connected product scope than earlier small
batches, but it did not actually satisfy the user's repeated "increase batch
size" instruction when measured against the prior batch.

Fix: Batch #103 was expanded before commit with bounded incident postmortem
JSON/Markdown exports, frontend postmortem controls, smoke markers, docs and
guards.

Guard: before future batch publication, compare `git diff --cached --shortstat`
against the previous batch baseline and either expand scope or explicitly
report that the batch is intentionally smaller with the reason.

## Batch #103: preview panels must expose the decisive payload field

Symptom: the postmortem page test failed because the preview rendered summary,
hypotheses and prevention checks, but not the action item titles.

Root cause: the UI showed the new endpoint status and metadata but omitted the
field operators need to scan first: the remediation/action queue.

Fix: the postmortem preview now renders action item titles in the detail panel.

Guard: `src/pages/admin/AdminIncidentDetail.test.tsx` asserts that `Add
regression guard` is visible after loading the postmortem JSON payload.

## Batch #104: update validators must preserve update-specific fields

Symptom: TypeScript failed because the execution update validator returned the
base execution response type, then code tried to read `updatedItem` from that
base type.

Root cause: the validator reused the broad response assertion as the returned
value, erasing the update-specific field narrowing.

Fix: the update validator now validates the base response for common shape and
then asserts `response.updatedItem` on the original parsed update response.

Guard: `npx tsc -b --noEmit` and `ci:core` must pass before publication.

## Batch #104: DB guard markers must match migration DDL exactly

Symptom: `check:self-hosted-db` failed after adding the execution migration
because the guard expected a shortened `updated_by_user_id` marker that did not
match the migration text.

Root cause: the guard marker was written semantically instead of matching the
actual DDL string used by the migration.

Fix: the guard now checks the exact `updated_by_user_id uuid not null
references yorso_users(id)` migration text.

Guard: `check:self-hosted-db` is required before publication.

## Batch #104: new migrations must update every migration contract test

Symptom: `ci:core` failed after the new migration passed guard checks because
`self-hosted-db-contract`, `packages/db/src/migrator.test.ts` and
`packages/db/src/cli.test.ts` still expected the previous migration set and
pending count.

Root cause: adding a migration was treated as a guard-script change only, but
the repository has separate contract tests for manifest order, migration
planning and CLI pending output.

Fix: all migration contract tests now include
`0021_admin_incident_execution`; the CLI pending-count assertion was updated
from 21 to 22.

Guard: `ci:core` catches missing migration-test updates before publication.

## Batch #104: route mocks must not use broad suffixes for nested exports

Symptom: the admin incidents API test failed after adding execution export
because `/execution/export?format=json` was served by the generic
`/incidents/export?format=json` mock and returned the wrong response shape.

Root cause: the mock matched only the suffix `/export?format=json`, but the new
route has a nested export endpoint under the same suffix.

Fix: the generic incident export mock now matches the exact
`/v1/admin/incidents/export?format=...` namespace, leaving
`/execution/export?format=...` to its own mock.

Guard: `test:admin-incidents-frontend` covers both generic incident export and
execution export client calls.

## Batch #105: refined Zod schemas cannot be extended directly

Symptom: `contracts:build` failed because `adminIncidentExecutionUpdateRequestSchema`
had `.superRefine(...)`, making it a `ZodEffects`; `.extend(...)` is not
available on that wrapper.

Root cause: the bulk update request tried to extend the already-refined single
item update schema instead of extending the base object schema.

Fix: the execution update object is now factored into a base schema plus a
shared refinement function. Single-item and bulk update schemas both extend the
base and reuse the same refinement.

Guard: `npm run contracts:build`, `npm run api:build` and `ci:core`.

## Batch #105: queue item refs must stay paired across incidents

Symptom: `ci:core` failed in admin incident service tests. The test selected
the first open queue item but sent the stale `incidentId` from a previous
single-incident flow, so bulk update reported zero successes.

Root cause: cross-incident queues require `(incidentId, itemId)` pairs to move
together. Reusing only `itemId` is unsafe because item ids repeat across
derived execution plans.

Fix: the service test now sends `nextOpen.incidentId` with `nextOpen.itemId`.

Guard: queue bulk tests must select refs from the same queue item object and
runtime smoke must keep `admin_incidents_execution_queue_bulk=ok`.

## Batch #105: browser and unit mocks must match route namespace plus query

Symptom: the execution queue page tests were brittle around export URLs and
incident title matching.

Root cause: queue exports add query parameters after `format`, and the incident
title is rendered together with an incident id in the same text node.

Fix: tests now match export routes by namespace plus `format=...`, and match
incident title with a regex instead of exact text.

Guard: prefer namespace-aware URL matching for nested admin routes and avoid
exact text assertions when UI intentionally combines identifiers and labels.

## Batch #106: test fixtures must satisfy the exported contract schema

Symptom: the admin incident workload browser fixture used stale fields such as
`lastUpdatedAt`, `oldestTargetMinutes` and `source` where the new contract
requires `dueAt`, `immediateItems`, `nextTargetDueAt`, `status` and `key`.

Root cause: the browser fixture was drafted from the UI shape instead of the
Zod contract in `packages/contracts/src/admin-incidents.ts`.

Fix: the e2e fixture now mirrors `adminIncidentWorkloadResponseSchema` and
`adminIncidentCorrelationResponseSchema`, including `auditEvents`,
`executionItems`, `timeline`, `statusMix`, hashed actors and evidence fields.

Guard: `smoke:e2e:admin-incident-workload`, `test:admin-incidents-frontend`
and the self-hosted API/production-scale guards all require the workload and
correlation contract markers.

## Batch #106: UI code must stay compatible with the repository TypeScript target

Symptom: `tsc -b --noEmit` failed because the workload page used
`String.prototype.replaceAll`, which is not available under the current target
library.

Root cause: a small UI helper used a newer runtime API without checking the
project tsconfig target.

Fix: the helper now uses `split("_").join(" ")`, which is compatible with the
existing target.

Guard: run `npx tsc -b --noEmit` before publication for every frontend batch.

## Batch #106: smoke assertions must read the actual response contract

Symptom: `smoke:self-hosted-admin-incidents:run` failed while checking incident
correlation because it asserted `summary.executionItems`, a field that does not
exist in the correlation response schema.

Root cause: the smoke assertion was written from an inferred summary shape
instead of the explicit contract. The contract exposes `executionItems` as a
top-level bounded array and only item counts for open/done/blocked state in
`summary`.

Fix: the smoke now asserts the top-level `executionItems` array and its length,
then checks the existing summary fields separately.

Guard: keep smoke assertions aligned with `packages/contracts/src/admin-incidents.ts`
before adding new markers.
