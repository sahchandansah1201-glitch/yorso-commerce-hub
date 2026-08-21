# Yorso Skill Routing

Last updated: 2026-08-21

## Routing order

1. Identify one accountable role from `.agents/agents/`.
2. Load the narrowest active skill matching the changed surface.
3. Add one quality lens only when its trigger is present.
4. Use experimental skills only on `local-lab/*` and label their conclusions provisional.
5. Route completion evidence to a different reviewer role.

## Trigger map

| Change | Owner | Required skill(s) | Independent gate |
| --- | --- | --- | --- |
| Access, price or supplier identity | Trust / Compliance | `yorso-access-state-ux` | QA / Release |
| Account/catalog UI | Product / UX + Frontend | `yorso-component-patterns`, `yorso-usability-audit` | QA / Release |
| Non-trivial UX/UI or Lovable brief | Product / UX | `yorso-ux-ui-quality-agent`; `yorso-lovable-component-brief-agent` only for handoff | Frontend + QA |
| UI copy or translation | Multilingual Copywriter | `yorso-multilingual-ux-copywriter-agent` | native locale reviewer + domain owner |
| API, DTO or storage contract | Backend / Platform | `yorso-api-contract-gate-agent` | QA + Trust |
| Service architecture or runtime scale | Backend / Platform | `yorso-service-architecture-agent` | Trust + QA |
| Any implementation completion claim | Implementing role | `yorso-engineering-quality-gate-agent` | QA / Release |
| Release, sync or phase closure | QA / Release | `yorso-testing-quality-gate-agent`, `yorso-release-reliability-agent` | Human Steering |

## Conflict resolution

- Business policy beats presentation preference.
- API/storage contract beats UI inference.
- Trust/redaction policy beats conversion optimization.
- A test pass does not overrule a reproduced human-flow defect.
- A skill author cannot be its only reviewer.
- When two skills prescribe different UI patterns, the existing repository component and route behavior win until the product owner approves a migration.

## Prohibited routing

- Do not invoke all skills for every task.
- Do not treat a skill as a subagent or an accountable owner.
- Do not publish copy with `locale-review: pending`.
- Do not promote an `experimental` skill to `main` based only on structural checks.
- Do not let a verifier delete or rewrite files before reporting a violation.
