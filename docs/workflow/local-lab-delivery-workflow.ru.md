# Local Lab Delivery Workflow

Обновлено: 2026-08-23

## Источники правды

- Серверный источник правды: ветка `main` репозитория
  `sahchandansah1201-glitch/yorso-commerce-hub`.
- Экспериментальная база конкретного scope: одна ветка
  `local-lab/<scope>`, созданная от зафиксированного `origin/main`.
- Lovable подключается к той же `local-lab/<scope>`.
- Дополнительные ветки `codex/<scope>` и `lovable/test/<scope>` для того же
  scope не создаются.

## Рабочий цикл

1. **Frame**: проблема, ограничения и измеримый результат.
2. **Branch**: remote, ветка, base commit и чистота дерева.
3. **Discovery**: пользовательская боль, stakeholder и спорные premises.
4. **Design and contracts**: поведение, состояния, данные, ошибки, a11y и
   provider-free границы.
5. **Implementation**: минимальный связный diff только в `local-lab/<scope>`.
6. **Automated verification**: targeted tests, TypeScript, provider boundary,
   build и связанные Playwright flows.
7. **Human-like verification**: реальный пользовательский путь мышью и
   клавиатурой на desktop и 390 px, включая повторные действия, ошибки,
   cancel/save, reload и persistence.
8. **Independent review**: QA, UX, domain, security и release роли проверяют
   артефакты, а не пересказывают отчёт автора.
9. **Lovable sync**: тот же branch и HEAD; отчёт Lovable не заменяет локальную
   проверку Codex.
10. **Pull request**: только `local-lab/<scope> -> main`, merge по решению
    пользователя после gate.
11. **Server delivery**: smoke изменённого пути, runtime errors, logs и
    rollback reference.
12. **Evidence**: project-memory, plan/fact, commit и проверяемые артефакты.

## Исполняемые режимы

- `local`: проверяет Gates 0-3 и требует явных `PENDING` для 4-7. Результат
  `VALIDATED_LOCAL` не означает готовность PR или сервера.
- `release`: требует PASS для Gates 0-7 и чистое дерево. Любое отсутствующее
  внешнее доказательство даёт `NO-GO`.

```bash
npm run test:local-lab-cycle
npm run check:local-lab-cycle
npm run check:local-lab-release-cycle
```

Последняя команда должна завершаться ошибкой до появления независимых review,
Lovable same-branch evidence, PR/main evidence и server proof. Это проверка
fail-closed поведения, а не дефект runner.

## Постоянный локальный стенд

Единый адрес тестовой ветки: `http://127.0.0.1:3300/`.

```bash
npm run local-lab:install
npm run local-lab:status
npm run local-lab:restart
npm run local-lab:verify
```

`local-lab:install` регистрирует macOS LaunchAgent `com.yorso.local-lab`.
Он запускает Vite из текущего рабочего дерева репозитория, автоматически
перезапускает процесс после сбоя и стартует после входа пользователя в macOS.
Изменения исходников текущей `local-lab/<scope>` ветки доступны через Vite HMR
без отдельной production-сборки. Логи лежат в `~/Library/Logs/Yorso/`.

Стенд не заменяет acceptance: после каждого UI-изменения всё равно выполняются
целевые тесты и реальный пользовательский проход в браузере на desktop и 390 px.
`local-lab:verify` проверяет доступность постоянного адреса, главную страницу,
авторизованный маршрут `/account/company`, desktop/mobile отображение, отсутствие
ошибок браузера, горизонтального overflow и вложенных интерактивных элементов.
После каждого UI-изменения сначала выполняется связанный с изменением тест, затем
`npm run local-lab:verify`; только после этого пользователю передаётся адрес стенда.

## Stage B и обычная разработка

Stage B оценивает качество и происхождение **skills**, а не разрешает запуск
продуктовых функций. Он не блокирует разработку, локальное тестирование, работу
постоянного стенда или коммиты в `local-lab/*`.

- 30 подписанных executor outputs требуются только для owner-directed
  квалификации нового skill для регулярного использования в `local-lab/*`.
- Два независимых reviewer sheets и доверенный digest реестра actors нужны только
  для заявления об измеренном улучшении качества skill и для governance-gate
  переноса такого решения в `main`.
- Если задача не создаёт, не квалифицирует и не продвигает skill, Stage B не
  входит в её acceptance и пользователь ничего для Stage B делать не должен.

## Агентный конвейер

| Этап | Роль | Выход |
| --- | --- | --- |
| 0 | Founder / Product Orchestrator | problem frame и approval boundary |
| 1 | Product Discovery | evidence и acceptance criteria |
| 2 | Buyer Procurement + Supplier Operations | доменные правила и спорные premises |
| 3 | Product / UX + Design System | UI contract, states, mobile и a11y |
| 4 | Frontend + Backend / API | implementation plan и contract boundaries |
| 5 | Implementation | минимальный diff и targeted tests |
| 6 | QA Automation | воспроизводимые test results |
| 7 | Human QA | журнал реального flow и screenshots |
| 8 | Trust / Security / Provider-Free | policy и dependency verdict |
| 9 | Release / Delivery | CI, PR, deploy, smoke и rollback verdict |
| 10 | Knowledge / Evidence | project-memory и source ledger |

Один runtime может последовательно исполнить несколько ролей, но это не
считается независимым review. Независимость подтверждается отдельным actor,
evidence artifact и review boundary.

## Запрещённые сокращения

- принимать отчёт Lovable без синхронизации commit;
- принимать UI только по unit/e2e без реального пользовательского прохода;
- принимать flow только по screenshots без проверки состояния;
- создавать дополнительную ветку для того же scope;
- merge напрямую в `main` без PR и решения пользователя;
- выдавать `VALIDATED_LOCAL` за `server-ready`.
