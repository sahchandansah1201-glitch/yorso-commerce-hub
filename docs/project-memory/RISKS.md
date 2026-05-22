# Risks

## Active Risks

- Risk: Batch #103 is implemented locally but not yet merged to `main`.
  Impact: Lovable will not see the admin incident workflow until the PR is merged and synced.
  Mitigation: Local validation has passed; commit, push, PR, wait for GitHub checks and merge before starting Batch #104.

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

- Risk: Incident response can become a dumping ground for unbounded logs.
  Impact: Operator pages may slow down during outages and leak sensitive audit context.
  Mitigation: Batch #101 derives bounded incidents from runtime diagnostics and audit summaries, stores only acknowledgement state, keeps `/admin/incidents` admin-only and adds smoke/e2e secret guards.

- Risk: Incident workflow can expose raw operator identities or become a high-write control-plane path during outages.
  Impact: Browser pages could leak user ids, or operator updates could add pressure while the service is degraded.
  Mitigation: Batch #102 accepts raw assignee ids only in admin requests, returns hashed identifiers to the browser, stores bounded timeline events in `yorso_admin_incident_events`, limits bulk workflow to selected incident ids, sanitizes export, avoids polling and keeps the workflow behind self-hosted admin session and role guards.

- Risk: Incident detail, handoff export and remediation plan can become an unbounded incident-data dump.
  Impact: Large handoff payloads could slow operator response and expose sensitive evidence in browser-visible downloads.
  Mitigation: Batch #103 exports bounded JSON/Markdown sections and bounded remediation steps from the admin incident detail contract, keeps handoff/remediation behind self-hosted admin session and role guards, uses hashed operator identifiers in browser responses and adds runtime smoke markers for JSON/Markdown handoff plus remediation plan.

## Resolved Risks

- Risk: No project-memory black box existed.
  Resolution: Added `docs/project-memory/` and `AGENTS.md`.

- Risk: Batch #98 was implemented locally but not yet merged to `main`.
  Resolution: Batch #98 is present on main as `[codex] Batch #98 engineering lessons guards`; Batch #99 now builds on top of it.
