# Flow: Supabase Migrations To Generated Types

Статус: процедура backend-readiness
Project id: `eaasthucczsduwrznrng`

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

Live migration preflight:

```bash
npm run supabase:access-preflight
```

Команда не меняет базу данных. Она проверяет:

- доступность Supabase CLI;
- наличие локальных access migration files;
- связан ли repo с project `eaasthucczsduwrznrng`;
- видит ли текущий Supabase login этот project;
- проходит ли strict generated type check.

Preview/build check:

```bash
npm run check:supabase-types
```

Команда намеренно non-strict. Она выходит с кодом `0` и печатает drift warning,
если в `src/integrations/supabase/types.ts` нет access markers. Lovable может
регенерировать этот файл из своего Supabase schema, поэтому runtime adapter не
должен зависеть от generated typings для новых access tables.

Strict backend-readiness check:

```bash
npm run check:supabase-types:strict
```

Команда выходит с кодом `1`, пока migrations не применены и types не
регенерированы из schema, содержащей access tables/RPCs. Это backend-readiness
gate, а не Lovable preview/build gate.

Regenerate generated types:

```bash
npm run supabase:types:regen
```

Команда запускает:

```bash
npx supabase gen types typescript --project-id eaasthucczsduwrznrng --schema public
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

1. Запустить preflight:

```bash
npm run supabase:access-preflight
```

2. Если preflight проходит, посмотреть pending remote migrations:

```bash
npx supabase db push --dry-run
```

3. Применить pending migrations к live Supabase project только после явного
   подтверждения.
4. Регенерировать Supabase types из migrated project:

```bash
npm run supabase:types:regen
```

5. Проверить strict check:

```bash
npm run check:supabase-types:strict
```

6. Проверить frontend build:

```bash
npm run build
```

7. Закоммитить regenerated `src/integrations/supabase/types.ts`.

## Чего не делать

Не восстанавливать access sections в `types.ts` вручную после того, как Lovable
регенерировал файл из pre-access backend. Это создает временную локальную
иллюзию, но не исправляет live schema.

Не завязывать `prebuild` на strict check, пока Lovable может регенерировать
`types.ts` из другой Supabase schema. Это снова создает sync loop, где Lovable
удаляет access markers и приложение не собирается.

Не считать отсутствие access types проблемой Lovable UI. Это состояние backend
schema deployment.

## Что означает drift сейчас

Если default check печатает drift warning, в репозитории есть backend access
migrations, но generated types устарели или были регенерированы из schema без
access contract. Frontend продолжает собираться, потому что Supplier Access
adapter содержит локальный access contract для этих backend tables.

Если strict check проходит, live backend schema и generated frontend contract
синхронизированы для текущего access foundation.
