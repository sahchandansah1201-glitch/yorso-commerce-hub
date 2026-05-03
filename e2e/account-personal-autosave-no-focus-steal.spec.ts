/**
 * E2E · /account/personal · автосохранение по debounce не крадёт фокус
 *
 * Что проверяем:
 *   Пока пользователь печатает в одном поле (firstName), debounce-
 *   автосохранение, срабатывающее на каждом изменении, НЕ должно
 *   переводить фокус и автопрокрутку на другое поле с
 *   [aria-invalid="true"] (например email с битым значением).
 *
 *   Перевод фокуса на первое невалидное поле допустим только при
 *   РУЧНОМ сохранении (клик/Enter по «Сохранить»).
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

const openPersonalEdit = async (page: Page) => {
  await page.goto("/account/personal", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const editBtn = page.getByTestId("account-card-personal-basic-edit");
  await expect(editBtn).toBeVisible();
  await editBtn.click();
  await expect(page.getByTestId("account-card-personal-basic-save")).toBeVisible();
};

const firstNameInput = (page: Page): Locator =>
  page.getByTestId("account-input-firstName");
const emailInput = (page: Page): Locator =>
  page.locator('input[type="email"][autocomplete="email"]').first();

const isFocused = (loc: Locator) =>
  loc.evaluate((el) => el === document.activeElement);

test.describe("/account/personal · debounce-autosave не перехватывает фокус у активного поля", () => {
  test("печать в firstName при невалидном email — фокус остаётся в firstName", async ({
    page,
  }) => {
    await openPersonalEdit(page);

    const email = emailInput(page);
    const fn = firstNameInput(page);

    // 1. Делаем email заведомо невалидным, снимаем фокус.
    await email.fill("broken-email");
    await expect(email).toHaveAttribute("aria-invalid", "true");

    // 2. Возвращаемся в firstName и печатаем посимвольно — это
    //    провоцирует множественные срабатывания debounce-autosave
    //    (~800 мс). Фокус НЕ должен прыгнуть на email.
    await fn.click();
    await fn.fill("");
    await page.keyboard.type("Anastasia", { delay: 90 });

    // Промежуточная проверка: пока печатаем — фокус ещё в firstName.
    expect(
      await isFocused(fn),
      "Во время набора текста autosave не должен перехватывать фокус",
    ).toBe(true);

    // 3. Подождать ОДИН полный цикл debounce после последнего нажатия
    //    клавиши (>800 мс), чтобы дать autosave фактически сработать.
    await page.waitForTimeout(1200);

    expect(
      await isFocused(fn),
      "После срабатывания debounce-autosave фокус всё ещё должен быть в firstName",
    ).toBe(true);

    // email остаётся подсвеченным как ошибка, но без авто-перехода.
    await expect(email).toHaveAttribute("aria-invalid", "true");

    // 4. Сама кнопка «Сохранить» в режиме редактирования всё ещё
    //    доступна — то есть карточка не закрылась самопроизвольно.
    await expect(
      page.getByTestId("account-card-personal-basic-save"),
    ).toBeVisible();
  });
});
