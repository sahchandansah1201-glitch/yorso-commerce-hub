/**
 * E2E · /suppliers · supplier trust labels are localized in RU.
 *
 * Batch #134 guard:
 * - row trust signals, catalog preview, delivery preview and selected-supplier
 *   panel landmarks use locale-owned accessible names;
 * - image alt text no longer exposes hardcoded English copy;
 * - mobile layout keeps zero horizontal overflow.
 */
import { expect, test, type Page } from "@playwright/test";

const gotoSuppliersRu = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "ru");
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/suppliers", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("supplier-row").first()).toBeVisible({ timeout: 15_000 });
};

test.describe("/suppliers · localized trust labels", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("RU supplier directory labels and image alts do not leak hardcoded English", async ({ page }) => {
    await gotoSuppliersRu(page);

    await expect(page.locator('[aria-label="Выбранный поставщик"]')).toHaveCount(1);
    await expect(page.locator('[aria-label="Сигналы поставщика"]').first()).toBeVisible();
    await expect(page.locator('[aria-label="Превью каталога товаров"]').first()).toBeVisible();
    await expect(page.locator('[aria-label="Превью рынков доставки"]').first()).toBeVisible();

    const attrs = await page.evaluate(() => ({
      ariaLabels: Array.from(document.querySelectorAll<HTMLElement>("[aria-label]"))
        .map((el) => el.getAttribute("aria-label") ?? "")
        .filter(Boolean),
      imageAlts: Array.from(document.querySelectorAll<HTMLImageElement>("img"))
        .map((img) => img.getAttribute("alt") ?? "")
        .filter(Boolean),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(attrs.ariaLabels).not.toContain("Selected supplier");
    expect(attrs.ariaLabels).not.toContain("Supplier signals");
    expect(attrs.ariaLabels).not.toContain("Product catalog preview");
    expect(attrs.ariaLabels).not.toContain("Delivery markets preview");
    expect(attrs.imageAlts.some((alt) => alt.includes("Референсное изображение"))).toBe(true);
    expect(attrs.imageAlts.some((alt) => alt.includes("Превью товара"))).toBe(true);
    expect(attrs.imageAlts.some((alt) => alt.includes("reference image for"))).toBe(false);
    expect(attrs.imageAlts.some((alt) => alt.includes("product preview from"))).toBe(false);
    expect(attrs.scrollWidth).toBe(attrs.clientWidth);
  });
});
