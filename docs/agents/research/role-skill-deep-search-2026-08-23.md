# Role Skill Deep Search Evidence

Дата: 2026-08-23

## Метод

Для каждой из 13 ролей выполнены два независимых discovery-прохода:

1. Exa deep search по GitHub и документации кандидатов.
2. Поиск в Codex skills index через `npx skills find`.

После discovery GitHub API использован для проверки полного commit SHA,
лицензии, состояния archive и базового maturity signal. Оценка разделяла:
provenance, domain fit, overlap, tests/evals и возможность fail-closed пилота.
Количество звёзд не использовалось как доказательство качества.

## Результат по ролям

| Роль | Основной кандидат | Альтернатива | Доказательства | Решение и незакрытый пробел |
| --- | --- | --- | --- | --- |
| Founder / Product Orchestrator | `EveryInc/compound-engineering-plugin` | `assimovt/productskills` | MIT; pinned SHA; активные репозитории | Использовать strategy/prioritization как reference. Автономное продуктовое решение запрещено; human approval остаётся. |
| Human Steering / Delivery | `EveryInc/compound-engineering-plugin` | `obra/superpowers` из предыдущего аудита | MIT; planning/review methods | Не vendor-ить broad suite. Исполняемый Yorso cycle и evidence manifest остаются источником правды. |
| Product / UX Design | `ghaida/intent` | `vasilyu1983/AI-Agents-public` | CC0-1.0 / MIT; pinned SHA | Intent выбран как research reference. Ни один skill не заменяет browser flow, usability evidence и 390 px QA. |
| Multilingual UX Copywriter | `content-designer/ux-writing-skill` | generic UX-writing candidates из index | MIT; существующая Yorso adaptation | Текущий `yorso-multilingual-ux-copywriter-agent` остаётся primary: он добавляет EN/RU/ES-ES, domain terms и reviewer gates. |
| Frontend Engineer | `addyosmani/web-quality-skills` | per-skill material из `vercel-labs/agent-skills` | MIT root у основного; Vercel требует per-skill check | Web quality выбран как reference. Wholesale install создаст overlap с component, a11y, performance и test gates. |
| Backend / Platform Engineer | `mblode/agent-skills` | `exceptionless/Exceptionless` | MIT / Apache-2.0; pinned SHA | Architecture methods reference-only. Exceptionless — implementation/observability source, не skill-владелец архитектуры. |
| Buyer Procurement | `rampstackco/claude-skills` vendor evaluation | — | MIT; pinned SHA | Только adjacent reference. Seafood procurement, seasonality, Incoterms и buyer approval требуют локального domain contract. |
| Supplier Operations | `alirezarezvani/claude-skills` vendor management | `rampstackco/claude-skills` | MIT; pinned SHA | Reference-only из-за SaaS bias. Нужны Yorso-specific supplier document, branch, capacity и qualification flows. |
| Trust / Compliance | `kishorkukreja/awesome-supply-chain` | `sickn33/agentic-awesome-skills` food safety | MIT; pinned SHA | Нельзя использовать как нормативный источник. Требуются official regulator/certifier sources и source dates. |
| Market / Pricing / Search | `phuryn/pm-skills` market research | — | MIT; pinned SHA | Подходит для research framing, не для seafood taxonomy, ranking, availability или price semantics. |
| QA / Release Owner | `petrkindlmann/qa-skills` | `nchemb/super-smoke-test` | MIT; pinned SHA; у основного есть eval-oriented structure | Лучший кандидат на следующий Stage B pilot. Пилот должен найти seeded defect и не дублировать локальные gates. |
| Knowledge / Analytics | `firecrawl/firecrawl-workflows` | `rampstackco/claude-skills` evidence reviews | ISC / MIT; pinned SHA | Firecrawl service-coupled, поэтому не устанавливать для self-hosted baseline. Использовать только ingestion/evidence patterns. |
| Orders / Logistics | `affaan-m/ECC` customs/logistics content | supply-chain references | MIT; pinned SHA | Сильный reference/pilot candidate, но слишком широкий. Нужен narrow extraction для Incoterms, customs and shipment state. |

## Кандидаты с проверенным состоянием

| Репозиторий | License | Stars на момент проверки | Full commit SHA |
| --- | --- | ---: | --- |
| `EveryInc/compound-engineering-plugin` | MIT | 24451 | `56cb13aa15799d9c0fd01a82d0f4877043395841` |
| `assimovt/productskills` | MIT | 60 | `66f9cee5868d6daf9cf106b4a74090428d6fa83e` |
| `ghaida/intent` | CC0-1.0 | 129 | `b89a519eb570fe7ec61de1eb51f553af0306b515` |
| `vasilyu1983/AI-Agents-public` | MIT | 80 | `53f6cb73ea53a2646e3e7d4665062ad66f3683ac` |
| `content-designer/ux-writing-skill` | MIT | 153 | `98cacde4ba2dd10ed28df43a8d53eef1e321c539` |
| `addyosmani/web-quality-skills` | MIT | 2681 | `95d6e255afe1596b557d7a8498517884438f5b3a` |
| `mblode/agent-skills` | MIT | 82 | `2e575d39f28acdc698ea22e4c62325801188e1b1` |
| `exceptionless/Exceptionless` | Apache-2.0 | 2454 | `9fa81b49ed776c7bbda86ada5492e21d63c9ec6a` |
| `rampstackco/claude-skills` | MIT | 638 | `0479242522549dfdb389bb9b7807ad4d6016ffb7` |
| `alirezarezvani/claude-skills` | MIT | 24843 | `98180dafc4f0bc9d629bd479fc6107674cfb3cf8` |
| `kishorkukreja/awesome-supply-chain` | MIT | 57 | `f8cf557df58af5a39de99016f2273904afa6d09b` |
| `sickn33/agentic-awesome-skills` | MIT | 45300 | `b6ceca367a3b3ee90a273a3afa895960e8e9d7a5` |
| `phuryn/pm-skills` | MIT | 25557 | `18468a95b427e70e258b51389796367c6f684e7d` |
| `petrkindlmann/qa-skills` | MIT | 87 | `b3bb61bd268b147476252c6ed5a0440c87b97441` |
| `nchemb/super-smoke-test` | MIT | 8 | `db5ab7f18bc20e528937d3b50aa0afe39ed99389` |
| `firecrawl/firecrawl-workflows` | ISC | 139 | `94cc91229d6cedc0613f140d3d013b150bc8e1b0` |
| `affaan-m/ECC` | MIT | 242411 | `d8409a4b0813771235555e32e3d8046a73988bfa` |

## Не прошли квалификацию

- `catlog22/Claude-Code-Workflow`: repository archived.
- `yak33/customs-skill`: repository unavailable at verification time.
- `dnotitia/akb`: license was `NOASSERTION`; do not vendor.
- `vercel-labs/agent-skills`: root-level license was not sufficient for a
  wholesale decision; verify each selected skill separately.
- Generic compliance and food-safety skills: no authority to replace current
  regulator, certification-scheme and legal sources.

## Решение

Новые external packages не устанавливаются этим research batch. Следующий
обоснованный пилот — QA role на `petrkindlmann/qa-skills`, затем narrow logistics
extraction из `affaan-m/ECC`. До пилота должны быть зафиксированы seeded defect,
expected finding, overlap boundary, independent reviewer и removal path.
