# YORSO: тексты ошибок сервера RU/EN/ES

Это консультация. Я не открывал ваш сайт, проверки в браузере не было. Стиль близок к STE, это не сертификат.

## 1. Правило: общая фраза или точная причина
1. **Никогда не показывать `error.message` напрямую.** Текст ошибки сервера, HTTP 500, `invalid_response` и сетевые ошибки могут содержать внутренние данные и английский текст.
2. **Выбор текста идёт по `code`, затем по `status`, затем общая фраза.** Если `code` известен и переведён — показать его текст. Если нет — текст по `status` из таблицы ниже. Если и его нет — общая фраза по типу действия.
3. **Ошибки полей (422) сохраняются.** Каждая ошибка остаётся у своего поля и в существующем списке ошибок. Общая фраза добавляется только сверху, а не вместо них. Текст ошибки поля — из словаря по коду поля, не из ответа сервера.
4. **Тип действия решает текст.** Чтение (GET) можно спокойно повторить. Изменение (сохранить, опубликовать, отозвать, отправить) после потери ответа нельзя повторять вслепую.
5. **Код для поддержки.** Если есть `requestId`, показать мелко: «Код ошибки: {id}». Это не внутренние данные.
6. **401 и 403** — оставить текущие отдельные состояния. Не смешивать с общей ошибкой.

## 2. Тексты
| Случай | RU | EN | ES | Действие |
|---|---|---|---|---|
| Сеть, чтение | Нет связи с сервером. Проверьте интернет и обновите данные. | No connection to the server. Check your internet and refresh. | Sin conexión con el servidor. Compruebe internet y actualice. | Обновить |
| Сеть, изменение — результат неизвестен | Мы не знаем, сохранено ли изменение. Обновите данные и проверьте результат. Не повторяйте действие до проверки. | We do not know if the change was saved. Refresh and check the result. Do not repeat the action before you check. | No sabemos si se guardó el cambio. Actualice y compruebe el resultado. No repita la acción antes de comprobarlo. | Обновить |
| 401 | Сессия закончилась. Войдите снова. | Your session ended. Sign in again. | Su sesión terminó. Inicie sesión de nuevo. | Войти |
| 403 | У вас нет прав для этого действия. | You do not have permission for this action. | No tiene permiso para esta acción. | — |
| 403 админ | Нужна роль администратора. | Admin role required. | Se necesita el rol de administrador. | — |
| 404 | Запись не найдена. Возможно, её удалили. | Record not found. It may have been deleted. | Registro no encontrado. Puede que se haya eliminado. | Вернуться к списку |
| 409 | Данные изменились. Обновите их, затем повторите. | The data changed. Refresh it, then try again. | Los datos cambiaron. Actualícelos y vuelva a intentarlo. | Обновить |
| 422 сверху | Исправьте поля, отмеченные ниже. | Fix the fields marked below. | Corrija los campos marcados abajo. | Фокус на 1-е поле |
| 422 без поля | Сервер не принял данные. Проверьте введённые значения. | The server did not accept the data. Check the values. | El servidor no aceptó los datos. Revise los valores. | — |
| 429 | Слишком много запросов. Подождите минуту и повторите. | Too many requests. Wait one minute and try again. | Demasiadas solicitudes. Espere un minuto y vuelva a intentarlo. | Повторить (после ожидания) |
| 5xx, чтение | Сервер не ответил. Обновите данные позже. | The server did not respond. Refresh later. | El servidor no respondió. Actualice más tarde. | Обновить |
| 5xx, изменение | Изменение могло не сохраниться. Обновите данные и проверьте результат. | The change may not be saved. Refresh and check the result. | Puede que el cambio no se guardara. Actualice y compruebe el resultado. | Обновить |
| invalid_response | Сервер прислал непонятный ответ. Результат не подтверждён. Обновите данные. | The server sent an unclear response. The result is not confirmed. Refresh. | El servidor envió una respuesta no válida. El resultado no está confirmado. Actualice. | Обновить |
| Общая, чтение | Данные не загрузились. Обновите страницу. | The data did not load. Refresh the page. | Los datos no se cargaron. Actualice la página. | Обновить |
| Общая, изменение | Изменение не подтверждено. Обновите данные и проверьте результат. | The change is not confirmed. Refresh and check the result. | El cambio no está confirmado. Actualice y compruebe el resultado. | Обновить |
| Код поддержки | Код ошибки: {id} | Error code: {id} | Código de error: {id} | — |

Если в 429 есть `Retry-After`, подставить число: «Подождите {n} с». Иначе «минуту» — не обещать точное время.

## 3. Регистрация и сохранение аккаунта
- `getErrorMessage(code)` перевести на RU/EN/ES через словарь. Для неизвестного кода — общая фраза, не английский текст.
- Сохранение аккаунта: в `catch` не показывать `Error.message`. Использовать строки «изменение» из таблицы. Не писать «Сохранено», пока сервер не подтвердил.

## 4. Клавиатура и доступность
- Ошибка показывается в существующем Alert с `role="alert"` один раз.
- Действие — только существующая кнопка (на страницах админа это «Обновить»). Новых кнопок не придумывать. Если кнопки нет — текст без указания кнопки.
- После ошибки фокус не переносить сам, кроме 422 (фокус на первое поле с ошибкой).
- Данные, которые уже были на экране до ошибки чтения, оставить видимыми с пометкой «Данные могли устареть.» / «Data may be out of date.» / «Los datos pueden estar desactualizados.»

## 5. Что проверить (Codex локально)
- Каждая из 14 страниц админа: подменить ответ на 500 с английским текстом → английского текста и внутренних данных нет.
- Обрыв сети при изменении → нет «Сохранено» и нет совета повторить.
- 422 с ошибками полей → все ошибки у своих полей, на RU/EN/ES.
- 401/403 → прежние отдельные состояния, цены и закрытые документы по-прежнему скрыты.

| План | Сделано | Осталось | Проверка |
|---|---|---|---|
| Правило выбора текста | Описано | Внедрить | Codex локально |
| Тексты по кодам RU/EN/ES | 16 строк | Носители RU/ES | Копирайтер |
| 14 страниц админа, регистрация, аккаунт | Не исправлено | Заменить показ `error.message` | Модульные тесты |
| Клавиатура, программа чтения экрана | Правила описаны | Проверить | QA, не проверено в браузере |
