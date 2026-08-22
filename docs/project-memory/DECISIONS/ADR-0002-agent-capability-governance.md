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
- Require structured Stage B outputs, signed reviewer sheets and signed
  promotion approvals. A passed result trusts `.agents/actors.json` only when
  its digest matches an out-of-band trust anchor.
- Keep verification commands non-mutating. Cleanup is an explicit maintenance
  action, never a hidden pre-check or pre-build side effect.
- Develop and pilot in `local-lab/<scope>`. `main` remains the server source of
  truth and requires independent review plus relevant product acceptance.

## Consequences

The project can detect unregistered roles, skill content drift, missing source
provenance, self-review and stale handoff state. Stage A structural validation
is automated. Stage B comparative quality pilots remain a human-reviewed gate;
no percentage improvement is claimed until those pilots pass.
