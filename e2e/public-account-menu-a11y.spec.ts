/**
 * E2E · public signed-in account menu accessibility.
 *
 * Contract:
 * - desktop account chip names the menu purpose and current account;
 * - desktop dropdown is associated through aria-controls and a named group;
 * - mobile signed-in account panel exposes the same localized account context;
 * - signed-in public header keeps zero nested controls and zero 390px overflow.
 */
import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession, type E2ELang } from "./helpers/buyer-session";

const publicRoutes = ["/", "/offers", "/suppliers", "/about", "/blog"] as const;

const labels: Record<E2ELang, { menu: string; current: string; toggle: string; account: string; signOut: string }> = {
  en: {
    menu: "Account menu",
    current: "Current account",
    toggle: "Toggle menu",
    account: "My account",
    signOut: "Sign out",
  },
  ru: {
    menu: "Меню учётной записи",
    current: "Текущая учётная запись",
    toggle: "Открыть меню",
    account: "Моя учётная запись",
    signOut: "Выйти",
  },
  es: {
    menu: "Menú de cuenta",
    current: "Cuenta actual",
    toggle: "Abrir menú",
    account: "Mi cuenta",
    signOut: "Cerrar sesión",
  },
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

const expectNoNestedInteractiveControls = async (page: Page) => {
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

test.describe("public signed-in account menu accessibility", () => {
  test("desktop account chip names the menu and controls a named dropdown", async ({ page }) => {
    const displayName = "Buyer Demo";
    await installBuyerSession(page, { displayName, lang: "en" });
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const accountLabel = `${labels.en.menu}. ${labels.en.current}: ${displayName}`;
    const accountChip = page.getByRole("button", { name: accountLabel });
    await expect(accountChip).toBeVisible();
    await expect(accountChip).toHaveAttribute("aria-expanded", "false");
    await expect(accountChip).toHaveAttribute("aria-haspopup", "true");

    await accountChip.click();
    await expect(accountChip).toHaveAttribute("aria-expanded", "true");
    await expect(accountChip).toHaveAttribute("aria-controls", "header-account-menu");

    const menu = page.getByRole("group", { name: labels.en.menu });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: labels.en.account })).toHaveAttribute("href", "/account");
    await expect(menu.getByRole("button", { name: labels.en.signOut })).toBeVisible();
    await expectNoNestedInteractiveControls(page);
  });

  for (const lang of ["en", "ru", "es"] as const) {
    test(`${lang} mobile account panel exposes localized account context`, async ({ page }) => {
      const displayName = lang === "ru" ? "Покупатель" : lang === "es" ? "Comprador" : "Buyer Demo";
      await installBuyerSession(page, { displayName, lang });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await page.getByRole("button", { name: labels[lang].toggle }).click();

      const accountLabel = `${labels[lang].menu}. ${labels[lang].current}: ${displayName}`;
      const accountPanel = page.getByRole("group", { name: accountLabel });
      await expect(accountPanel).toBeVisible();
      await expect(accountPanel.getByRole("link", { name: labels[lang].account })).toHaveAttribute(
        "href",
        "/account",
      );
      await expect(accountPanel.getByRole("button", { name: labels[lang].signOut })).toBeVisible();
      await expectNoNestedInteractiveControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const route of publicRoutes) {
    test(`${route} signed-in mobile header keeps account panel stable`, async ({ page }) => {
      await installBuyerSession(page, { displayName: "Buyer Demo", lang: "en" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await page.getByRole("button", { name: labels.en.toggle }).click();

      await expect(
        page.getByRole("group", { name: `${labels.en.menu}. ${labels.en.current}: Buyer Demo` }),
      ).toBeVisible();
      await expectNoNestedInteractiveControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
