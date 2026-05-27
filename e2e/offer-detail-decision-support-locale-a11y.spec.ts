/**
 * E2E · /offers/:id · decision-support locale/a11y.
 *
 * Batch #137 guard:
 * - lower offer-detail decision blocks follow the active public locale;
 * - locked buyers do not see exact prices in similar offer/product sections;
 * - related insights are real links and FAQ disclosures stay mobile-safe.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";

type Locale = "ru" | "es";

const EXPECT: Record<Locale, {
  trustTitle: string;
  specsTitle: string;
  specsLabel: string;
  similarOffers: string;
  similarProducts: string;
  lockedPrice: string;
  insights: string;
  relatedReason: string;
  relatedLinkName: RegExp;
  faqTitle: string;
  faqQuestion: string;
  faqAnswer: string;
  forbidden: string[];
}> = {
  ru: {
    trustTitle: "Почему это предложение безопаснее проверять",
    specsTitle: "Полная спецификация",
    specsLabel: "Метод добычи",
    similarOffers: "Сравнить альтернативы",
    similarProducts: "Похожие продукты",
    lockedPrice: "Цена доступна после регистрации",
    insights: "Связанная рыночная аналитика",
    relatedReason: "Тот же вид",
    relatedLinkName: /Открыть рыночный материал/,
    faqTitle: "Вопросы перед запросом доступа",
    faqQuestion: "Как связаться с этим поставщиком?",
    faqAnswer: "После одобрения вы сможете связаться с поставщиком напрямую",
    forbidden: [
      "Why this offer is safe",
      "Full specifications",
      "Catching method",
      "Compare alternatives",
      "Explore similar products",
      "Related market insights",
      "Buying guide",
      "Same species",
      "Frequently asked questions",
      "Lower price",
    ],
  },
  es: {
    trustTitle: "Por qué esta oferta es segura para revisar",
    specsTitle: "Especificación completa",
    specsLabel: "Método de captura",
    similarOffers: "Comparar alternativas",
    similarProducts: "Productos similares",
    lockedPrice: "Precio disponible tras registrarte",
    insights: "Análisis de mercado relacionado",
    relatedReason: "Misma especie",
    relatedLinkName: /Abrir análisis de mercado/,
    faqTitle: "Preguntas antes de solicitar acceso",
    faqQuestion: "¿Cómo contacto a este proveedor?",
    faqAnswer: "Tras la aprobación podrás contactar al proveedor directamente",
    forbidden: [
      "Why this offer is safe",
      "Full specifications",
      "Catching method",
      "Related market insights",
      "Frequently asked questions",
      "Same species",
      "Lower price",
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

const expectDecisionTargetsMobileSafe = async (page: Page) => {
  const targets = page.locator("[data-offer-detail-decision-target]");
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `decision target ${i} should have a bounding box`).not.toBeNull();
    expect(Math.round(box?.width ?? 0), `decision target ${i} width`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0), `decision target ${i} height`).toBeGreaterThanOrEqual(44);
  }
};

test.describe("/offers/:id · localized decision support", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const locale of ["ru", "es"] as const) {
    test(`${locale}: lower decision blocks stay localized and locked`, async ({ page }) => {
      await installAnonymousLocale(page, locale);
      await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });

      const expected = EXPECT[locale];
      await expect(page.getByTestId("offer-trust-section").getByText(expected.trustTitle)).toBeVisible();

      const specs = page.getByTestId("offer-full-specifications");
      await specs.getByRole("button", { name: expected.specsTitle }).click();
      await expect(specs.getByText(expected.specsLabel)).toBeVisible();

      await expect(page.getByTestId("offer-similar-offers").getByText(expected.similarOffers)).toBeVisible();
      await expect(page.getByTestId("offer-similar-products").getByText(expected.similarProducts)).toBeVisible();
      await expect(page.getByTestId("offer-similar-offers").getByText(expected.lockedPrice).first()).toBeVisible();
      await expect(page.getByTestId("offer-similar-products").getByText(expected.lockedPrice).first()).toBeVisible();

      const insights = page.getByTestId("offer-related-insights");
      await expect(insights.getByText(expected.insights)).toBeVisible();
      await expect(insights.getByText(expected.relatedReason).first()).toBeVisible();
      const relatedLink = insights.getByRole("link", { name: expected.relatedLinkName }).first();
      await expect(relatedLink).toHaveAttribute("href", /\/blog\//);

      const faq = page.getByTestId("offer-decision-faq");
      await expect(faq.getByText(expected.faqTitle)).toBeVisible();
      const faqButton = faq.getByRole("button", { name: expected.faqQuestion });
      await expect(faqButton).toHaveAttribute("aria-expanded", "false");
      const box = await faqButton.boundingBox();
      expect(box, `${locale} FAQ button should have a box`).not.toBeNull();
      expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
      await faqButton.click();
      await expect(faqButton).toHaveAttribute("aria-expanded", "true");
      await expect(faq.getByText(expected.faqAnswer)).toBeVisible();

      for (const forbidden of expected.forbidden) {
        await expect(page.getByText(forbidden, { exact: false })).toHaveCount(0);
      }
      for (const price of ["$5.80", "$6.40", "$8.50", "$9.20", "$11.00"]) {
        await expect(page.getByText(price, { exact: false })).toHaveCount(0);
      }

      await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
      await expectDecisionTargetsMobileSafe(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
