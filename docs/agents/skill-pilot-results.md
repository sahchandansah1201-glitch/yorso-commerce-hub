# Yorso Skill Pilot Results

Last updated: 2026-08-22

## Current verdict

The capability foundation is **GO for structural use inside the
`local-lab/agent-capability-foundation` branch** and **NO-GO for automatic
production promotion**. Stage A structural/provenance validation is complete;
Stage B comparative qualification is not complete.

| Candidate / package | Stage A | Qualitative review | Stage B | Current status |
| --- | --- | --- | --- | --- |
| Existing access/component/usability skills | pass after repository-drift corrections | repository-grounded review | not required for current active status; future changes require regression pilot | active |
| Multilingual UX copywriter | pass | ready for a controlled pilot: exact locale, independent review, glossary and ICU gates added | pending | experimental with mandatory human review |
| Engineering quality gate | pass | useful completion checklist; overlaps release/testing by design | pending | experimental |
| Testing quality gate | pass | strong repeated-flow and evidence critique | pending | experimental |
| API contract gate | pass | useful contract-drift lens | pending | experimental |
| Service architecture | pass | enforces self-hosted and 10k-user design questions | pending | experimental |
| Release reliability | pass | rejects vague synced/done claims | pending | experimental |
| Lovable component brief | pass | useful only for explicit Lovable handoff | pending | experimental |
| UX/UI quality | pass | broad quality lens; must not duplicate product owner | pending | experimental |

## Evidence produced in this branch

- 13 accountable agent profiles with explicit reviewer separation.
- 11 registered skills with provenance and content hashes.
- Governance verifier passes and fails closed on hash drift, false provenance,
  self-review, dependency cycles, unsafe paths, symlinks and unregistered
  role/skill paths.
- External-source declarations are pinned to an allowlisted repository,
  40-character revision and verified license. The local Yorso adaptation is
  protected by its own content hash. The gate does not currently re-fetch and
  compare upstream blob bytes, so metadata provenance must not be described as
  exact upstream-content verification.
- Stage B evidence and any future main-promotion evidence use version 5,
  fail-closed schemas. Qualification is per skill and binds the skill id and
  locked content hash to a checksum-bound fixture oracle, complete run tuples,
  candidate-bound signed reviewer sheets, structured run outputs and
  independently recomputed metrics. Registered reviewers/approvers must come
  from distinct canonical independence groups and be validated against an
  out-of-band trusted actor-registry digest;
  artifact paths and bytes are unique across skills; the complete governed
  surface must be committed and fresh. A status flag, reviewer-supplied
  denominator, placeholder output, unsigned approval or hand-entered metric
  cannot mark a pilot or promotion passed. Promotion gate artifacts bind the
  exact reviewed commit, command, zero exit status and stdout digest.
- `.agents/actors.json` is intentionally empty. Until real human reviewers and
  approvers are registered, Stage B and promotion fail closed.
- External candidate matrix records license/SHA/overlap/rejection decisions.
- Five fixed Stage B fixtures are versioned under `docs/agents/pilots/fixtures/`.
- Expanded pre-foundation project-memory snapshots are preserved as
  checksum-pinned gzip archives and are checked for tampering.
- Baseline project build, typecheck and provider boundary were green before governance changes.

## What this does not prove

- It does not prove a 30% improvement for every role.
- It does not prove lower token use or faster delivery.
- It does not authorize merge to `main`.
- It does not prove the local adaptation is byte-identical to an upstream skill
  file; the local adaptation is intentionally project-specific.

Those claims require the 30-run-per-finalist Stage B protocol. Keeping the
skills experimental is the fail-closed result, not an incomplete installation.
