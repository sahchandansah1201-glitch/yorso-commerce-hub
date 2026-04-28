# E2E (Playwright)

End-to-end тесты против реального preview/dev-сервера в headless Chromium.

## Зачем

Vitest+jsdom закрывает unit и integration слой (см. `src/**/*.test.tsx`), но
не доказывает, что recovery-блок действительно реактивно скрывается в
настоящем браузере при смене сессии. E2E-уровень нужен именно для
сценариев «без перезагрузки страницы».

## Запуск локально

1. Поднимите dev-сервер на порту 5173:
   ```bash
   bun run dev --host 127.0.0.1 --port 5173
   ```
2. В отдельном терминале:
   ```bash
   E2E_BASE_URL=http://127.0.0.1:5173 bunx playwright test --project=chromium
   ```

В sandbox-окружении дополнительно нужно указать системный chromium
(playwright-bundled headless-shell не имеет нужных .so):
```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/bin/chromium \
E2E_BASE_URL=http://127.0.0.1:5173 \
  bunx playwright test --project=chromium
```

## Что покрыто

- `offers-recovery.spec.ts` — recovery-блок «Получите больше от каталога»:
  - анонимный посетитель видит блок;
  - `buyerSession.signIn()` синхронно скрывает его БЕЗ reload (URL не меняется);
  - `buyerSession.signOut()` возвращает блок БЕЗ reload;
  - сессия, установленная ДО навигации, не даёт блоку появиться ни на один кадр.
