---
name: yorso-lovable-sync-verification
description: Use after a Lovable batch to verify the exact GitHub branch, HEAD, diff, checks and visual evidence before claiming the work is synced or complete.
---

# Yorso Lovable Sync Verification

## Purpose

Prevent false sync and completion claims. This gate verifies current repository
state and delivery evidence independently of the implementation response.

## Verification Contract

1. Report canonical repository, active branch, local HEAD, remote branch HEAD
   and working-tree status.
2. Stop if `main` was changed when the task belongs to `local-lab/<scope>`.
3. List changed files and inspect the actual diff against the accepted base.
4. Confirm that every reported file exists and every reported deletion is real.
5. Run the exact scoped type, lint, unit, browser, build and provider-boundary
   checks required by the batch. Preserve exact pass/fail counts.
6. Confirm screenshots exist and correspond to the tested HEAD.
7. Report console/page errors, conflicts, generated scaffold and unverified
   acceptance items.
8. Never call a workspace GitHub-synced unless the relevant remote ref contains
   the verified commit.

## Output

Report in Russian:

| Проверка | Ожидание | Факт | Статус |
|---|---|---|---|

Then include:

- repository, branch and commit SHA;
- changed files and diff scope;
- exact commands and results;
- screenshot paths;
- provider-free status;
- conflicts and residual risks;
- final verdict: `VERIFIED`, `NOT SYNCED` or `BLOCKED`.
