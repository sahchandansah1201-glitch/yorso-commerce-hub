# Yorso Skill Pilot Results

Last updated: 2026-08-23

## Current verdict

The capability foundation is **GO for operational use inside the
`local-lab/agent-capability-foundation` branch** and **NO-GO for automatic
production promotion**. Stage A structural/provenance validation is complete.
The multilingual UX copywriter passed Stage B in `owner-directive` mode after
30/30 signed executions. Independent comparative review is not complete, so no
measured quality-uplift claim is made.

| Candidate / package | Stage A | Qualitative review | Stage B | Current status |
| --- | --- | --- | --- | --- |
| Existing access/component/usability skills | pass after repository-drift corrections | repository-grounded review | not required for current active status; future changes require regression pilot | active |
| Multilingual UX copywriter | pass | exact locale, glossary and ICU gates added | passed: owner-directive | active on `local-lab/*`; independent review and main promotion remain separate |
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
  artifact paths and bytes are unique across skills. Reviewer sheet schema 4
  signs the evaluated commit, candidate content hash, fixture-oracle hash and
  every run output path plus SHA-256. The complete tracked candidate surface,
  excluding only the evidence-results and project-memory recording layers,
  must be committed and fresh. A status flag, reviewer-supplied
  denominator, placeholder output, unsigned approval or hand-entered metric
  cannot mark a pilot or promotion passed. Promotion gate artifacts bind the
  exact reviewed commit, command, zero exit status and stdout digest.
- Real Git integration tests prove that later signed evidence/project-memory
  commits are accepted while any later candidate-source or configuration change
  makes the reviewed commit stale. These tests are synthetic gate tests, not
  real Stage B qualification evidence.
- `.agents/actors.json` contains one public-key-only Stage B executor and no
  human reviewers or approvers. This is sufficient only for the completed
  owner-directive operational qualification. Independent-review claims and
  promotion remain closed until the required humans and trust anchor exist.
- The reviewer operator workflow is executable: a human completes a blind
  30-item draft keyed only by `reviewItemId`; tooling then freezes it into a
  candidate/output-bound schema-version-4 payload, verifies an external
  Ed25519 signature and revalidates stored sheets against current evidence.
  This workflow has regression coverage but no real reviewer decisions yet.
- External candidate matrix records license/SHA/overlap/rejection decisions.
- Five fixed Stage B fixtures are versioned under `docs/agents/pilots/fixtures/`.
- `copywriter-2026-08` records 30/30 immutable assignments, 30/30 valid signed
  outputs, zero invalid outputs and six explicitly blocked responses. The owner
  directive and qualification evidence are checksum-bound under
  `docs/agents/pilots/owner-directives/` and
  `docs/agents/pilots/results/copywriter-2026-08/`.
- Expanded pre-foundation project-memory snapshots are preserved as
  checksum-pinned gzip archives and are checked for tampering.
- Baseline project build, typecheck and provider boundary were green before governance changes.

## What this does not prove

- It does not prove a 30% improvement for every role.
- It does not prove lower token use or faster delivery.
- It does not authorize merge to `main`.
- It does not prove the local adaptation is byte-identical to an upstream skill
  file; the local adaptation is intentionally project-specific.

Those claims require the independent-review path and separate production
promotion gate. Owner-directed operational use is a narrower, explicit result,
not evidence for the claims above.
