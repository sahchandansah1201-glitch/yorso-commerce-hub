# Risks

## Active Risks

- Risk: Batch #100 is implemented locally but not yet merged to `main`.
  Impact: Lovable will not see the admin command center and audit page until the PR is merged and synced.
  Mitigation: Complete remaining validation, commit, push, PR, checks and merge before starting Batch #101.

- Risk: A new chat may confuse `yorso-commerce-hub` with `yorso_new`.
  Impact: Work may be applied in the wrong repository.
  Mitigation: Always verify cwd and read `PROJECT_STATE.yaml` before implementation.

- Risk: Old chat context may be missing or stale.
  Impact: The assistant may infer product status incorrectly.
  Mitigation: Treat repository files as source of truth and mark unsupported claims as hypotheses.

- Risk: Admin/operator review queues can become hot paths under high request volume.
  Impact: Slow review list reads could affect support operations and buyer conversion.
  Mitigation: Batch #96 adds bounded pagination and `0017_supplier_access_review_queue` indexes; future production validation should include mixed buyer request writes and admin review reads at the 10000 concurrent-user baseline.

- Risk: Admin grant revocation is commercially sensitive because it can remove buyer access to supplier identity and prices.
  Impact: Incorrect revocation could break an active buyer workflow or leave stale access visible.
  Mitigation: Batch #97 revokes both supplier identity and offer-price grants together, emits audit/action paths, adds runtime smoke for remasking, and adds browser e2e for the admin grants console.

- Risk: API-backed browser specs can fail in generic smoke.
  Impact: Generic local prototype smoke can fail or hide regressions when it includes specs that require `VITE_YORSO_API_URL` and self-hosted API-backed fixtures.
  Mitigation: Batch #98 adds `check:engineering-lessons`, `test:engineering-lessons` and an e2e script policy that keeps API-backed specs out of `smoke:e2e:run`.

- Risk: Parallel Vite builds can race on shared `dist/`.
  Impact: Running two build-based e2e commands concurrently can overwrite preview assets and produce nondeterministic failures.
  Mitigation: Batch #98 forbids parallel tokens in `smoke:e2e*` package scripts unless future work isolates output directories.

- Risk: Admin operations overview can become a hot operator endpoint during incidents.
  Impact: Unbounded list reads or secret leakage would slow operations and expose sensitive runtime data.
  Mitigation: Batch #99 uses bounded previews, self-hosted admin session guard, runtime smoke secret checks, frontend state tests, browser smoke and production-scale guard markers. Batch #100 keeps audit samples bounded, adds no polling and guards `/admin/audit` as a self-hosted admin-only page.

## Resolved Risks

- Risk: No project-memory black box existed.
  Resolution: Added `docs/project-memory/` and `AGENTS.md`.

- Risk: Batch #98 was implemented locally but not yet merged to `main`.
  Resolution: Batch #98 is present on main as `[codex] Batch #98 engineering lessons guards`; Batch #99 now builds on top of it.
