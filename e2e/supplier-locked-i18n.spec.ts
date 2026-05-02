/**
 * E2E · /suppliers/:id · locked-подсказки локализованы во всех локалях.
 *
 * Контракт:
 *   Для каждой из локалей (en/ru/es) на странице supplier-профиля
 *   в anonymous_locked состоянии:
 *     • присутствуют ключевые locked-подсказки в нужном языке
 *       (catalog price/supplier hint, locked legal placeholder,
 *        about placeholder, anon CTA);
 *     • НЕ присутствуют английские fallback-строки (для ru/es).
 *
 * Локаль выставляется через localStorage("yorso-lang") до навигации,
 * чтобы LanguageProvider инициализировался в нужном языке без UI-кликов.
 *
 * Используется первый поставщик из mockSuppliers (sup-no-001).
 */
import { test, expect, type Page } from "@playwright/test";

const SUPPLIER_PATH = "/suppliers/sup-no-001";

type Locale = "en" | "ru" | "es";

interface LocaleExpectation {
  // Strings that MUST be in DOM for this locale.
  expected: string[];
  // English fallback substrings that MUST NOT be in DOM (skipped for en).
  forbidden?: string[];
}

const EXPECT: Record<Locale, LocaleExpectation> = {
  en: {
    expected: [
      "Exact price hidden — request access",
      "Supplier hidden — request access",
      "Active offers available after price access",
      "Access after registration",
    ],
  },
  ru: {
    expected: [
      "Точная цена скрыта — запросите доступ",
      "Поставщик скрыт — запросите доступ",
      "Офферы доступны после открытия цены",
      "Доступ после регистрации",
    ],
    forbidden: [
      "Exact price hidden — request access",
      "Supplier hidden — request access",
      "Active offers available after price access",
      "Access after registration",
    ],
  },
  es: {
    expected: [
      "Precio exacto oculto — solicite acceso",
      "Proveedor oculto — solicite acceso",
      "Ofertas disponibles tras abrir el precio",
      "Acceso tras el registro",
    ],
    forbidden: [
      "Exact price hidden — request access",
      "Supplier hidden — request access",
      "Active offers available after price access",
      "Access after registration",
    ],
  },
};

const gotoSupplierAsAnonymous = async (page: Page, locale: Locale) => {
  await page.addInitScript((lang) => {
    try {
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
      window.localStorage.setItem("yorso-lang", lang);
    } catch {
      /* ignore */
    }
  }, locale);
  await page.goto(SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
  // Подождать, пока сработает access-gating и появится anon-CTA.
  await page.getByTestId("supplier-anon-cta").waitFor({ state: "visible" });
};

test.describe("/suppliers/:id · locked-подсказки локализованы во всех локалях", () => {
  for (const locale of ["en", "ru", "es"] as const) {
    test(`${locale}: locked hints используют ${locale}-перевод и не содержат en-fallback`, async ({ page }) => {
      await gotoSupplierAsAnonymous(page, locale);

      const body = page.locator("body");
      const text = (await body.textContent()) ?? "";

      const { expected, forbidden = [] } = EXPECT[locale];

      for (const phrase of expected) {
        expect(
          text,
          `[${locale}] ожидалась locked-подсказка в DOM: "${phrase}"`,
        ).toContain(phrase);
      }

      for (const phrase of forbidden) {
        expect(
          text,
          `[${locale}] обнаружен английский fallback в DOM: "${phrase}"`,
        ).not.toContain(phrase);
      }

      // Каталог поставщика в locked-стейте показывает safe-preview карточки.
      await expect(page.getByTestId("supplier-catalog-locked-row").first()).toBeVisible();
      // Legal placeholder также присутствует.
      await expect(page.getByTestId("supplier-legal-locked")).toBeVisible();
    });
  }
});
