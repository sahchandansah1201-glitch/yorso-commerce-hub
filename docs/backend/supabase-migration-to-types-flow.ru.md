# Flow: Supabase Migrations To Generated Types

Статус: процедура backend-readiness
Project id: `rxjufyldskfkjrpzhloo`

## Зачем это нужно

В репозитории YORSO уже есть backend access migrations, но Lovable Cloud может
регенерировать `src/integrations/supabase/types.ts` из live Supabase schema.

Если live Supabase schema еще не получила access migrations, generated types не
будут содержать:

- `access_events`;
- `access_grants`;
- `supplier_access_requests`;
- `access_events_admin`;
- `log_supplier_access_event`;
- `access_event_type`;
- `access_grant_scope`;
- `access_request_status`.

Это ожидаемо до применения migrations. Это не ошибка frontend.

## Команды

Preview-safe check:

```bash
npm run check:supabase-types
```

Команда выходит с кодом `0` и печатает drift warning. Она используется в
`prebuild`, чтобы Lovable preview и локальная сборка продолжали работать до
применения backend migrations.

Strict backend-readiness check:

```bash
npm run check:supabase-types:strict
```

Команда выходит с кодом `1`, пока migrations не применены и types не
регенерированы. Это gate перед тем, как считать backend access work завершенным.

Regenerate generated types:

```bash
npm run supabase:types:regen
```

Команда запускает:

```bash
npx supabase gen types typescript --project-id rxjufyldskfkjrpzhloo --schema public
```

и записывает результат в:

```text
src/integrations/supabase/types.ts
```

После этого она запускает `npm run check:supabase-types:strict`.

Поведение безопасности:

- если generated output все еще не содержит access markers, команда падает до
  записи `types.ts`;
- это защищает от случайной замены корректного локального файла pre-access
  generated types.

## Обязательная последовательность

1. Применить pending migrations к live Supabase project.
2. Регенерировать Supabase types из migrated project:

```bash
npm run supabase:types:regen
```

3. Проверить strict check:

```bash
npm run check:supabase-types:strict
```

4. Проверить frontend build:

```bash
npm run build
```

5. Закоммитить regenerated `src/integrations/supabase/types.ts`.

## Чего не делать

Не восстанавливать access sections в `types.ts` вручную после того, как Lovable
регенерировал файл из pre-access backend. Это создает временную локальную
иллюзию, но не исправляет live schema.

Не включать strict CI, пока `npm run check:supabase-types:strict` не проходит на
`main` после применения live migrations.

Не считать отсутствие access types проблемой Lovable UI. Это состояние backend
schema deployment.

## Что означает drift сейчас

Если non-strict check печатает drift warning, в репозитории есть backend access
migrations, но generated types все еще основаны на pre-access live schema.

Если strict check проходит, live backend schema и generated frontend contract
синхронизированы для текущего access foundation.
