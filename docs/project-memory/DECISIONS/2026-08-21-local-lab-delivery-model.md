# Decision: One Local-Lab Branch Per Scope

Date: 2026-08-21
Status: accepted by user

## Decision

- `main` in `sahchandansah1201-glitch/yorso-commerce-hub` is the only server
  source of truth.
- All experimental work for a scope uses one `local-lab/<scope>` branch based
  on current `origin/main`.
- Codex and Lovable use the same branch.
- Do not create `codex/<scope>` or `lovable/test/<scope>` for the same work.
- Merge to `main` happens only by PR after the local-lab Acceptance Gate and
  explicit user approval.

## Why

The previous multi-branch flow created repository/HEAD drift, duplicated work,
and made Lovable reports difficult to verify. One shared lab branch reduces
coordination cost while preserving `main` as the server delivery boundary.

## Consequences

- A branch mismatch is an immediate NO-GO.
- Lovable reports are verified only after syncing the same branch and commit.
- Local validation and server delivery remain separate states.
- Existing historical branches remain history; the rule applies to new work.

## References

- `docs/workflow/local-lab-delivery-workflow.ru.md`
- `docs/workflow/local-lab-acceptance-gate.ru.md`
- `docs/research/agent-role-skill-evaluation-2026-08-21.md`
