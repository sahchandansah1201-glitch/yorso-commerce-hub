/**
 * E2E · /suppliers/:id · supplier logo labels follow the active locale.
 *
 * Batch #135 guard:
 * - supplier profile logo accessible names use locale-owned copy;
 * - English/Russian/Spanish logo labels do not leak into the wrong locale;
 * - mobile layout keeps zero horizontal overflow.
 */
import { expect, test, type Page } from "@playwright/test";

const SUPPLIER_PATH = "/suppliers/sup-no-001";

type Locale = "en" | "ru" | "es";

const EXPECT: Record<Locale, { heading: string; logoLabel: string; forbidden: string[] }> = {
  en: {
    heading: "Norwegian salmon producer · NO-114",
    logoLabel: "Norwegian salmon producer · NO-114 logo",
    forbidden: ["Логотип Norwegian salmon producer", "Logotipo de Norwegian salmon producer"],
  },
  ru: {
    heading: "Норвежский производитель лосося · NO-114",
    logoLabel: "Логотип Норвежский производитель лосося · NO-114",
    forbidden: [
      "Норвежский производитель лосося · NO-114 logo",
      "Logotipo de Норвежский производитель лосося",
    ],
  },
  es: {
    heading: "Productor noruego de salmón · NO-114",
    logoLabel: "Logotipo de Productor noruego de salmón · NO-114",
    forbidden: [
      "Логотип Productor noruego de salmón",
      "Productor noruego de salmón · NO-114 logo",
    ],
  },
};

const gotoSupplier = async (page: Page, locale: Locale) => {
  await page.addInitScript((lang) => {
    try {
      window.localStorage.setItem("yorso-lang", lang);
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  }, locale);
  await page.goto(SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
  await page.getByTestId("supplier-anon-cta").waitFor({ state: "visible" });
};

test.describe("/suppliers/:id · localized supplier logo labels", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const locale of ["en", "ru", "es"] as const) {
    test(`${locale}: supplier logo accessible name uses the active locale`, async ({ page }) => {
      await gotoSupplier(page, locale);
      const expected = EXPECT[locale];

      await expect(page.getByRole("heading", { name: expected.heading })).toBeVisible();

      const attrs = await page.evaluate(() => ({
        ariaLabels: Array.from(document.querySelectorAll<HTMLElement>("[aria-label]"))
          .map((el) => el.getAttribute("aria-label") ?? "")
          .filter(Boolean),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(attrs.ariaLabels).toContain(expected.logoLabel);
      for (const forbidden of expected.forbidden) {
        expect(attrs.ariaLabels).not.toContain(forbidden);
      }
      expect(attrs.scrollWidth).toBe(attrs.clientWidth);
      await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
    });
  }
});
