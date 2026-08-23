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
`schemaVersion: 4`. Each active adapted skill must have its own
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
- exactly two JSON reviewer sheets bound to the evaluated commit, candidate
  skill content hash, fixture-oracle hash and every run output path plus
  SHA-256, covering every run tuple exactly once,
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
incomplete reviewer coverage, reviewer-sheet replay after an output changes,
and artifact path or byte reuse within or across skills. It also rejects
checksum drift, path/symlink escapes, stale evidence and any uncommitted change
on the reviewed candidate surface.

Candidate freshness and evidence attestation are separate commits by design.
The reviewed candidate surface covers every tracked repository path except
`docs/agents/pilots/results` and `docs/project-memory`. Those two recording
layers may be committed after the candidate commit, while all evidence bytes
remain checksum-bound and reviewer sheets remain signature-bound. Any later
change elsewhere in the repository invalidates the reviewed candidate commit.
The governance test suite exercises this two-level model in a real temporary
Git repository without bypassing repository inspection.

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

### Operational tooling

The executable workflow is documented in
`docs/agents/stage-b-operator-runbook.md`. The supported commands are:

- `npm run stage-b:init -- --pilot <id> --skill <id>`: create 30 randomized
  executor tasks in ignored `.data/stage-b/<id>` from a clean committed HEAD;
- `npm run stage-b:next -- --pilot <id> --executor <id> [--task <task-id>]`:
  assign the task once to a registered `stage-b-executor` and create an isolated
  packet from the evaluated commit; baseline packets omit all candidate identity
  and skill material;
- `npm run stage-b:prepare-submission -- --pilot <id> --task <task-id>
  --executor <id> --response-file <file> --payload-file <file>`: generate the
  exact canonical payload that the assigned executor signs outside the
  repository with its Ed25519 private key;
- `npm run stage-b:submit-output -- --pilot <id> --task <task-id> --executor
  <id> --response-file <file> --signature-file <file>`: reject assignment,
  packet, response, actor-key or signature drift and wrap the response with
  verified Ed25519 and SHA-256 provenance;
- `npm run stage-b:prepare-review -- --pilot <id>`: reject incomplete or
  unsigned/identity-mismatched outputs and create a reviewer packet without
  skill/arm identity plus a blind decision template keyed only by
  `reviewItemId`;
- `npm run stage-b:prepare-review-submission -- --pilot <id> --reviewer <id>
  --review-file <external-file> --payload-file <external-file>`: require a
  complete blind human draft, reject arm/run/candidate leakage, then freeze the
  decisions into a canonical schema-version-4 payload bound to the candidate,
  evaluated commit, oracle, packet and every current output SHA-256;
- `npm run stage-b:submit-review -- --pilot <id> --reviewer <id>
  --payload-file <external-file> --signature-file <external-file>`: verify the
  registered reviewer's detached Ed25519 signature, reject stale evidence and
  store one immutable signed reviewer sheet;
- `npm run stage-b:register-actor -- ...`: enrol only an Ed25519 public key;
- `npm run stage-b:status -- --pilot <id>`: report concrete blockers and return
  exit code 2 while qualification is incomplete;
- `npm run stage-b:qualify -- --pilot <id>`: require real workspace evidence,
  signed independent review, an out-of-band trusted registry digest and a fully
  valid repository evidence mapping;
- `npm run check:main-promotion`: evaluate the separate production policy
  without mutating the repository.

Reviewers complete all decisions while the packet is still blind. Run keys and
candidate identity are introduced only by the payload-preparation command after
the draft is final. Tooling never creates a reviewer identity, private key,
score, signature or promotion decision. Missing human evidence remains a hard
blocker.
