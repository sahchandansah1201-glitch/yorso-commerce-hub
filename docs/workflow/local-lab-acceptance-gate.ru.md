# Local Lab Acceptance Gate

Обновлено: 2026-08-23

Gate обязателен для PR `local-lab/<scope> -> main`. Незакрытый обязательный
пункт означает `NO-GO`.

## Gate 0. Repository And Branch Identity

- canonical remote: `sahchandansah1201-glitch/yorso-commerce-hub`;
- branch соответствует `local-lab/<scope>`;
- merge-base совпадает с записанным base commit;
- нет параллельных `codex/<scope>` или `lovable/test/<scope>`;
- release-проверка выполняется только на чистом дереве.

## Gate 1. Scope And Diff

- каждый изменённый файл попадает в явный allowlist scope;
- нет secrets, build artifacts или hosted-provider scaffold;
- migrations, contracts, dependencies и runtime changes перечислены;
- `git diff --check` проходит.

## Gate 2. Automated Engineering Checks

- targeted regression исходного дефекта;
- TypeScript, provider boundary и build для product-code scope;
- связанные Playwright flows для UI;
- `ci:core`/`ci:full` по blast radius;
- dependency audit при изменении dependencies.

Runner принимает только заранее разрешённые `npm` check-id. Произвольная
команда из evidence JSON не исполняется.

## Gate 3. Human-Like Product Verification

Для user-visible изменения обязательны:

- primary flow мышью и клавиатурой;
- повторное действие в одной сессии;
- edit, clear/remove, cancel, save, validation recovery и reload;
- empty/no-results/loading/failure states, если достижимы;
- EN/RU/ES для изменённой копии;
- desktop и 390 px;
- overflow, nested controls, console/page errors, focus, contrast и occlusion.

Для governance/docs/tooling изменения Gate 3 может быть `N/A`, но только с
явной причиной. Скриншот без сценарного журнала не закрывает Gate 3.

## Gate 4. Independent Role Reviews

Нужны отдельные domain/product, UX, engineering/API, QA,
security/provider-free и release verdicts согласно риску. Самооценка автора не
закрывает Gate 4.

## Gate 5. Lovable Same-Branch Verification

Lovable называет тот же branch/HEAD, изменённые файлы, реально запущенные
проверки, browser capability, conflicts и ограничения. После этого Codex
синхронизирует ветку и независимо проверяет diff.

## Gate 6. Pull Request To Main

PR направлен только из `local-lab/<scope>` в `main`, содержит problem,
scope, plan/fact, automated/human QA, risks и rollback. Required checks green,
merge подтверждён пользователем.

## Gate 7. Post-Merge And Server Proof

Deploy использует commit из `main`; критический smoke, logs/metrics и rollback
reference подтверждены. Только после этого допустим статус
`delivered to server`.

## Решение

| Режим | Требуемые gates | Допустимый результат |
| --- | --- | --- |
| `local` | 0-3 | `VALIDATED_LOCAL` |
| `release` | 0-7 | `RELEASE_READY` |

Любой `NO-GO` завершает runner с ненулевым exit code.
