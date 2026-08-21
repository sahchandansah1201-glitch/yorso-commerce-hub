# Local Lab Delivery Workflow

Обновлено: 2026-08-21

## Источники правды

- Серверный источник правды: ветка `main` репозитория
  `sahchandansah1201-glitch/yorso-commerce-hub`.
- Экспериментальная база конкретного scope: одна ветка
  `local-lab/<scope>`, созданная от актуального `origin/main`.
- Lovable подключается к той же `local-lab/<scope>`.
- Дополнительные ветки `codex/<scope>` и `lovable/test/<scope>` для этого же
  scope не создаются.

## Рабочий цикл

1. **Frame**: пользователь определяет проблему, ограничения и ожидаемый
   результат. Codex фиксирует измеримые критерии приёмки.
2. **Branch**: обновить `origin/main`, создать `local-lab/<scope>` и проверить
   remote, base commit и чистоту дерева.
3. **Discovery**: Product/B2B/domain/UX роли проверяют, какую пользовательскую
   проблему решает изменение. Неподтверждённые предположения маркируются.
4. **Design and contracts**: UX/UI, frontend и API роли определяют поведение,
   состояния, данные, ошибки, accessibility и provider-free границы.
5. **Implementation**: изменения выполняются только в `local-lab/<scope>`.
   Lovable может дорабатывать интерфейс в этой же ветке после синхронизации.
6. **Automated verification**: targeted tests, TypeScript, provider boundary,
   build и связанные Playwright flows.
7. **Human-like verification**: реальный путь пользователя выполняется в
   браузере мышью и клавиатурой на desktop и 390 px, включая повторные
   действия, исправление ошибок, cancel/save, reload и сохранение состояния.
8. **Independent review**: QA, UX, security/provider-free и release роли
   проверяют доказательства, а не пересказывают отчёт исполнителя.
9. **Lovable sync**: Lovable подтверждает commit ветки, изменённые файлы,
   фактически запущенные проверки и найденные ограничения. Его отчёт не
   заменяет локальную проверку Codex.
10. **Pull request**: открыть PR `local-lab/<scope> -> main`. Merge разрешён
    только после Acceptance Gate и явного решения пользователя.
11. **Server delivery**: после merge/deploy выполнить smoke критического пути,
    проверить runtime errors и зафиксировать rollback reference.
12. **Evidence**: обновить project-memory, decision/worklog и ссылки на
    результаты. Удалить временные артефакты, не являющиеся доказательством.

## Агентный конвейер Codex

| Этап | Роль | Ответственность | Выход |
|---|---|---|---|
| 0 | Product Owner / Founder | Приоритет, scope, итоговое решение | problem frame и approval boundary |
| 1 | Product Discovery | Боль, stakeholder, status quo, анти-цели | проверяемые acceptance criteria |
| 2 | B2B Procurement + Seafood Domain | Реальный закупочный и отраслевой контекст | доменные правила и спорные допущения |
| 3 | UX/UI + Design System | Иерархия, сканируемость, формы, mobile, a11y | UI contract и состояния |
| 4 | Frontend Lead + API Architect | Компоненты, data/API contracts, failure modes | план реализации и тестовые границы |
| 5 | Implementation | Минимальный связный diff | код и targeted tests |
| 6 | QA Automation | Unit/integration/e2e, regression и edge cases | воспроизводимые test results |
| 7 | Human QA | Действия как пользователь, визуальная и поведенческая проверка | сценарный протокол и screenshots |
| 8 | Security / Provider-Free | Secrets, auth, self-hosted boundary, dependency risk | security verdict |
| 9 | Release / DevOps | CI, PR, deploy, smoke, rollback | release verdict |
| 10 | Evidence Keeper | План/факт, commit, артефакты, открытые риски | project-memory checkpoint |

Пользователь остаётся владельцем продуктового решения и merge approval.
Codex оркестрирует роли, но не выдаёт собственный отчёт исполнителя за
независимую проверку.

## Требования к ролям

Это профили компетенций для агентного конвейера, а не заявление о реальном
трудовом стаже модели. Роль допускается к gate только если её вывод опирается
на соответствующие skills, исходники проекта и проверяемые доказательства.

| Роль | Требуемый уровень | Ключевые компетенции |
|---|---|---|
| Product Owner / Founder | Эквивалент founder/lead product | приоритизация боли, anti-goals, экономика бездействия, scope/merge decision |
| Product Discovery | Эквивалент senior product researcher | интервью, journey, assumption mapping, проверяемые acceptance criteria |
| B2B Procurement + Seafood Domain | Эквивалент отраслевого SME | seafood taxonomy, закупки, роли buyer/supplier, сезонность, документы и trust signals |
| UX/UI + Design System | Эквивалент senior product designer | информационная иерархия, сканируемость, формы, responsive, WCAG 2.2, design tokens |
| Frontend Lead + API Architect | Эквивалент senior/staff engineer | React/TypeScript, state, API contracts, failure states, performance, 10k-user baseline |
| Implementation | Эквивалент senior product engineer | минимальный diff, тестируемость, локальные паттерны, отсутствие speculative abstractions |
| QA Automation | Эквивалент senior SDET | risk-based test design, unit/integration/e2e, deterministic fixtures, regression analysis |
| Human QA | Эквивалент senior exploratory tester | действия мышью/клавиатурой, повторные flows, error recovery, visual and locale checks |
| Security / Provider-Free | Эквивалент AppSec reviewer | secrets, auth/access, dependency supply chain, self-hosted/provider boundary |
| Release / DevOps | Эквивалент senior release/SRE | CI, deploy smoke, observability, rollback, failure containment |
| Evidence Keeper | Эквивалент technical program/evidence lead | plan/fact, commit provenance, project-memory, source ledger, honest status boundaries |

Один и тот же Codex runtime может последовательно исполнять несколько ролей,
но review считается независимым только после отдельного прохода с собственным
чек-листом и findings. Самооценка автора без такого прохода gate не закрывает.

## Запрещённые сокращения процесса

- считать отчёт Lovable доказательством без синхронизации commit;
- принимать UI только по unit/e2e без реального пользовательского прохода;
- принимать пользовательский сценарий только по screenshots без проверки
  состояния и persistence;
- создавать ещё одну ветку для «проверки» того же scope;
- merge напрямую в `main` без PR и решения пользователя;
- заявлять server-ready по локальному PASS.
