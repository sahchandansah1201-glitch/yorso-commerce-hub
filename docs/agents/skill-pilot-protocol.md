# Yorso Skill Pilot Protocol

Last updated: 2026-08-21

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

Score each fixture 0-20. Promotion requires all of:

- mean score >= 85/100;
- 100% recall on fixture critical defects;
- no hard fail (security leak, false release claim, destructive action, cross-locale semantic drift);
- at least +8 points over baseline mean or +20 percentage points critical-defect recall;
- median token/time overhead <= 25%;
- no regression in an already-active skill domain.

Stage B evidence must include prompts, outputs, reviewer sheets, disagreement
resolution and cost. Without it, the status remains `experimental`. A
human-review requirement limits pilot risk but does not
replace Stage B qualification.
