# Context Health

Обновлено: 2026-05-22

## Текущий статус

```yaml
context_risk: "low"
last_checkpoint: "2026-05-22"
last_handoff_ready: true
recommended_action: "finish Batch #107 size gate, validation, commit, push, PR, GitHub checks and merge; then provide numbered Lovable Prompt #107"
current_project: "yorso-commerce-hub"
active_branch: "codex/batch107-incident-trend-analytics"
current_batch: 107
batch_107_size_gate: "passed: 53 files, 4823 insertions, +35.9% files and +24.6% insertions versus Batch #106"
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
