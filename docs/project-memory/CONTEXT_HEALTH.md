# Context Health

Обновлено: 2026-05-22

## Текущий статус

```yaml
context_risk: "low"
last_checkpoint: "2026-05-22"
last_handoff_ready: true
recommended_action: "commit, push, PR, GitHub checks and merge Batch #105; then continue only from repository evidence"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch105-incident-execution-queue"
current_batch: 105
```

## Уровни риска

`low`: короткий чат, локальная задача, project memory обновлена недавно.

`medium`: длинный чат, несколько задач, есть большие outputs или следующий этап будет крупным.

`high`: ошибка compact/stream disconnected, чат путает проекты, `PROJECT_STATE.yaml` устарел или следующий шаг не записан.

## Когда обновлять checkpoint

- перед началом большой новой задачи;
- после завершения крупного этапа;
- перед переходом в новый чат;
- если чат начал путать проект, агента или источник контекста;
- если возникла ошибка compact, stream disconnected или похожий сбой.

## Команда для пользователя

```text
Сделай context checkpoint: обнови CONTEXT_HEALTH, PROJECT_STATE, HANDOFF, NEXT_ACTIONS, WORKLOG и дай готовый prompt для нового чата.
```
