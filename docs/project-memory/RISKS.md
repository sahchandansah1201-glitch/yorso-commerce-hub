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
