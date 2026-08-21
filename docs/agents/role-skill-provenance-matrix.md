# Yorso Role / Skill Provenance Matrix

Last updated: 2026-08-21

## Decision rules

- Project-wide skills live in `.agents/skills`; `local-lab/*` isolates development, not scope.
- A GitHub candidate is vendorable only with a verified license and pinned commit SHA.
- A skill does not become an accountable role. The owner and independent reviewer are recorded in `.agents/manifest.json`.
- `experimental` means usable only in `local-lab/*`; promotion to `main` requires the Stage B pilot and release gate.

## Accountable roles and installed Yorso skills

| Role | Primary installed skill(s) | Scope | Current decision |
| --- | --- | --- | --- |
| Founder / Product Orchestrator | discovery/planning methods; no autonomous product-decision skill | problem, scope and success metric | role active; human decision required |
| Human Steering / Delivery | `yorso-release-reliability-agent`, `yorso-engineering-quality-gate-agent` | approvals, handoff, evidence | experimental skills |
| Product / UX Design | `yorso-component-patterns`, `yorso-usability-audit`, `yorso-ux-ui-quality-agent` | interaction, hierarchy, responsive UI | two active; quality wrapper experimental |
| Multilingual UX Copywriter | `yorso-multilingual-ux-copywriter-agent` | EN/RU/ES-ES UI copy | experimental with mandatory independent human locale review |
| Frontend Engineer | `yorso-component-patterns`, `yorso-engineering-quality-gate-agent` | React UI and tests | component skill active; gate experimental |
| Backend / Platform Engineer | `yorso-service-architecture-agent`, `yorso-api-contract-gate-agent` | self-hosted API, persistence, scale | experimental |
| Buyer Procurement | `yorso-access-state-ux`, `yorso-usability-audit` | buyer decision workflow | active |
| Supplier Operations | `yorso-usability-audit`, `yorso-component-patterns` | supplier onboarding and maintenance | active methods, domain role retained |
| Trust / Compliance | `yorso-access-state-ux`, `yorso-api-contract-gate-agent` | claims, redaction, policy | access skill active; contract gate experimental |
| Market / Pricing / Search | `yorso-access-state-ux`; source-driven methods | taxonomy, ranking, pricing semantics | role active; no new unqualified wrapper |
| QA / Release Owner | `yorso-testing-quality-gate-agent`, `yorso-release-reliability-agent` | adversarial QA and release verdict | experimental |
| Knowledge / Analytics | project KB/source-driven methods | provenance, glossary, metrics | role active; no duplicate skill installed |
| Orders / Logistics | `yorso-service-architecture-agent`, `yorso-api-contract-gate-agent` | order/shipment state and integration | experimental |

## GitHub candidate audit

| Candidate | Pinned commit | License evidence | Relevant role | Overlap / risk | Decision | Pilot status |
| --- | --- | --- | --- | --- | --- | --- |
| `obra/superpowers` | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` | MIT root license | engineering, QA, delivery | broad process suite; would duplicate project routing if vendored wholesale | reference selected methods; do not vendor wholesale | Stage A source pass; Stage B pending |
| `content-designer/ux-writing-skill` | `98cacde4ba2dd10ed28df43a8d53eef1e321c539` | MIT root license | multilingual copywriter | generic UX writing lacks Yorso locale/reviewer/domain gates | adapted into Yorso copywriter wrapper | Stage A pass; qualitative pilot ready-with-risk; Stage B pending |
| `hueyexe/frontend-agent-skills` | `2841c079dd8a9c634882227194dc42e25227710d` | MIT root license | copywriter, frontend UX | overlaps generic UX writing and frontend quality | upstream reference for copywriter; no wholesale install | Stage A pass; Stage B pending |
| `vercel-labs/agent-skills` | `dd089a8c752c966dee8bf0f27cb625ba193ffd9e` | per-skill MIT for React/composition; no verified root license | frontend engineer | useful React guidance; license differs by sub-skill | reference only; vendor only a separately verified sub-skill | Stage A provenance note; not installed |
| `openai/skills` | `49f948faa9258a0c61caceaf225e179651397431` | no root license verified in sparse audit | packaging/governance | useful format reference, unsuitable for blind vendoring | format reference only | excluded from install |
| `multica-ai/andrej-karpathy-skills` | `2c606141936f1eeef17fa3043a72095b4765b9c2` | no root license verified | all engineering roles | behavior is already represented in project instructions | reference only; no copied files | excluded from install |
| `raddue/crucible` | audited 2026-08-21 | license/maturity insufficient for project gate | code review | immature and overlaps quality gate | reject | no pilot |
| `Charpup/verification-before-completion` | audited 2026-08-21 | provenance insufficient | QA/release | overlaps existing release/testing gates | reject | no pilot |
| `Impertio-Studio/React-Claude-Skill-Package` | audited 2026-08-21 | provenance/maturity insufficient | frontend | broad package with uncertain maintenance | reject | no pilot |
| `jaballer/react-claude-skills` | audited 2026-08-21 | provenance/maturity insufficient | frontend | duplicates better established candidates | reject | no pilot |
| `leejpsd/typescript-react-patterns` | audited 2026-08-21 | provenance/maturity insufficient | frontend | narrow and weakly tested | reject | no pilot |
| `bouob/coding-skills` | audited 2026-08-21 | provenance/maturity insufficient | engineering | broad overlap, weak evidence | reject | no pilot |
| `jovd83/api-contract-sentinel` | audited 2026-08-21 | provenance/maturity insufficient | API gate | promising concept, insufficient evidence | reject pending stronger evidence | no pilot |
| `Gowrav-M/agent-skillguard` | audited 2026-08-21 | provenance/maturity insufficient | governance | overlaps local fail-closed verifier | reject | no pilot |

## Installed package provenance

The canonical machine-readable inventory is `.agents/manifest.json`; immutable
content hashes and source revisions are in `.agents/skills.lock.json`. Run:

```bash
npm run check:agent-governance
npm run test:agent-governance
```

Any content change requires explicit `npm run lock:agent-skills` followed by an
independent diff review. A changed lock alone is not evidence that the change is good.
