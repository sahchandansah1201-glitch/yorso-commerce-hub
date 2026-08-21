# Agent Role And Skill Evaluation

Дата: 2026-08-21

## Access Preflight

- Codex Exa MCP доступен и использован для исследования GitHub-источников.
- Локальный fallback Exa настроен через primary и third slots; значения ключей
  не читались и не записываются в отчёт.
- Приоритет остаётся: Exa MCP -> project keyring fallback только при
  недоступности MCP или quota/rate-limit ошибке.

## Метод отбора

Кандидаты оценивались по применимости к роли, GitHub activity, лицензии,
наличию проверок/CI, прозрачности содержимого, adoption signal и возможности
использовать метод без скрытой зависимости от hosted runtime. Популярность не
является доказательством качества. Любой внешний skill перед установкой должен
быть закреплён на commit, просканирован и опробован в `local-lab/*`.

## Карта ролей и решений

| Роль | Основные локальные skills | Внешний GitHub-кандидат | Решение |
|---|---|---|---|
| Product Owner / Discovery | `discovery-interview`, `yorso-conversion-journey-agent` | [product-on-purpose/pm-skills](https://github.com/product-on-purpose/pm-skills) | Использовать как reference/pilot для discovery, prioritization и product reviews. Не заменяет решение пользователя. |
| B2B Procurement UX | `yorso-b2b-procurement-behavior-agent` | надёжный seafood/B2B skill не подтверждён | Оставить локальный domain skill и project KB; не подменять отраслевую экспертизу generic catalog. |
| Seafood Domain | project KB + source-driven research | надёжный готовый skill не подтверждён | Вести source-backed taxonomy/certification decisions в KB; спорные правила отправлять на human review. |
| UX/UI + Design System | `yorso-ux-ui-quality-agent`, `yorso-design-system-agent`, `form-patterns`, `data-density-patterns` | [Community-Access/accessibility-agents](https://github.com/Community-Access/accessibility-agents) | Взять WCAG review roles как reference; сохранять обязательное ручное screen-reader/keyboard тестирование. |
| Frontend Lead | `frontend-ui-engineering`, `yorso-design-system-agent`, `yorso-code-quality-gate-agent` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), [millionco/react-doctor](https://github.com/millionco/react-doctor) | Addy library — reference/pilot для engineering workflow. React Doctor — пилот в CI только после license/security review. |
| Backend/API Architect | `yorso-service-architecture-agent`, `yorso-api-contract-gate-agent`, `api-and-interface-design` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Локальные Yorso contracts остаются обязательными; внешний набор дополняет planning/review, но не определяет self-hosted policy. |
| QA Automation | `yorso-testing-quality-gate-agent`, `playwright`, `tdd` | [petrkindlmann/qa-skills](https://github.com/petrkindlmann/qa-skills) | Пилотировать отдельные test-design/review skills; не устанавливать весь каталог без ревью из-за меньшей зрелости проекта. |
| Human QA | `webapp-testing`, `browser-testing-with-devtools`, `yorso-visual-regression-agent` | Community-Access + qa-skills | Использовать сценарный gate из `local-lab-acceptance-gate.ru.md`; автоматизация не заменяет действия человека. |
| Security / Provider-Free | `security-and-hardening`, Yorso provider/API gates | [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) | Сделать scanner обязательным перед импортом внешних skills; результаты scanner не заменяют code review. |
| Release / DevOps | `yorso-release-reliability-agent`, `ci-cd-and-automation`, `verification-before-completion` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Использовать release workflow как reference; repo CI и server smoke остаются источником факта. |
| Lovable Operator | `yorso-lovable-component-brief-agent` | более сильный проверенный GitHub skill не найден | Оставить локальный skill; требовать same-branch HEAD и capability preflight вместо запрета browser tools. |
| Evidence Keeper | `project-knowledge-base`, `source-driven-development`, `yorso-agent-usage-reporter` | внешняя замена не требуется | Сохранять decision/worklog/artifacts и отделять local PASS от merge/deploy proof. |

## Выбранные внешние источники

1. [product-on-purpose/pm-skills](https://github.com/product-on-purpose/pm-skills):
   специализированная PM-библиотека с workflows, sub-agents, примерами и
   контрактами качества. Решение: selective pilot.
2. [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills):
   инженерный цикл DEFINE/PLAN/BUILD/VERIFY/REVIEW/SHIP. Решение: reference и
   selective pilot, не массовая замена локальных Yorso gates.
3. [millionco/react-doctor](https://github.com/millionco/react-doctor):
   детерминированный React-анализ и PR-oriented проверки. Решение: не
   подключать до подтверждения license terms и security review.
4. [Community-Access/accessibility-agents](https://github.com/Community-Access/accessibility-agents):
   набор accessibility review roles с явной границей автоматизации. Решение:
   использовать как reference для WCAG review и ручных проверок.
5. [petrkindlmann/qa-skills](https://github.com/petrkindlmann/qa-skills):
   широкий QA-каталог. Решение: пилотировать только выбранные части после
   сканирования и review, не устанавливать пакет целиком.
6. [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector): security
   scanner для agent skills. Решение: обязательный pre-install scanner.

## План безопасного усиления

1. Выбрать по одному внешнему skill на PM, engineering, accessibility и QA.
2. Зафиксировать repository URL и exact commit.
3. Проверить license, scripts, network/file access и скрытые инструкции.
4. Запустить SkillSpector и ручной review.
5. Поставить только в изолированную среду и прогнать один реальный Yorso case.
6. Сравнить с текущим локальным skill по найденным дефектам, ложным замечаниям,
   времени и токенам.
7. Promote только при измеримом улучшении. Иначе удалить pilot.

Не подтверждается обещание «+30%» без baseline и сравнительного набора задач.
Эффективность измеряется defect escape rate, first-pass acceptance,
false-positive rate, время до доказанного результата и расход токенов.
