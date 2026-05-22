# Run: Batch #107 Size Gate

Date: 2026-05-22

## Baseline

Batch #106:

- `git show --shortstat --oneline 5e155fca --`
- result: `39 files changed, 3872 insertions(+), 48 deletions(-)`

## Required Batch #107 Minimum

20 percent larger:

- files: `ceil(39 * 1.2) = 47`
- insertions: `ceil(3872 * 1.2) = 4647`

## First Batch #107 Measurement

Initial untracked-aware measurement before docs/memory expansion:

- files: 23
- insertions: 3146
- deletions: 11

## Gap

The initial Batch #107 implementation was not large enough:

- remaining files: 24
- remaining insertions: 1501

## Action

Expand Batch #107 with:

- dedicated trend docs;
- runtime smoke docs;
- e2e docs;
- contract docs;
- project-memory decision and run notes;
- backend contract tests;
- production-scale and architecture updates;
- validation and guard updates.

## Rule

The batch is not publishable until the final untracked-aware measurement is at
or above 47 files and 4647 insertions.
