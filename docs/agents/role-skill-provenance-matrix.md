# Yorso Role / Skill Provenance Matrix

Last updated: 2026-08-23

## Decision rules

- Project-wide skills live in `.agents/skills`; `local-lab/*` isolates development, not scope.
- A GitHub candidate is vendorable only with a verified license and pinned commit SHA.
- A skill does not become an accountable role. The owner and independent reviewer are recorded in `.agents/manifest.json`.
- `experimental` means usable only in `local-lab/*`; promotion to `main` requires the Stage B pilot and release gate.
- Discovery uses both Exa deep search and the Codex skills index. GitHub API
  evidence then binds repository state, license and full commit SHA.
- A popular or well-packaged skill is not automatically Yorso-ready. Domain
  fit, tests/evals, overlap and fail-closed behavior are separate gates.

## Accountable roles and installed Yorso skills

| Role | Primary installed skill(s) | Scope | External qualification decision |
| --- | --- | --- | --- |
| Founder / Product Orchestrator | discovery/planning methods; no autonomous product-decision skill | problem, scope and success metric | `EveryInc/compound-engineering-plugin` strategy methods are a qualified reference; `assimovt/productskills` is supplementary; human decision remains mandatory |
| Human Steering / Delivery | `yorso-release-reliability-agent`, `yorso-engineering-quality-gate-agent` | approvals, handoff, evidence | EveryInc review/planning methods are a qualified reference; archived workflow candidates rejected |
| Product / UX Design | `yorso-component-patterns`, `yorso-usability-audit`, `yorso-ux-ui-quality-agent` | interaction, hierarchy, responsive UI | `ghaida/intent` is the primary research reference; real browser and user evidence remain mandatory |
| Multilingual UX Copywriter | `yorso-multilingual-ux-copywriter-agent` | EN/RU/ES-ES UI copy | current Yorso adaptation of `content-designer/ux-writing-skill` remains primary; no replacement found |
| Frontend Engineer | `yorso-component-patterns`, `yorso-engineering-quality-gate-agent` | React UI and tests | `addyosmani/web-quality-skills` is qualified as a reference, not installed wholesale |
| Backend / Platform Engineer | `yorso-service-architecture-agent`, `yorso-api-contract-gate-agent` | self-hosted API, persistence, scale | `mblode/agent-skills` architecture methods are a qualified reference; project contracts remain authoritative |
| Buyer Procurement | `yorso-access-state-ux`, `yorso-usability-audit` | buyer decision workflow | `rampstackco/claude-skills` vendor evaluation is adjacent only; no seafood procurement skill passed domain fit |
| Supplier Operations | `yorso-usability-audit`, `yorso-component-patterns` | supplier onboarding and maintenance | `alirezarezvani/claude-skills` vendor-management methods are reference-only because they are SaaS-oriented |
| Trust / Compliance | `yorso-access-state-ux`, `yorso-api-contract-gate-agent` | claims, redaction, policy | supply-chain and food-safety skills are reference-only; official regulator and certifier sources remain required |
| Market / Pricing / Search | `yorso-access-state-ux`; source-driven methods | taxonomy, ranking, pricing semantics | `phuryn/pm-skills` market research is reference-only; it does not supply seafood pricing/search semantics |
| QA / Release Owner | `yorso-testing-quality-gate-agent`, `yorso-release-reliability-agent` | adversarial QA and release verdict | `petrkindlmann/qa-skills` is adapted narrowly as experimental `yorso-adversarial-test-review-pilot`; it is not role-active and requires Stage B qualification |
| Knowledge / Analytics | project KB/source-driven methods | provenance, glossary, metrics | Firecrawl workflows are service-coupled; use source/evidence patterns without adding the service |
| Orders / Logistics | `yorso-service-architecture-agent`, `yorso-api-contract-gate-agent` | order/shipment state and integration | `affaan-m/ECC` has useful customs/logistics material but is broad; reference/pilot only |

## Deep-search qualification result

The detailed evidence ledger is
[`research/role-skill-deep-search-2026-08-23.md`](research/role-skill-deep-search-2026-08-23.md).
The role search produced references and pilot candidates, not thirteen automatic
installations. Installation requires a narrower content audit, immutable lock,
Stage B pilot and independent review.

| Candidate | Pinned commit | License | Role(s) | Decision |
| --- | --- | --- | --- | --- |
| `EveryInc/compound-engineering-plugin` | `56cb13aa15799d9c0fd01a82d0f4877043395841` | MIT | founder, delivery | qualified reference; broad plugin not vendored |
| `assimovt/productskills` | `66f9cee5868d6daf9cf106b4a74090428d6fa83e` | MIT | founder | supplementary reference |
| `ghaida/intent` | `b89a519eb570fe7ec61de1eb51f553af0306b515` | CC0-1.0 | product/UX | qualified research reference |
| `vasilyu1983/AI-Agents-public` | `53f6cb73ea53a2646e3e7d4665062ad66f3683ac` | MIT | product/UX | alternate reference |
| `content-designer/ux-writing-skill` | `98cacde4ba2dd10ed28df43a8d53eef1e321c539` | MIT | copywriter | already adapted into Yorso wrapper |
| `addyosmani/web-quality-skills` | `95d6e255afe1596b557d7a8498517884438f5b3a` | MIT | frontend | qualified reference |
| `mblode/agent-skills` | `2e575d39f28acdc698ea22e4c62325801188e1b1` | MIT | backend/platform | qualified reference |
| `exceptionless/Exceptionless` | `9fa81b49ed776c7bbda86ada5492e21d63c9ec6a` | Apache-2.0 | backend/platform | observability alternate, not a role skill |
| `rampstackco/claude-skills` | `0479242522549dfdb389bb9b7807ad4d6016ffb7` | MIT | procurement, knowledge | adjacent patterns only |
| `alirezarezvani/claude-skills` | `98180dafc4f0bc9d629bd479fc6107674cfb3cf8` | MIT | supplier operations | reference-only; SaaS bias |
| `kishorkukreja/awesome-supply-chain` | `f8cf557df58af5a39de99016f2273904afa6d09b` | MIT | compliance | supply-chain reference only |
| `sickn33/agentic-awesome-skills` | `b6ceca367a3b3ee90a273a3afa895960e8e9d7a5` | MIT | compliance | food-safety reference only |
| `phuryn/pm-skills` | `18468a95b427e70e258b51389796367c6f684e7d` | MIT | market/pricing/search | market-research reference only |
| `petrkindlmann/qa-skills` | `b3bb61bd268b147476252c6ed5a0440c87b97441` | MIT | QA/release | narrow Stage A adaptation registered as experimental; upstream evals present; role activation blocked pending Stage B |
| `nchemb/super-smoke-test` | `db5ab7f18bc20e528937d3b50aa0afe39ed99389` | MIT | QA/release | smoke-test reference only |
| `firecrawl/firecrawl-workflows` | `94cc91229d6cedc0613f140d3d013b150bc8e1b0` | ISC | knowledge/analytics | reference only; external-service coupling |
| `affaan-m/ECC` | `d8409a4b0813771235555e32e3d8046a73988bfa` | MIT | orders/logistics | qualified reference/pilot candidate; broad scope |

Rejected after the repeated search: `catlog22/Claude-Code-Workflow` is
archived; `yak33/customs-skill` was unavailable; `dnotitia/akb` did not expose
a verifiable repository license; `vercel-labs/agent-skills` still requires
per-skill license verification instead of root-level vendoring.

## Installed package provenance

The canonical machine-readable inventory is `.agents/manifest.json`; immutable
content hashes and source revisions are in `.agents/skills.lock.json`. Run:

```bash
npm run check:agent-governance
npm run test:agent-governance
```

Any content change requires explicit `npm run lock:agent-skills` followed by an
independent diff review. A changed lock alone is not evidence that the change is good.
