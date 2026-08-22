# Yorso Skill Pilot Protocol

Last updated: 2026-08-22

## Objective

Measure whether a candidate skill improves defect discovery and decision quality
without excessive context or latency. A structural install is not a qualification.

## Stage A: structural and provenance screen

Required for every candidate:

- pinned 40-character source revision;
- verified license or explicit `reference-only` decision;
- unique skill name and canonical project path;
- explicit owner and independent reviewer;
- no unresolved dependency, routing or scope collision;
- current content hash in `.agents/skills.lock.json`;
- `npm run check:agent-governance` and negative tests pass.

Failure at Stage A rejects the candidate from installation.

## Stage B: comparative quality pilot

For each finalist run five fixtures in two arms, three repeats per arm:

- baseline arm: same model, tools, context and budget without the candidate;
- candidate arm: identical setup with only the candidate skill added.

Randomize arm order. Blind the outputs. Use two reviewers and require Cohen's
kappa >= 0.75 before interpreting scores.

### Fixtures

| ID | Surface | Critical behavior |
| --- | --- | --- |
| F1 | meta-region country builder | repeated add, duplicate block, remove, reload, keyboard, 390px |
| F2 | multilingual UI copy | EN/RU/ES-ES equivalence, enum leak, plural, truncation |
| F3 | React interaction defect | stable keys, nested controls, focus, sticky overlap, repeated action |
| F4 | API/storage drift | field mismatch, DTO/migration/error-envelope evidence |
| F5 | release evidence | reject unsupported completion claim, require exact missing proof |

### Scoring and promotion

Score every reviewed run from 0 to 100. Promotion requires all of:

- mean score >= 85/100;
- 100% recall on fixture critical defects;
- no hard fail (security leak, false release claim, destructive action, cross-locale semantic drift);
- at least +8 points over baseline mean or +20 percentage points critical-defect recall;
- median token/time overhead <= 25%;
- no regression in an already-active skill domain.

Stage B evidence must include prompts, outputs, machine-readable reviewer
sheets, disagreement resolution and cost. Without it, the status remains
`experimental`. A human-review requirement limits pilot risk but does not
replace Stage B qualification.

### Machine-enforced evidence contract

Stage B reports require `schemaVersion: 5`; reviewer sheets require
`schemaVersion: 3`. Each active adapted skill must have its own
evidence file, and the manifest must map the skill id to that file through
`branchPolicy.stageBEvidenceBySkill`. The same evidence file cannot qualify two
skills. Each report binds all of the following to one evaluated Git commit:

- the candidate skill id and its locked content SHA-256;
- the SHA-256 of `docs/agents/pilots/fixture-oracle.json`, which is the only
  source of critical-defect denominators;
- fixtures `F1` through `F5`, arms `baseline` and `candidate`, and repeats 1-3;
- all 30 unique fixture/arm/repeat run tuples;
- positive `costUnits` on every run;
- five prompt artifacts used exactly six times each and 30 distinct structured
  output artifacts used exactly once; every output binds its run tuple,
  evaluated commit, skill id and content hash and records the oracle defect ids
  it actually found with bounded excerpts;
- exactly two JSON reviewer sheets bound to the candidate skill and covering
  every run tuple exactly once,
  disagreement resolution and a cost report;
- a SHA-256 checksum, unique repository path and unique content hash for every
  evidence artifact;
- two canonical reviewer identities whose records reference their
  checksum-bound sheets;
- explicit empty `hardFailures` and `regressions` arrays;
- baseline/candidate score and recall, Cohen's kappa and median overhead that
  exactly match values recomputed from reviewer sheets and run costs.

Reviewer and approver ids must be registered in `.agents/actors.json`, have the
required role, provide an Ed25519 public key and belong to distinct canonical
independence groups. Reviewer sheets and promotion approvals must carry valid
signatures over their canonical payloads. IDs are canonical:
lowercase, trimmed and limited to ASCII letters, digits, `.`, `_` and `-`.
The governance gate rejects aliases, reviewer-supplied defect denominators,
unknown defect ids, undefined agreement, missing or manually altered metrics,
incomplete reviewer coverage, and artifact path or byte reuse within or across
skills. It also rejects checksum drift, path/symlink escapes, stale evidence and
any uncommitted change on the governed surface. Freshness covers all of
`docs/agents`, `.agents`, project memory, CI, package scripts and governance,
mutation, provider-boundary and memory checks/tests.

When Stage B or promotion is evaluated as passed, the actor registry itself must
match the trusted SHA-256 supplied out-of-band through
`YORSO_TRUSTED_ACTOR_REGISTRY_SHA256`; repository edits cannot redefine trusted
actors silently.

Main promotion uses a separate `schemaVersion: 5` record. It must repeat the
exact `stageBEvidenceBySkill` mapping, requires two unique canonical approvers,
requires registered approvers from distinct independence groups, and requires
distinct-path and distinct-content evidence for independent review, governance,
project memory, relevant product tests and non-mutating gates. Every gate
artifact is structured and binds the reviewed commit, exact command, zero exit
code, timestamps and stdout digest. A pull request targeting `main` is evaluated
under this production policy even when its head branch is `local-lab/*`.
