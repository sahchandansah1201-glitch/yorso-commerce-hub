# Next Actions

## Current Next Action

1. Finish Batch #102 validation and publication:
   - run focused frontend tests for admin incidents and admin operations;
   - run self-hosted admin incidents smoke;
   - run `check:self-hosted-db`, `check:self-hosted-api`,
     `check:production-scale-baseline`, `lint`, `tsc -b --noEmit`,
     `smoke:e2e:admin-incidents` and `ci:core`;
   - run `git diff --check` and inspect `git status -sb`;
   - commit branch `codex/batch102-incident-workflow`;
   - push the branch;
   - open PR `[codex] Batch #102 admin incident workflow`;
   - wait for GitHub checks and merge after green;
   - provide Lovable Prompt #102 for sync-only confirmation.
2. Start Batch #103 only under the Engineer Agent Action Contract:
   - make it a large connected production batch, not a single-marker PR;
   - include runtime/backend or frontend feature work, integration, tests, smoke/e2e or runtime validation, docs, guard scripts, and CI wiring;
   - include a Batch Size Report in the final result.
3. Do not stack Batch #103 on the local Batch #102 branch before Batch #102 is merged and Lovable confirms sync from GitHub main.
4. Use Batch #102 size and validation output as the next baseline for whether the following batch is actually larger, not as a vague intent.
5. If the next batch is smaller for a technical reason, state the blocker before implementation and record it in `WORKLOG.md`.

## After That

1. Read `HANDOFF.md`.
2. Read `AGENTS.md`, especially the Engineer Agent Action Contract.
3. Continue implementation from confirmed repository evidence.
4. Keep strengthening self-hosted production paths and avoid treating Supabase or hosted BaaS as production backend.
5. Candidate Batch #103: continue self-hosted admin/operator operations by adding another bounded workflow with backend, frontend, tests, smoke/e2e, docs, guards and capacity notes.

## Blockers

- No hard blocker confirmed.
- Detailed current product status is intentionally not reconstructed here beyond repository-level facts.
