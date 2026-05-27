/**
 * E2E · public language selector accessibility.
 *
 * Contract:
 * - desktop and mobile header language controls have localized programmatic names;
 * - the selected language is exposed with aria-pressed;
 * - language switching keeps public route layout free of nested controls and 390px overflow.
 */
import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/offers",
  "/suppliers",
  "/how-it-works",
  "/for-suppliers",
  "/signin",
  "/reset-password",
  "/about",
  "/blog",
] as const;

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

const expectNoNestedInteractiveControls = async (page: Page) => {
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

test.describe("public language selector accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.clear();
    });
  });

  test("desktop selector names the current language and selected menu item", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const selector = page.getByRole("button", {
      name: "Language selector. Current language: English",
    });
    await expect(selector).toBeVisible();
    await expect(selector).toHaveAttribute("aria-expanded", "false");

    await selector.click();
    await expect(selector).toHaveAttribute("aria-expanded", "true");

    const group = page.getByRole("group", { name: "Language selector" });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button", { name: "Current language: English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(group.getByRole("button", { name: "Select language: Русский" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await group.getByRole("button", { name: "Select language: Русский" }).click();
    await expect(
      page.getByRole("button", { name: "Выбор языка. Текущий язык: Русский" }),
    ).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem("yorso-lang"))).toBe("ru");
    await expectNoNestedInteractiveControls(page);
  });

  for (const route of publicRoutes) {
    test(`${route} mobile language selector exposes selected state and keeps layout stable`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await page.getByRole("button", { name: "Toggle menu" }).click();

      const group = page.getByRole("group", { name: "Language selector" });
      await expect(group).toBeVisible();
      await expect(group.getByRole("button", { name: "Current language: English" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(group.getByRole("button", { name: "Select language: Español" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      await group.getByRole("button", { name: "Select language: Русский" }).click();

      const localizedGroup = page.getByRole("group", { name: "Выбор языка" });
      await expect(localizedGroup.getByRole("button", { name: "Текущий язык: Русский" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect.poll(() => page.evaluate(() => window.localStorage.getItem("yorso-lang"))).toBe("ru");
      await expectNoNestedInteractiveControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
