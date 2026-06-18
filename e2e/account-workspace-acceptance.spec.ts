/**
 * P1L — Account Workspace Cross-Tab Acceptance.
 *
 * Read-only/screenshots-only spec. НЕ создаёт новых UI-контрактов, не вводит
 * новых testid, не правит данные. Использует только существующие testids
 * для генерации acceptance-скриншотов и программных проверок по 6 вкладкам
 * /account/* на desktop и mobile 390.
 */
import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const SHOT_DIR = "test-results/p1l-account-workspace";

const SECTIONS = [
  "personal",
  "company",
  "branches",
  "products",
  "meta-regions",
  "notifications",
] as const;

const consoleErrorsFor = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
};

const programmatic = async (page: Page) => ({
  overflow: await page.evaluate(
    () => document.body.scrollWidth - document.documentElement.clientWidth,
  ),
  nested: await page.evaluate(
    () =>
      document.querySelectorAll("a button, button a, a a, button button").length,
  ),
});

const openSection = async (page: Page, section: string, lang: "en" | "ru" = "en") => {
  await installBuyerSession(page, { id: `b_p1l_${section}`, lang });
  await page.goto(`/account/${section}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId(`account-section-${section}`)).toBeVisible({
    timeout: 15_000,
  });
};

test.describe("P1L /account workspace acceptance", () => {
  for (const section of SECTIONS) {
    test(`${section} desktop read — no overflow / no nested interactives / no console errors`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const errors = consoleErrorsFor(page);
      await openSection(page, section);
      await page.screenshot({
        path: `${SHOT_DIR}/${section}-desktop-read.png`,
        fullPage: true,
      });
      const { overflow, nested } = await programmatic(page);
      expect(overflow, "horizontal overflow").toBeLessThanOrEqual(0);
      expect(nested, "nested interactives").toBe(0);
      expect(errors, `console errors on /account/${section}`).toEqual([]);
    });

    test(`${section} mobile 390 read — no overflow / no nested interactives`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const errors = consoleErrorsFor(page);
      await openSection(page, section);
      await page.screenshot({
        path: `${SHOT_DIR}/${section}-mobile-390-read.png`,
        fullPage: true,
      });
      const { overflow, nested } = await programmatic(page);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(nested).toBe(0);
      expect(errors).toEqual([]);
    });
  }

  test("personal mobile 390 edit screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSection(page, "personal");
    // personal section: trigger edit by focusing firstName field (autosave model)
    const firstName = page.getByTestId("account-personal-firstName").first();
    if (await firstName.count()) await firstName.focus();
    await page.screenshot({
      path: `${SHOT_DIR}/personal-mobile-390-edit.png`,
      fullPage: true,
    });
  });

  test("products mobile 390 picker open screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSection(page, "products");
    await page.getByTestId("account-product-add").click();
    await page.screenshot({
      path: `${SHOT_DIR}/products-mobile-390-picker-open.png`,
      fullPage: true,
    });
    const { overflow, nested } = await programmatic(page);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(nested).toBe(0);
  });

  test("branches mobile 390 country combobox open screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSection(page, "branches");
    await page.getByTestId("account-branch-add").click();
    await page.getByTestId("account-branch-country").click();
    await page.screenshot({
      path: `${SHOT_DIR}/branches-mobile-390-country-open.png`,
      fullPage: true,
    });
    const { overflow, nested } = await programmatic(page);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(nested).toBe(0);
  });

  test("meta-regions mobile 390 with 2+ countries screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSection(page, "meta-regions");
    await page.getByTestId("account-meta-add").click();
    const combo = page.getByTestId("account-meta-country-combobox");
    await combo.click();
    await combo.fill("Spain");
    await page.getByTestId("account-meta-country-combobox-option-es").click();
    await combo.fill("Norway");
    await page.getByTestId("account-meta-country-combobox-option-no").click();
    await page.screenshot({
      path: `${SHOT_DIR}/meta-regions-mobile-390-two-chips.png`,
      fullPage: true,
    });
    const { overflow, nested } = await programmatic(page);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(nested).toBe(0);
  });

  test("notifications mobile 390 read + edit screenshots", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSection(page, "notifications");
    await page.screenshot({
      path: `${SHOT_DIR}/notifications-mobile-390-read.png`,
      fullPage: true,
    });
    await page.getByTestId("account-notif-edit-email").click();
    await expect(page.getByTestId("account-notif-form")).toBeVisible();
    await page.screenshot({
      path: `${SHOT_DIR}/notifications-mobile-390-edit.png`,
      fullPage: true,
    });
    const { overflow, nested } = await programmatic(page);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(nested).toBe(0);
  });
});
