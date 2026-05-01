/**
 * Интеграционные тесты локализации страницы поставщика.
 *
 * Цель Шага E:
 *  - убедиться, что SupplierProfile корректно подхватывает локализованные
 *    значения из mockSuppliersI18n через localizeSupplier (RU/ES);
 *  - убедиться, что EN baseline (исходные поля mockSuppliers) не ломается;
 *  - убедиться, что SEO-метаданные (document.title, og:locale,
 *    <html lang>) и JSON-LD Organization формируются на нужном языке.
 *
 * Тесты выбирают язык через localStorage до маунта LanguageProvider —
 * это публичный контракт провайдера (см. LanguageContext).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockSuppliers } from "@/data/mockSuppliers";
import type { Language } from "@/i18n/translations";

const SUPPLIER_ID = "sup-no-001"; // Nordfjord Sjømat AS — Norway

const renderWithLang = (lang: Language, supplierId = SUPPLIER_ID) => {
  cleanup();
  // LanguageProvider читает выбранный язык из localStorage в инициализаторе.
  localStorage.setItem("yorso-lang", lang);
  // SupplierProfile теперь применяет access gating. Эти i18n-тесты
  // проверяют ИМЕННО локализацию полностью разблокированного профиля,
  // поэтому грантим qualified-доступ перед маунтом.
  sessionStorage.setItem(
    "yorso_buyer_qualification",
    JSON.stringify({ companyName: "", approvedAt: new Date().toISOString() }),
  );
  // Сброс <head> между тестами — иначе предыдущие meta/JSON-LD протекают.
  document.head.querySelectorAll('script[id^="org-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="faq-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="itemlist-jsonld-"]').forEach((s) => s.remove());

  return render(
    <MemoryRouter initialEntries={[`/suppliers/${supplierId}`]}>
      <LanguageProvider>
        <BuyerSessionProvider>
          <Routes>
            <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
          </Routes>
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

const getJsonLdById = (id: string, label: string) => {
  const el = document.getElementById(id);
  expect(el, `${label} JSON-LD должен быть в <head>`).not.toBeNull();
  expect(el!.getAttribute("type")).toBe("application/ld+json");
  return JSON.parse(el!.textContent ?? "{}");
};

const getOrgJsonLd = (supplierId = SUPPLIER_ID) =>
  getJsonLdById(`org-jsonld-${supplierId}`, "Organization");

const getFaqJsonLd = (supplierId = SUPPLIER_ID) =>
  getJsonLdById(`faq-jsonld-${supplierId}`, "FAQPage");

const getItemListJsonLd = (supplierId = SUPPLIER_ID) =>
  getJsonLdById(`itemlist-jsonld-${supplierId}`, "ItemList");

describe("SupplierProfile · локализация RU/ES/EN", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("EN baseline", () => {
    it("рендерит исходные английские строки supplier.country/about и breadcrumbs", () => {
      renderWithLang("en");

      // Базовое поле — country остаётся "Norway" (EN baseline).
      expect(screen.getAllByText(/Norway/).length).toBeGreaterThan(0);

      // Breadcrumb "Suppliers" из en-локали.
      expect(screen.getByText("Suppliers")).toBeInTheDocument();

      // Companion название — без перевода.
      expect(screen.getAllByText(/Nordfjord Sjømat AS/).length).toBeGreaterThan(0);
    });

    it("устанавливает document.title и <html lang> для en", async () => {
      renderWithLang("en");
      expect(document.documentElement.lang).toBe("en");
      // title применяется в microtask, чтобы выиграть гонку
      // с LanguageProvider — ждём через waitFor.
      await waitFor(() => {
        expect(document.title).toContain("Nordfjord Sjømat AS");
      });
      expect(document.title).toContain("Supplier");
      expect(document.title).toContain("YORSO");
    });

    it("сериализует Organization JSON-LD с inLanguage=en", () => {
      renderWithLang("en");
      const json = getOrgJsonLd();
      expect(json["@type"]).toBe("Organization");
      expect(json.inLanguage).toBe("en");
      expect(json.name).toBe("Nordfjord Sjømat AS");
      expect(json.address.addressCountry).toBe("Norway");
      // Описание содержит EN-тип ("producer" → "Producer" по supplierTypeLabelKey).
      expect(typeof json.description).toBe("string");
      expect(json.description).toMatch(/Norway/);
    });
  });

  describe("RU перевод через localizeSupplier", () => {
    it("подменяет country/maskedName на русские значения из mockSuppliersI18n", () => {
      renderWithLang("ru");

      // country: "Norway" → "Норвегия" из COUNTRY_LOCALES.
      expect(screen.getAllByText(/Норвегия/).length).toBeGreaterThan(0);
      // Должно отсутствовать английское "Norway" в общем DOM —
      // legacy EN не должен протекать через локализованного supplier'а.
      expect(screen.queryByText("Norway")).toBeNull();

      // Локализованный breadcrumb.
      expect(screen.getByText("Поставщики")).toBeInTheDocument();
    });

    it("устанавливает document.title с RU-суффиксом и <html lang=ru>", async () => {
      renderWithLang("ru");
      expect(document.documentElement.lang).toBe("ru");
      await waitFor(() => {
        expect(document.title).toContain("Поставщик");
      });
      expect(document.title).toContain("Nordfjord Sjømat AS");
    });

    it("выставляет og:locale=ru_RU", () => {
      renderWithLang("ru");
      const og = document.head.querySelector<HTMLMetaElement>(
        'meta[property="og:locale"]',
      );
      expect(og?.getAttribute("content")).toBe("ru_RU");
    });

    it("сериализует Organization JSON-LD с inLanguage=ru и русским описанием", () => {
      renderWithLang("ru");
      const json = getOrgJsonLd();
      expect(json.inLanguage).toBe("ru");
      // addressCountry и description — на русском (через локализованный supplier).
      expect(json.address.addressCountry).toBe("Норвегия");
      expect(json.description).toMatch(/Норвегия/);
    });
  });

  describe("ES перевод через localizeSupplier", () => {
    it("подменяет country на испанское значение", () => {
      renderWithLang("es");
      expect(screen.getAllByText(/Noruega/).length).toBeGreaterThan(0);
      expect(screen.queryByText("Norway")).toBeNull();
    });

    it("устанавливает document.title с ES-суффиксом и <html lang=es>", async () => {
      renderWithLang("es");
      expect(document.documentElement.lang).toBe("es");
      await waitFor(() => {
        expect(document.title).toContain("Proveedor");
      });
      expect(document.title).toContain("Nordfjord Sjømat AS");
    });

    it("выставляет og:locale=es_ES", () => {
      renderWithLang("es");
      const og = document.head.querySelector<HTMLMetaElement>(
        'meta[property="og:locale"]',
      );
      expect(og?.getAttribute("content")).toBe("es_ES");
    });

    it("сериализует Organization JSON-LD с inLanguage=es и испанским addressCountry", () => {
      renderWithLang("es");
      const json = getOrgJsonLd();
      expect(json.inLanguage).toBe("es");
      expect(json.address.addressCountry).toBe("Noruega");
      expect(json.description).toMatch(/Noruega/);
    });
  });

  describe("Стабильность данных при переключении языка", () => {
    it("использует один и тот же supplier.id во всех локалях (стабильный @id в JSON-LD)", () => {
      // Проверяем, что localizeSupplier не ломает идентификаторы:
      // независимо от языка, JSON-LD ссылается на тот же ресурс.
      const baseSupplier = mockSuppliers.find((s) => s.id === SUPPLIER_ID);
      expect(baseSupplier).toBeDefined();

      for (const lang of ["en", "ru", "es"] as Language[]) {
        renderWithLang(lang);
        const json = getOrgJsonLd();
        expect(json["@id"]).toContain(`/suppliers/${SUPPLIER_ID}`);
        expect(json.name).toBe(baseSupplier!.companyName);
      }
    });
  });


  describe("FAQPage JSON-LD во всех локалях", () => {
    const langCases: Array<{ lang: Language; questionMatch: RegExp }> = [
      // q1 — про MOQ. EN/RU/ES версии содержат разные характерные слова.
      { lang: "en", questionMatch: /minimum|MOQ/i },
      { lang: "ru", questionMatch: /минимальн|партии/i },
      { lang: "es", questionMatch: /mínim|pedido/i },
    ];

    for (const { lang, questionMatch } of langCases) {
      it(`сериализует FAQPage с inLanguage=${lang} и локализованными Q/A`, () => {
        renderWithLang(lang);
        const json = getFaqJsonLd();

        expect(json["@type"]).toBe("FAQPage");
        expect(json.inLanguage).toBe(lang);
        expect(Array.isArray(json.mainEntity)).toBe(true);
        expect(json.mainEntity.length).toBeGreaterThan(0);

        // Каждая запись — Question с непустым acceptedAnswer.text.
        for (const entry of json.mainEntity) {
          expect(entry["@type"]).toBe("Question");
          expect(typeof entry.name).toBe("string");
          expect(entry.name.length).toBeGreaterThan(0);
          expect(entry.acceptedAnswer?.["@type"]).toBe("Answer");
          expect(typeof entry.acceptedAnswer?.text).toBe("string");
          expect(entry.acceptedAnswer.text.length).toBeGreaterThan(0);
        }

        // Первый вопрос должен соответствовать характерной лексике локали.
        expect(json.mainEntity[0].name).toMatch(questionMatch);

        // Параметризованный ответ (a1 содержит {n}) — после интерполяции
        // не должно остаться плейсхолдеров.
        const a1 = json.mainEntity[0].acceptedAnswer.text as string;
        expect(a1).not.toMatch(/\{n\}/);
      });
    }
  });

  describe("ItemList JSON-LD (каталог поставщика) во всех локалях", () => {
    const langCases: Array<{ lang: Language; nameMatch: RegExp }> = [
      { lang: "en", nameMatch: /catalog/i },
      { lang: "ru", nameMatch: /каталог/i },
      { lang: "es", nameMatch: /catálogo/i },
    ];

    for (const { lang, nameMatch } of langCases) {
      it(`сериализует ItemList с inLanguage=${lang} и локализованным name`, () => {
        renderWithLang(lang);
        const json = getItemListJsonLd();
        const baseSupplier = mockSuppliers.find((s) => s.id === SUPPLIER_ID)!;

        expect(json["@type"]).toBe("ItemList");
        expect(json.inLanguage).toBe(lang);
        expect(json["@id"]).toContain(`/suppliers/${SUPPLIER_ID}#catalog`);
        expect(json.name).toMatch(nameMatch);
        expect(json.name).toContain(baseSupplier.companyName);

        // numberOfItems должен совпадать с длиной itemListElement
        // и с реальным каталогом превью.
        expect(json.numberOfItems).toBe(baseSupplier.productCatalogPreview.length);
        expect(Array.isArray(json.itemListElement)).toBe(true);
        expect(json.itemListElement).toHaveLength(json.numberOfItems);

        // Каждая запись — корректный ListItem → Product.
        json.itemListElement.forEach((entry: Record<string, unknown>, idx: number) => {
          expect(entry["@type"]).toBe("ListItem");
          expect(entry.position).toBe(idx + 1);
          const item = entry.item as Record<string, unknown>;
          expect(item["@type"]).toBe("Product");
          expect(typeof item.name).toBe("string");
          expect((item.name as string).length).toBeGreaterThan(0);
          const brand = item.brand as Record<string, unknown>;
          expect(brand["@type"]).toBe("Organization");
          expect(brand.name).toBe(baseSupplier.companyName);
        });
      });
    }

    it("RU: первый продукт переведён через localizeSupplier (не EN baseline)", () => {
      renderWithLang("ru");
      const json = getItemListJsonLd();
      const baseSupplier = mockSuppliers.find((s) => s.id === SUPPLIER_ID)!;
      const enFirst = baseSupplier.productCatalogPreview[0]?.name;
      const ruFirst = json.itemListElement[0].item.name as string;
      // Если для этого поставщика есть RU-патч продукта — RU значение
      // должно отличаться от EN. Если патча нет — fallback к EN допустим
      // (это явно описано в mockSuppliersI18n), и тест мягко это допускает.
      expect(typeof ruFirst).toBe("string");
      expect(ruFirst.length).toBeGreaterThan(0);
      // Хотя бы один продукт в списке должен отличаться от своего EN-имени —
      // иначе локализация каталога не работает.
      const anyTranslated = json.itemListElement.some(
        (entry: { item: { name: string } }, i: number) =>
          entry.item.name !== baseSupplier.productCatalogPreview[i]?.name,
      );
      expect(anyTranslated, `Хотя бы один продукт RU должен отличаться от EN (${enFirst})`).toBe(true);
    });
  });

  describe("Все три JSON-LD блока сосуществуют без конфликтов", () => {
    for (const lang of ["en", "ru", "es"] as Language[]) {
      it(`в <head> присутствуют Organization, FAQPage и ItemList для ${lang}`, () => {
        renderWithLang(lang);
        const org = getOrgJsonLd();
        const faq = getFaqJsonLd();
        const list = getItemListJsonLd();

        expect(org["@type"]).toBe("Organization");
        expect(faq["@type"]).toBe("FAQPage");
        expect(list["@type"]).toBe("ItemList");

        // Все три должны декларировать одинаковый язык.
        expect(org.inLanguage).toBe(lang);
        expect(faq.inLanguage).toBe(lang);
        expect(list.inLanguage).toBe(lang);
      });
    }

    it("при размонтировании все три блока удаляются из <head>", () => {
      const { unmount } = renderWithLang("en");
      expect(document.getElementById(`org-jsonld-${SUPPLIER_ID}`)).not.toBeNull();
      expect(document.getElementById(`faq-jsonld-${SUPPLIER_ID}`)).not.toBeNull();
      expect(document.getElementById(`itemlist-jsonld-${SUPPLIER_ID}`)).not.toBeNull();

      unmount();

      expect(document.getElementById(`org-jsonld-${SUPPLIER_ID}`)).toBeNull();
      expect(document.getElementById(`faq-jsonld-${SUPPLIER_ID}`)).toBeNull();
      expect(document.getElementById(`itemlist-jsonld-${SUPPLIER_ID}`)).toBeNull();
    });
  });
});

