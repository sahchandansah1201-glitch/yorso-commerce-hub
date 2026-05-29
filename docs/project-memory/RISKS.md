# Risks

## Active Risks

- Risk: A new chat may confuse `yorso-commerce-hub` with `yorso_new`.
  Impact: Work may be applied in the wrong repository or evaluated against the wrong product surface.
  Mitigation: Always verify cwd, read `PROJECT_STATE.yaml`, and use `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub` as the project root unless the user explicitly asks for another repository.

- Risk: Old chat context may be missing, stale or mixed with another Yorso chat.
  Impact: The assistant may infer product status incorrectly.
  Mitigation: Treat repository files as source of truth and mark unsupported claims as hypotheses.

- Risk: Project-memory can drift behind merged production batches.
  Impact: A new chat may continue from an obsolete batch, branch or next action.
  Mitigation: The 2026-05-23 checkpoint updates state from Batch #107 to `main` at Batch #109; update project-memory after every significant audit, feature or handoff.

- Risk: Supabase generated types are out of sync with backend access migrations in non-strict build mode.
  Impact: A future strict type guard may fail until migrations are applied and `src/integrations/supabase/types.ts` is regenerated.
  Mitigation: Keep the non-strict preview/build guard visible, apply pending migrations in the linked project, regenerate types and run `npm run check:supabase-types:strict`.

- Risk: File-spool registration delivery handoff now contains backend-only OTP material.
  Impact: Operator/channel handling mistakes could leak verification codes outside owned delivery paths.
  Mitigation: Keep spool files on mounted server storage with `0600` permissions, do not copy handoff files into public logs, and move to an owned channel adapter/runbook before broad production rollout.

- Risk: Password recovery outbox now contains backend-only sealed reset-token material.
  Impact: Future recovery sender/runtime work could accidentally expose reset tokens in logs, browser responses or support tooling.
  Mitigation: Keep tokens sealed at rest, decrypt only after bounded worker lease, sanitize sender errors, and never add reset token/full email to browser-visible responses or public logs.

- Risk: API-backed browser specs can fail in generic smoke.
  Impact: Generic local prototype smoke can fail or hide regressions when it includes specs that require `VITE_YORSO_API_URL` and self-hosted API-backed fixtures.
  Mitigation: Keep API-backed browser specs in dedicated package scripts and preserve the `check:engineering-lessons` guard.

- Risk: Parallel Vite builds can race on shared `dist/`.
  Impact: Running two build-based e2e commands concurrently can overwrite preview assets and produce nondeterministic failures.
  Mitigation: Do not add parallel tokens to `smoke:e2e*` package scripts unless future work isolates output directories.

- Risk: Admin/operator review and incident queues can become hot paths under high request volume.
  Impact: Slow admin reads or broad exports could affect support operations and buyer conversion.
  Mitigation: Existing batches use bounded pagination, capped exports, role guards, smoke/e2e secret checks and production-scale guard markers. Future changes must keep the 10000 concurrent users baseline fields explicit.

## Resolved Risks

- Risk: No project-memory black box existed.
  Resolution: Added `docs/project-memory/` and `AGENTS.md`.

- Risk: Batch #104 was implemented locally but not merged to `main`.
  Resolution: Later batches through Batch #109 are now present on `main`.

- Risk: Batch #107 project-memory state was stale after Batch #108 and Batch #109 merged.
  Resolution: Updated `CONTEXT_HEALTH.md`, `PROJECT_STATE.yaml`, `HANDOFF.md`, `NEXT_ACTIONS.md`, `WORKLOG.md`, `ARTIFACTS.md` and `RISKS.md` on 2026-05-23.

- Risk: Public metadata and README still exposed Lovable defaults.
  Resolution: Current UX/UI patch replaces Lovable metadata in `index.html` and the default Lovable README content in `README.md`.

- Risk: Public mobile touch targets remained below the 44px guideline after the first audit pass.
  Resolution: Current UX/UI patch hardens touch targets across the checked public routes. Playwright mobile audit at 390px reports zero interactive targets below 44px for `/`, `/how-it-works`, `/suppliers`, `/offers` and `/for-suppliers`.

- Risk: The public production bundle loaded a very large single entry chunk.
  Resolution: Batch #112 lazy-loads route pages and splits the local translation table. The production entry chunk is now `352.18 kB` minified and `112.99 kB` gzip, and the previous Vite large-chunk warning is gone.

- Risk: Lazy route chunk failures used default browser/React behavior.
  Resolution: Batch #113 adds `RouteChunkErrorBoundary` around lazy routes with reload and go-back recovery actions. PR #164 passed the GitHub `Core Type And Build Gate` and merged to `main` as `9860aa3`.

- Risk: Google Fonts were loaded through CSS `@import`.
  Resolution: Batch #114 moves font discovery into document-head preconnect and stylesheet links while keeping Inter for body copy and Plus Jakarta Sans for headings.

- Risk: `/account/*` remained local-first while self-hosted account APIs already existed.
  Resolution: Backend Phase 1A Account Session Authority Gate validates the
    self-hosted session before rendering editable account sections in
    API-enabled mode, hydrates account data from backend before render, keeps
    editable sections closed on backend load failure and preserves localStorage
    fallback only for API-disabled local preview.

- Risk: Registration verification still used the prototype OTP generation
  policy while Phase 2D only added scheduler and file-spool delivery handoff.
  Resolution: Backend Phase 2E adds per-request OTP generation, code expiry,
    attempt counters and sealed backend-only delivery handoff material.

- Risk: Browser sessionStorage gated account UI before backend session validation.
  Resolution: Backend Phase 1A requires `/v1/auth/session` validation before
    rendering editable account data in API-enabled mode and clears
    `buyerSession` on `auth_session_required` / `auth_session_invalid` before
    redirecting to `/signin`.

- Risk: Account workspace saves were broad full-profile remote syncs in
  API-enabled mode.
  Resolution: Backend Phase 1B replaces normal account edits with
    section-scoped mutations. Personal and company saves use their own profile
    endpoints; branch, product, meta-region and notification saves use existing
    row-level endpoints; collection forms wait for backend success before
    closing.

- Risk: Account API-mode saves had no explicit conflict/version handling.
  Resolution: Backend Phase 1C adds account snapshot versioning through
    `accountVersion` responses and the `x-yorso-account-version` mutation
    precondition. Stale current-frontend saves now fail with
    `409 account_snapshot_conflict`, keep the edit form open and show a
    reloadable `account-save-conflict` banner instead of silently overwriting
    newer backend data.

- Risk: Production account write clients could omit the Phase 1C version
  precondition and still mutate account state.
  Resolution: Backend Phase 1D adds
    `ACCOUNT_VERSION_PRECONDITION_MODE=optional|required`, requires
    `required` mode in production self-hosted runtime and rejects normal
    `/v1/account/*` mutations missing `x-yorso-account-version` with
    `428 account_version_required` in strict mode.

- Risk: Account-owned media/document mutations could bypass the account
  version precondition policy.
  Resolution: Backend Phase 1E applies the shared
    `x-yorso-account-version` precondition to document create and company media
    upload routes, returns refreshed `accountVersion` from document/media JSON
    responses and includes file/document timestamps in the account snapshot
    version.

- Risk: Enabled account storage clients could use the deterministic demo account
  id when no validated account session user was available.
  Resolution: Backend Phase 1F makes enabled account API calls fail before fetch
    with `account_api_session_required` unless an explicit, buyer-session or
    configured account user id is present, and `/account/company` passes the
    validated session-bound client into company documents.

- Risk: Account document upload metadata could be partially written as a file
  asset without the matching company document, or object bytes could remain
  after metadata failure.
  Resolution: Backend Phase 1G writes document file asset and company document
    metadata in one atomic PostgreSQL CTE statement, deletes object bytes after
    metadata persistence failure, and compensates media uploads if company media
    profile update fails after asset creation. Outbox is deferred until async
    storage processing exists.

- Risk: Bulk backend account workspace collection replacement could delete old
  rows and then fail during a later per-row insert, leaving partial account
  workspace state.
  Resolution: Backend Phase 1H replaces branch, product, meta-region and
    notification collection replacement with one atomic PostgreSQL CTE statement
    per collection, including delete, parent touch and insert returning.
