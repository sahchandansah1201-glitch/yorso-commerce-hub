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
  // Сброс <head> между тестами — иначе предыдущие meta/JSON-LD протекают.
  document.head.querySelectorAll('script[id^="org-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="faq-jsonld-"]').forEach((s) => s.remove());

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

const getOrgJsonLd = (supplierId = SUPPLIER_ID) => {
  const el = document.getElementById(`org-jsonld-${supplierId}`);
  expect(el, "Organization JSON-LD должен быть в <head>").not.toBeNull();
  return JSON.parse(el!.textContent ?? "{}");
};

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

    it("устанавливает document.title и <html lang> для en", () => {
      renderWithLang("en");
      expect(document.documentElement.lang).toBe("en");
      expect(document.title).toContain("Nordfjord Sjømat AS");
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

    it("устанавливает document.title с RU-суффиксом и <html lang=ru>", () => {
      renderWithLang("ru");
      expect(document.documentElement.lang).toBe("ru");
      expect(document.title).toContain("Поставщик");
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

    it("устанавливает document.title с ES-суффиксом и <html lang=es>", () => {
      renderWithLang("es");
      expect(document.documentElement.lang).toBe("es");
      expect(document.title).toContain("Proveedor");
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
});
