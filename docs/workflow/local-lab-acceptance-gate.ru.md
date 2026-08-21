# Local Lab Acceptance Gate

Обновлено: 2026-08-21

Этот gate обязателен для PR `local-lab/<scope> -> main`. Любой незакрытый
обязательный пункт означает `NO-GO`.

## Gate 0. Repository And Branch Identity

- remote: `sahchandansah1201-glitch/yorso-commerce-hub`;
- branch соответствует `local-lab/<scope>`;
- branch создана от зафиксированного commit `origin/main`;
- Lovable и Codex называют один branch и один HEAD;
- отсутствуют параллельные `codex/<scope>` и `lovable/test/<scope>`.

Доказательство: `git remote -v`, `git status --short --branch`,
`git merge-base`, commit hash. Несовпадение репозитория или HEAD — `NO-GO`.

## Gate 1. Scope And Diff

- diff соответствует утверждённой проблеме и не меняет соседние поверхности;
- нет случайных generated files, secrets, build artifacts или hosted-provider
  scaffold;
- миграции, контракты, зависимости и runtime изменения перечислены явно;
- сохранены пользовательские изменения, не относящиеся к scope.

Доказательство: `git diff --stat`, `git diff --check`, scoped code review,
provider-boundary check.

## Gate 2. Automated Engineering Checks

Минимум для каждого scope:

1. targeted unit/integration tests первоначального дефекта;
2. `npx tsc -b --noEmit`;
3. `npm run check:provider-boundary`;
4. `npm run build`;
5. связанные Playwright specs;
6. `npm run ci:core` для общего frontend/backend/runtime изменения;
7. GitHub CI green до merge.

Если scope меняет `package.json` или lockfile, дополнительно обязателен
`npm audit --omit=dev`. Новые advisories — `NO-GO`; существующий baseline
фиксируется отдельным remediation scope. Автоматический `npm audit fix` не
запускается внутри несвязанного feature-батча.

`npm run ci:full` обязателен перед merge для изменений shared UI/runtime,
auth/access, persistence, API, admin или широкого cross-tab поведения.
Flaky retry без найденной причины не считается PASS.

## Gate 3. Human-Like Product Verification

Исполнитель проходит реальный пользовательский путь, а не только вызывает
селекторы теста:

- исходное состояние и понятность первого действия;
- primary flow мышью;
- тот же flow клавиатурой;
- повторное действие в одной сессии (например, второй товар/страна/документ);
- edit, clear/remove, cancel и save;
- validation error и восстановление после ошибки;
- reload/navigation и проверка persistence;
- empty, no-results, loading и доступные failure states;
- EN/RU/ES для изменённой копии или enum labels;
- desktop и mobile 390 px;
- отсутствие horizontal overflow, nested interactive controls, console errors,
  page errors и неожиданных failed requests;
- визуальная проверка contrast, focus, occlusion, sticky/fixed элементов и
  доступности основных действий.

Доказательство: сценарный журнал с expected/actual, screenshots ключевых
состояний и программные проверки. Скриншот сам по себе не доказывает работу.

## Gate 4. Independent Role Reviews

| Review | Обязательный вопрос |
|---|---|
| Product/B2B/domain | Решена реальная задача пользователя без лишнего ввода и ложных отраслевых допущений? |
| UX/UI | Действие и состояние находятся сканированием, а не чтением инструкции? |
| Frontend/API | Сохранены data contracts, ошибки, loading и persistence semantics? |
| QA | Проверен исходный дефект, повторный flow и соседняя регрессия? |
| Security/provider-free | Нет секретов, hosted BaaS, unsafe dependency или расширения доступа? |
| Release | CI, deploy smoke, observability и rollback достаточны для риска изменения? |

Автор реализации не может единолично закрыть independent review только своим
summary. Замечания получают статус `fixed`, `deferred with owner` или `NO-GO`.

## Gate 5. Lovable Same-Branch Verification

Lovable подключён к тому же `local-lab/<scope>` и сообщает:

- точный HEAD/commit;
- файлы, реально изменённые Lovable;
- проверки, реально запущенные Lovable;
- browser/preview capability, которую он использовал или не смог использовать;
- conflicts и ограничения.

После ответа Lovable Codex сначала синхронизирует ветку, затем независимо
проверяет diff и acceptance. Отчёт без commit sync не принимается.

## Gate 6. Pull Request To Main

- PR направлен только `local-lab/<scope> -> main`;
- PR содержит problem, scope, plan/fact, checks, human QA evidence, risks и
  rollback notes;
- required GitHub checks green;
- пользователь явно подтвердил merge.

До merge статус: `validated in local-lab`, а не `server-ready`.

## Gate 7. Post-Merge And Server Proof

- deploy использует commit из `main`;
- production/server smoke проходит критический изменённый путь;
- нет новых runtime/console/server errors;
- метрики и логи проверены в пределах риска;
- rollback commit/reference зафиксирован.

Только после этого статус может быть `delivered to server`.

## Формат итогового решения

| Gate | Статус | Доказательство | Осталось / owner |
|---|---|---|---|
| 0 Repository/branch | PASS/NO-GO | commit/commands | ... |
| 1 Scope/diff | PASS/NO-GO | diff/guard | ... |
| 2 Automated | PASS/NO-GO | commands/results | ... |
| 3 Human-like QA | PASS/NO-GO | flows/screenshots/logs | ... |
| 4 Independent reviews | PASS/NO-GO | findings | ... |
| 5 Lovable sync | PASS/NO-GO | branch/HEAD | ... |
| 6 PR/main | PASS/NO-GO | PR/checks/approval | ... |
| 7 Server proof | PASS/NO-GO | deploy/smoke/rollback | ... |
