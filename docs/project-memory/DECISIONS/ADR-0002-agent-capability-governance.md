# ADR-0002: Project-Wide Agent Capability Governance

Date: 2026-08-21

Status: accepted for `local-lab/agent-capability-foundation`; promotion to
`main` remains gated.

## Context

Yorso needs reusable project-wide roles and skills, including multilingual UX
copywriting, engineering, architecture, product/UX and independent QA. Earlier
skills were copied without one machine-readable registry, immutable provenance
or a reliable independent-review rule. Several local instructions also drifted
from current component and access APIs.

## Decision

- Store project-wide roles and skills under `.agents/`.
- Register every role and skill in `.agents/manifest.json`.
- Pin skill contents and source revisions in `.agents/skills.lock.json`.
- Require different owner and reviewer roles.
- Run governance, project-memory and provider-boundary checks through
  `check:gate-mutation` before core CI, then run their adversarial tests.
- Support two explicit Stage B qualification modes:
  - `owner-directive` activates a fully executed, signed pilot for operational
    use on `local-lab/*` without claiming independent review, measured uplift
    or production-promotion authorization;
  - `independent-review` requires signed reviewer sheets and promotion
    approvals for comparative-quality claims and promotion to `main`.
  A passed independent-review result trusts `.agents/actors.json` only when its
  digest matches an out-of-band trust anchor.
- Bind each reviewer signature to the evaluated commit, candidate skill hash,
  fixture-oracle hash and exact output path/SHA mapping.
- Separate the reviewed candidate commit from later evidence/project-memory
  attestations. Any later tracked change outside those two recording layers
  invalidates the reviewed candidate commit.
- Keep verification commands non-mutating. Cleanup is an explicit maintenance
  action, never a hidden pre-check or pre-build side effect.
- Develop and pilot in `local-lab/<scope>`. `main` remains the server source of
  truth and requires independent review plus relevant product acceptance.

## Consequences

The project can detect unregistered roles, skill content drift, missing source
provenance, self-review, reviewer-output replay and stale candidate content.
Stage A structural validation is automated. A project-owner directive can
qualify a complete Stage B execution campaign for experimental operational use,
but cannot establish comparative quality or authorize production promotion.
Those claims remain an independent human-reviewed gate. Repository-backed
validator fixtures do not substitute for real CI execution, signed Stage B
runs or the evidence required by the selected qualification mode.
