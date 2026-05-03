import { describe, it, expect } from "vitest";
import { translations, type Language } from "./translations";

/**
 * Гарантируем, что подсказки/чипы/hints, которые видит пользователь,
 * существуют во всех локалях и не «протекают» английским в RU/ES шелл.
 *
 * Если ключ требует локализации, он должен:
 *  - присутствовать в каждой локали (en/ru/es);
 *  - в ru-шелле содержать кириллицу (или быть собственным именем/числом);
 *  - в es-шелле отличаться от en-варианта (что-то реально переведено).
 */

const LANGS: Language[] = ["en", "ru", "es"];

// Ключи, которые точно являются UI-подсказками/чипами/hints
// (фильтры каталога блога, popular topics, start-here, related, hero копии).
const HINT_KEYS = [
  // Чипы фильтра контента блога
  "blog_filter_all",
  "blog_filter_marketIntelligence",
  "blog_filter_buyerGuides",
  "blog_filter_supplierGuides",
  "blog_filter_productUpdates",
  "blog_filter_glossary",
  // Audience-чипы
  "blog_audienceBuyer",
  "blog_audienceSupplier",
  "blog_audienceBoth",
  // Заголовки сайдбара блога
  "blog_popularTopics",
  "blog_startHere",
  "blog_relatedArticles",
  // Popular topic chips
  "blog_topic_salmonPrices",
  "blog_topic_shrimpImports",
  "blog_topic_supplierVerification",
  "blog_topic_rfq",
  "blog_topic_priceAccess",
  "blog_topic_landedCost",
  "blog_topic_documentation",
  // Start-here чипы
  "blog_startHere_catalog_label",
  "blog_startHere_catalog_desc",
  "blog_startHere_suppliers_label",
  "blog_startHere_suppliers_desc",
  "blog_startHere_forSuppliers_label",
  "blog_startHere_forSuppliers_desc",
  "blog_startHere_howItWorks_label",
  "blog_startHere_howItWorks_desc",
  // Поиск/breadcrumbs/page chrome блога
  "blog_searchPlaceholder",
  "blog_pageSubtitle",
  "blog_breadcrumb",
] as const;

const CYRILLIC = /[А-Яа-яЁё]/;

describe("UI hint localization", () => {
  it("каждая локаль определена", () => {
    for (const l of LANGS) {
      expect(translations[l]).toBeTruthy();
    }
  });

  describe.each(HINT_KEYS)("ключ %s", (key) => {
    it("определён во всех локалях и не пустой", () => {
      for (const l of LANGS) {
        const v = (translations[l] as unknown as Record<string, string>)[key];
        expect(typeof v).toBe("string");
        expect(v.trim().length).toBeGreaterThan(0);
      }
    });

    it("RU-вариант содержит кириллицу (не остался на английском)", () => {
      const ru = (translations.ru as unknown as Record<string, string>)[key];
      expect(ru).toMatch(CYRILLIC);
    });

    it("ES-вариант отличается от EN (реально переведён)", () => {
      const en = (translations.en as unknown as Record<string, string>)[key];
      const es = (translations.es as unknown as Record<string, string>)[key];
      // Допускаем равенство только для очень коротких токенов (например, чисел/символов).
      if (en.length > 3) {
        expect(es).not.toBe(en);
      }
    });
  });
});

describe("UI hint localization — нет смешения шелла", () => {
  it("RU breadcrumb блога не на английском", () => {
    expect(translations.ru.blog_breadcrumb).toMatch(CYRILLIC);
  });

  it("RU поиск placeholder не на английском", () => {
    expect(translations.ru.blog_searchPlaceholder).toMatch(CYRILLIC);
  });

  it("RU фильтры контента переведены", () => {
    expect(translations.ru.blog_filter_all).toMatch(CYRILLIC);
    expect(translations.ru.blog_filter_marketIntelligence).toMatch(CYRILLIC);
    expect(translations.ru.blog_filter_buyerGuides).toMatch(CYRILLIC);
  });
});
