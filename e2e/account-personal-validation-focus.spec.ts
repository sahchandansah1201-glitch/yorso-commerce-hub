/**
 * E2E · /account/personal · фокус-навигация по ошибкам валидации
 *
 * Что проверяем:
 *   1. При ручном «Сохранить» с несколькими невалидными полями фокус
 *      и автопрокрутка идут на ПЕРВОЕ поле с aria-invalid="true".
 *   2. После исправления первой ошибки и повторного «Сохранить» фокус
 *      переходит на следующее [aria-invalid="true"] (т.е. второе поле).
 *   3. Автосохранение (debounce ~800ms во время набора) НЕ перехватывает
 *      фокус: пользователь продолжает печатать в текущем поле, даже если
 *      в карточке есть невалидные значения.
 *   4. Фокусированное поле не уезжает под фиксированную шапку
 *      (sticky jumpbar): bounding rect выше любого элемента position:sticky
 *      / fixed, прижатого к верху viewport.
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

const phoneInput = (page: Page): Locator =>
  page.locator('input[type="tel"][autocomplete="tel"]').first();

const isFocused = async (loc: Locator) =>
  loc.evaluate((el) => el === document.activeElement);

const stickyTopOffset = (page: Page) =>
  page.evaluate(() => {
    let max = 0;
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.position !== "sticky" && cs.position !== "fixed") return;
      const r = el.getBoundingClientRect();
      if (r.top <= 8 && r.bottom > 0 && r.height < 200) {
        max = Math.max(max, r.bottom);
      }
    });
    return max;
  });

test.describe("/account/personal · фокус по [aria-invalid] при ручном сохранении", () => {
  test("первая → следующая ошибка после исправления; автосохранение не крадёт фокус", async ({
    page,
  }) => {
    await openPersonalEdit(page);

    // Делаем email и телефон невалидными.
    const email = emailInput(page);
    const phone = phoneInput(page);
    await email.fill("not-an-email");
    await phone.fill("abc"); // нечисловой → не пройдёт валидацию телефона

    // Дождёмся, чтобы пройти возможный autosave-debounce (800ms).
    // Автосохранение не должно перехватить фокус: оставляем каретку в phone.
    await phone.focus();
    await page.waitForTimeout(1100);
    expect(
      await isFocused(phone),
      "Автосохранение не должно отбирать фокус у активного поля",
    ).toBe(true);

    // Ручное «Сохранить» → фокус должен встать на ПЕРВОЕ невалидное (email).
    await page.getByTestId("account-card-personal-basic-save").click();

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(phone).toHaveAttribute("aria-invalid", "true");

    // Дать smooth-scroll + setTimeout(120) внутри focusFirstInvalid отработать.
    await expect
      .poll(() => isFocused(email), { timeout: 3_000 })
      .toBe(true);

    // Поле не скрыто под sticky-шапкой.
    const stickyBottom = await stickyTopOffset(page);
    const emailBox = await email.boundingBox();
    expect(emailBox, "email input bounding box").not.toBeNull();
    expect(
      emailBox!.y,
      `email top (${emailBox!.y}) должен быть ниже нижней границы sticky-шапки (${stickyBottom})`,
    ).toBeGreaterThanOrEqual(stickyBottom - 1);

    // Исправляем email, телефон оставляем сломанным.
    await email.fill("buyer@example.com");
    // Снимем фокус, чтобы повторный Save не считался "клик в поле".
    await page.getByTestId("account-card-personal-basic-save").click();

    await expect(email).toHaveAttribute("aria-invalid", "false");
    await expect(phone).toHaveAttribute("aria-invalid", "true");

    // Теперь первое невалидное — phone. Фокус должен переместиться туда.
    await expect
      .poll(() => isFocused(phone), { timeout: 3_000 })
      .toBe(true);

    // Phone тоже не должен уехать под sticky-шапку.
    const stickyBottom2 = await stickyTopOffset(page);
    const phoneBox = await phone.boundingBox();
    expect(phoneBox).not.toBeNull();
    expect(phoneBox!.y).toBeGreaterThanOrEqual(stickyBottom2 - 1);

    // Исправляем phone и убеждаемся, что после успешного сохранения
    // карточка выходит из режима редактирования.
    await phone.fill("+34123456789");
    await page.getByTestId("account-card-personal-basic-save").click();

    await expect(page.getByTestId("account-card-personal-basic-edit")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("автосохранение во время набора не перехватывает фокус, даже если есть невалидные поля", async ({
    page,
  }) => {
    await openPersonalEdit(page);

    const email = emailInput(page);
    await email.fill("broken");

    // Возвращаемся в firstName и набираем текст — autosave стрельнёт
    // несколько раз; фокус должен оставаться в firstName.
    const fn = firstNameInput(page);
    await fn.click();
    await fn.fill("");
    await page.keyboard.type("Anastasia", { delay: 80 });

    // Подождём более одного цикла autosave-debounce.
    await page.waitForTimeout(1200);

    expect(
      await isFocused(fn),
      "Во время автосохранения фокус не должен прыгать на email",
    ).toBe(true);
    await expect(email).toHaveAttribute("aria-invalid", "true");
  });
});
