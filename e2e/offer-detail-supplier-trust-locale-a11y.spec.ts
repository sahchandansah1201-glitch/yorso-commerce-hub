/**
 * E2E · /offers/:id · supplier trust panel locale/a11y.
 *
 * Batch #136 guard:
 * - supplier trust labels follow the active public locale;
 * - the review-scope disclosure keeps a named, mobile-safe target;
 * - offer-detail access gating, redaction and layout safety stay intact.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";

type Locale = "ru" | "es";

const EXPECT: Record<Locale, {
  status: string;
  body: string;
  inBusiness: string;
  response: string;
  certifications: string;
  showReview: string;
  hideReview: string;
  forbidden: string[];
}> = {
  ru: {
    status: "Проверка продолжается",
    body: "Базовые документы проверены. Полная проверка еще идет. Перед крупным заказом запросите документы.",
    inBusiness: "На рынке",
    response: "Ответ",
    certifications: "Сертификаты",
    showReview: "Что проверено?",
    hideReview: "Скрыть детали",
    forbidden: [
      "Verified Supplier",
      "Pending Full Verification",
      "What was reviewed?",
      "Hide details",
      "In business",
      "Response",
      "Reviewed documents",
      "View Supplier Profile",
      "Contact Supplier",
      "Save to Shortlist",
      "Compare Similar Offers",
    ],
  },
  es: {
    status: "Verificación en curso",
    body: "Los documentos básicos fueron revisados. La verificación completa sigue en curso. Pide los documentos antes de un pedido grande.",
    inBusiness: "En operación",
    response: "Respuesta",
    certifications: "Certificaciones",
    showReview: "¿Qué se revisó?",
    hideReview: "Ocultar detalles",
    forbidden: [
      "Verified Supplier",
      "Pending Full Verification",
      "What was reviewed?",
      "Hide details",
      "In business",
      "Reviewed documents",
      "View Supplier Profile",
      "Contact Supplier",
      "Save to Shortlist",
      "Compare Similar Offers",
    ],
  },
};

const installAnonymousLocale = async (page: Page, locale: Locale) => {
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
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  expect(overflow).toBe(0);
};

test.describe("/offers/:id · localized supplier trust panel", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const locale of ["ru", "es"] as const) {
    test(`${locale}: supplier trust labels and disclosure use active locale`, async ({ page }) => {
      await installAnonymousLocale(page, locale);
      await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });

      const expected = EXPECT[locale];
      const verification = page.getByTestId("offer-detail-supplier-verification");
      await expect(verification.getByText(expected.status)).toBeVisible();
      await expect(verification.getByText(expected.body)).toBeVisible();
      await expect(page.getByText(expected.inBusiness, { exact: true })).toBeVisible();
      await expect(page.getByText(expected.response, { exact: true })).toBeVisible();
      await expect(page.getByText(expected.certifications, { exact: true }).first()).toBeVisible();

      const reviewToggle = verification.getByRole("button", { name: expected.showReview });
      await expect(reviewToggle).toBeVisible();
      const box = await reviewToggle.boundingBox();
      expect(box, `${locale} review toggle should have a box`).not.toBeNull();
      expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
      await reviewToggle.click();
      await expect(verification.getByRole("button", { name: expected.hideReview })).toBeVisible();

      for (const forbidden of expected.forbidden) {
        await expect(page.getByText(forbidden, { exact: true })).toHaveCount(0);
      }
      await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    });
  }
});
