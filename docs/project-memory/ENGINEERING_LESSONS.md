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
