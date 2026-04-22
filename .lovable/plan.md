

## Очистка полей ввода кода при ошибке верификации

### Проблема
На `/register/verify` после ввода неверного кода все 6 цифр остаются в полях. Пользователь вынужден вручную стирать каждую цифру (или выделять всё), прежде чем ввести код повторно.

### Решение
При получении ошибки от `authApi.verifyEmail` (любой `isApiError` результат) автоматически:
1. Очистить состояние `code` → `["", "", "", "", "", ""]`.
2. Вернуть фокус на первое поле `otp-0`, чтобы пользователь сразу мог печатать новый код.
3. Сохранить текущее поведение для всех остальных событий (analytics, toast, error message, redirect при `VERIFICATION_FAILED`).

### Технические детали
**Файл:** `src/pages/register/RegisterVerify.tsx`

В функции `submitCode` внутри ветки `if (isApiError(result))` (после установки `setError` и трекинга), перед `return` добавить:
```typescript
// Очищаем поля ввода и возвращаем фокус, чтобы пользователь
// мог сразу ввести код заново без ручной очистки.
setCode(["", "", "", "", "", ""]);
// Не очищаем при VERIFICATION_FAILED — там идёт редирект на /register/email,
// поэтому фокус ставим только если остаёмся на странице.
if (result.code !== "VERIFICATION_FAILED") {
  // requestAnimationFrame гарантирует, что input уже re-rendered и не disabled.
  requestAnimationFrame(() => document.getElementById("otp-0")?.focus());
}
```

### Что НЕ меняем
- Логика auto-submit при заполнении 6 цифр.
- Поведение при успешной верификации.
- Все analytics события (`registration_email_verification_failed`, `registration_resend_outcome` и др.).
- Сообщение об ошибке (`setError` + toast) — остаётся видимым над полями, чтобы пользователь понял причину.

### Edge cases
- **Очистка не срабатывает при `VERIFICATION_FAILED`**: пользователь редиректится на `/register/email` через 1.5s — очищать поля бессмысленно, фокус не ставим.
- **Resend во время ошибки**: `pendingResendRef` уже корректно обрабатывается выше — наша очистка не влияет на его state.
- **`disabled={loading}`**: к моменту фокусировки `setLoading(false)` уже отработал, `requestAnimationFrame` ждёт следующий кадр после re-render.

### Тесты
Опционально добавить unit-тест `src/pages/register/RegisterVerify.clear-on-error.test.tsx`, который:
1. Мокает `authApi.verifyEmail` с возвратом `{ code: "INVALID_CODE" }`.
2. Заполняет 6 полей, ждёт auto-submit.
3. Проверяет, что после ошибки все 6 input имеют `value === ""` и фокус на `otp-0`.

