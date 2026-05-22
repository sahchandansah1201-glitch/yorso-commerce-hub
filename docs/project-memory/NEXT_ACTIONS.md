# Next Actions

## Current Next Action

1. Finish Batch #107 implementation and publication:
   - keep the batch at least 20 percent larger than Batch #106;
   - minimum size gate: 47 changed files and 4647 insertions;
   - run the validation plan in `docs/project-memory/RUNS/2026-05-22-batch107-validation-plan.md`;
   - run `git diff --check`;
   - commit branch `codex/batch107-incident-trend-analytics`;
   - push the branch;
   - open PR `[codex] Batch #107 admin incident trend analytics`;
   - wait for GitHub checks and merge after green;
   - provide numbered Lovable Prompt #107 for sync-only confirmation.
2. If validation exposes a process or code mistake:
   - fix it before publication;
   - record symptom, root cause, fix and guard in `ENGINEERING_LESSONS.md`;
   - update project-memory before final handoff.
3. After Batch #107:
   - continue self-hosted production admin/operator flow;
   - prefer a still larger connected Batch #108 unless a blocker is stated before implementation.

## Completed for Batch #106

1. Batch #106 implementation and local validation completed:
   - admin incident workload/correlation/forecast backend, frontend, DB migration, docs, guards and browser smoke added;
   - `ci:core`, `contracts:build`, `api:build`, `test:api`, `test:admin-incidents-frontend`, `test:backend-contract`, DB checks, production-scale guards, runtime smoke, browser smoke, engineering lessons, lint and TypeScript checks passed;
   - final publication steps remain open.

## Completed for Batch #105

1. Batch #105 implementation and validation completed locally:
   - cross-incident admin execution queue, queue export and bulk update added;
   - frontend API, hook, page, nav route and browser smoke added;
   - self-hosted smoke, docs, production-scale guard and CI wiring passed;
   - `ci:core` passed.

## Completed for Batch #104

1. Batch #104 implementation and validation completed locally:
   - durable incident execution migration and contract coverage added;
   - self-hosted execution API routes and admin detail UI added;
   - runtime smoke, e2e, DB guards, self-hosted API guards and production-scale guards passed;
   - `ci:core` passed.

## Completed for Batch #103

1. Batch #103 implementation and validation completed locally:
   - focused frontend tests for admin incidents and admin operations passed;
   - self-hosted admin incidents smoke passed;
   - `check:self-hosted-api`, `check:production-scale-baseline`, `lint`, `tsc -b --noEmit`,
     `smoke:e2e:admin-incident-detail`, `smoke:e2e:admin-incidents` and `ci:core` passed.

## Superseded Batch #102 Publication Steps

1. Batch #102 and Batch #103 have already been superseded by Batch #105 state in this project-memory checkpoint:
   - no Batch #102 publication action remains in this checkpoint;
   - Batch #105 is the active publication target.

## After That

1. Read `HANDOFF.md`.
2. Read `AGENTS.md`, especially the Engineer Agent Action Contract.
3. Continue implementation from confirmed repository evidence.
4. Keep strengthening self-hosted production paths and avoid treating Supabase or hosted BaaS as production backend.
5. Candidate Batch #106: continue self-hosted admin/operator operations by adding another bounded workflow with backend, frontend, tests, smoke/e2e, docs, guards and capacity notes.

## Blockers

- No hard blocker confirmed.
- Detailed current product status is intentionally not reconstructed here beyond repository-level facts.
