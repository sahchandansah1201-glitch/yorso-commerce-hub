# Context Health

Обновлено: 2026-05-21

## Текущий статус

```yaml
context_risk: "medium"
last_checkpoint: "2026-05-21"
last_handoff_ready: true
recommended_action: "finish Batch #98 validation, commit, PR, GitHub checks and merge; then continue with a large Batch #99"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch98-engineering-lessons-guards"
current_batch: 98
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
