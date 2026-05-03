/**
 * E2E · /account/personal · клавиатурное «Сохранить» через Enter
 *
 * Что проверяем:
 *   1. Пользователь правит несколько полей с невалидными значениями
 *      (email + phone), затем активирует кнопку «Сохранить» с клавиатуры
 *      через Enter (не мышью).
 *   2. Фокус автоматически переходит на ПЕРВОЕ [aria-invalid="true"]
 *      поле в карточке.
 *   3. После исправления первого поля и повторной активации Save через
 *      Enter фокус перемещается на следующее [aria-invalid="true"] поле.
 *   4. После исправления последнего поля Save через Enter завершает
 *      редактирование (карточка возвращается в режим просмотра).
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

const emailInput = (page: Page): Locator =>
  page.locator('input[type="email"][autocomplete="email"]').first();
const phoneInput = (page: Page): Locator =>
  page.locator('input[type="tel"][autocomplete="tel"]').first();

const isFocused = (loc: Locator) =>
  loc.evaluate((el) => el === document.activeElement);

/** Активировать кнопку «Сохранить» с клавиатуры через Enter. */
const saveWithEnter = async (page: Page) => {
  const save = page.getByTestId("account-card-personal-basic-save");
  await save.focus();
  await expect(save).toBeFocused();
  await page.keyboard.press("Enter");
};

test.describe("/account/personal · Save через Enter переводит фокус по [aria-invalid]", () => {
  test("Enter на «Сохранить» → первая ошибка → следующая → выход из edit", async ({
    page,
  }) => {
    await openPersonalEdit(page);

    const email = emailInput(page);
    const phone = phoneInput(page);

    await email.fill("not-an-email");
    await phone.fill("abc");

    // Снимем фокус с поля, чтобы автосохранение успело отработать без
    // влияния каретки. Затем ручной Save через Enter.
    await page.locator("body").click({ position: { x: 0, y: 0 } });
    await saveWithEnter(page);

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(phone).toHaveAttribute("aria-invalid", "true");

    // Фокус должен встать на первое [aria-invalid] — email.
    await expect.poll(() => isFocused(email), { timeout: 3_000 }).toBe(true);

    // Фиксим email — phone остаётся невалидным.
    await email.fill("buyer@example.com");
    await saveWithEnter(page);

    await expect(email).toHaveAttribute("aria-invalid", "false");
    await expect(phone).toHaveAttribute("aria-invalid", "true");

    // Следующая первая ошибка — phone.
    await expect.poll(() => isFocused(phone), { timeout: 3_000 }).toBe(true);

    // Фиксим phone и третий Enter завершает редактирование.
    await phone.fill("+34123456789");
    await saveWithEnter(page);

    await expect(page.getByTestId("account-card-personal-basic-edit")).toBeVisible({
      timeout: 5_000,
    });
  });
});
