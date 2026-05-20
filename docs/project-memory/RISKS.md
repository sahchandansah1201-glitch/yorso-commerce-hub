# Risks

## Active Risks

- Risk: Batch #97 is implemented locally but not yet merged to `main`.
  Impact: Lovable will not see the admin access grants console until the PR is merged and synced.
  Mitigation: Complete commit, push, PR, checks and merge before starting Batch #98.

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

## Resolved Risks

- Risk: No project-memory black box existed.
  Resolution: Added `docs/project-memory/` and `AGENTS.md`.
