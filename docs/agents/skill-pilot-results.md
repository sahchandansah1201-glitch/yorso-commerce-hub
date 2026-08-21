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
- External-source provenance is verified against the exact upstream file
  content at the pinned commit SHA, not only against a declared repository URL.
- Stage B evidence and any future main-promotion evidence have versioned,
  fail-closed schemas. A status flag alone cannot mark a pilot or promotion as
  passed.
- External candidate matrix records license/SHA/overlap/rejection decisions.
- Five fixed Stage B fixtures are versioned under `docs/agents/pilots/fixtures/`.
- Expanded pre-foundation project-memory snapshots are preserved as
  checksum-pinned gzip archives and are checked for tampering.
- Baseline project build, typecheck and provider boundary were green before governance changes.

## What this does not prove

- It does not prove a 30% improvement for every role.
- It does not prove lower token use or faster delivery.
- It does not authorize merge to `main`.

Those claims require the 30-run-per-finalist Stage B protocol. Keeping the
skills experimental is the fail-closed result, not an incomplete installation.
