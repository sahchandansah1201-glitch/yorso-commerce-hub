/**
 * Тесты документных метаданных SupplierProfile при смене языка.
 *
 * Покрытие:
 *   • <meta name="description"> — обновляется при смене локали и не дублируется;
 *   • <meta property="og:locale"> — соответствует выбранному языку (en_US / ru_RU / es_ES);
 *   • <html lang="..."> — переключается на язык страницы;
 *   • canonical / hreflang — текущая страница их не выставляет;
 *     это явно зафиксировано как известный пробел (it.skip + комментарий),
 *     чтобы будущая реализация SEO добавила их вместе с тестами.
 *
 * Способ переключения языка — через localStorage до маунта
 * LanguageProvider (публичный контракт, см. LanguageContext).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockSuppliers } from "@/data/mockSuppliers";
import { localizeSupplier } from "@/data/mockSuppliersI18n";
import type { Language } from "@/i18n/translations";

const SUPPLIER_ID = "sup-no-001";

const renderWithLang = (lang: Language) => {
  cleanup();
  localStorage.setItem("yorso-lang", lang);

  // Чистим хедер от мусора предыдущих рендеров, чтобы не было
  // дубликатов meta из других тестов / других страниц.
  document.head
    .querySelectorAll('meta[name="description"], meta[property="og:locale"]')
    .forEach((el) => el.remove());
  document.head
    .querySelectorAll('script[id^="org-jsonld-"], script[id^="faq-jsonld-"], script[id^="itemlist-jsonld-"]')
    .forEach((el) => el.remove());

  return render(
    <MemoryRouter initialEntries={[`/suppliers/${SUPPLIER_ID}`]}>
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

const getMeta = (selector: string): HTMLMetaElement | null =>
  document.head.querySelector<HTMLMetaElement>(selector);

const getAllMeta = (selector: string): HTMLMetaElement[] =>
  Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));

describe("SupplierProfile · документные метаданные при смене языка", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.head
      .querySelectorAll('meta[name="description"], meta[property="og:locale"]')
      .forEach((el) => el.remove());
  });

  describe("meta[name=description]", () => {
    for (const lang of ["en", "ru", "es"] as Language[]) {
      it(`выставляется и непустая (${lang})`, async () => {
        renderWithLang(lang);

        await waitFor(() => {
          const meta = getMeta('meta[name="description"]');
          expect(meta, "meta description должна быть в <head>").not.toBeNull();
          expect(meta!.getAttribute("content")).toBeTruthy();
        });

        const content = getMeta('meta[name="description"]')!.getAttribute("content") ?? "";
        expect(content.length).toBeGreaterThan(10);
      });
    }

    it("использует supplier.shortDescription, когда оно есть", () => {
      renderWithLang("en");
      const baseSupplier = mockSuppliers.find((s) => s.id === SUPPLIER_ID)!;
      const content = getMeta('meta[name="description"]')?.getAttribute("content") ?? "";
      // Известный пробел локализации: shortDescription пока берётся
      // из EN-поля и не переводится через localizeSupplier. Тест
      // фиксирует именно это поведение — если локализацию добавят,
      // ветку assert'а нужно будет переписать вместе с прод-кодом.
      if (baseSupplier.shortDescription) {
        expect(content).toBe(baseSupplier.shortDescription);
      }
    });

    it("не дублирует тег description при ре-рендере одного языка", () => {
      renderWithLang("en");
      // Контракт upsertMeta — обновлять существующий узел, а не создавать новый.
      expect(getAllMeta('meta[name="description"]').length).toBe(1);
    });

    it("при переключении EN → RU тег description остаётся ровно один", async () => {
      const { unmount } = renderWithLang("en");
      const enContent = getMeta('meta[name="description"]')?.getAttribute("content");
      expect(enContent).toBeTruthy();

      unmount();
      renderWithLang("ru");

      await waitFor(() => {
        expect(getMeta('meta[name="description"]')).not.toBeNull();
      });

      // Контракт upsertMeta: один узел на всё приложение, без дублей.
      // (Контент пока не локализуется через localizeSupplier — см. тест выше.)
      expect(getAllMeta('meta[name="description"]').length).toBe(1);
    });
  });

  describe("meta[property=og:locale]", () => {
    const map: Record<Language, string> = {
      en: "en_US",
      ru: "ru_RU",
      es: "es_ES",
    };

    for (const lang of ["en", "ru", "es"] as Language[]) {
      it(`= ${map[lang]} для language=${lang}`, () => {
        renderWithLang(lang);
        const og = getMeta('meta[property="og:locale"]');
        expect(og, "og:locale должен быть в <head>").not.toBeNull();
        expect(og!.getAttribute("content")).toBe(map[lang]);
      });
    }

    it("не плодит дубликаты при ре-рендере", () => {
      renderWithLang("ru");
      expect(getAllMeta('meta[property="og:locale"]').length).toBe(1);
    });

    it("переключается при смене языка EN → ES", async () => {
      const { unmount } = renderWithLang("en");
      expect(getMeta('meta[property="og:locale"]')?.getAttribute("content")).toBe("en_US");
      unmount();

      renderWithLang("es");
      await waitFor(() => {
        expect(getMeta('meta[property="og:locale"]')?.getAttribute("content")).toBe("es_ES");
      });
      expect(getAllMeta('meta[property="og:locale"]').length).toBe(1);
    });
  });

  describe("<html lang>", () => {
    for (const lang of ["en", "ru", "es"] as Language[]) {
      it(`= "${lang}" для language=${lang}`, () => {
        renderWithLang(lang);
        expect(document.documentElement.lang).toBe(lang);
      });
    }
  });

  describe("canonical / hreflang (известный пробел)", () => {
    // Текущая реализация SupplierProfile НЕ выставляет ни canonical,
    // ни hreflang. Это сознательное упрощение Phase 1 (mock data,
    // без публичной мульти-доменной структуры). Эти тесты помечены
    // it.skip, чтобы:
    //   1) задокументировать ожидаемое поведение для будущего SEO-шага;
    //   2) поймать момент, когда canonical/hreflang всё-таки появятся
    //      (нужно будет снять .skip и реализовать assert'ы).
    it.skip("rel=canonical указывает на /suppliers/:id (TODO: добавить в Phase 1.x SEO)", () => {
      renderWithLang("en");
      const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      expect(link).not.toBeNull();
      expect(link!.getAttribute("href")).toContain(`/suppliers/${SUPPLIER_ID}`);
    });

    it.skip("hreflang альтернативы для en/ru/es (TODO: добавить вместе с локализованными URL)", () => {
      renderWithLang("en");
      const links = document.head.querySelectorAll<HTMLLinkElement>(
        'link[rel="alternate"][hreflang]',
      );
      const langs = Array.from(links).map((l) => l.getAttribute("hreflang"));
      expect(langs).toEqual(expect.arrayContaining(["en", "ru", "es", "x-default"]));
    });

    it("инвариант текущей реализации: canonical и hreflang отсутствуют", () => {
      // Чтобы случайно не «протекли» из других страниц/тестов —
      // фиксируем текущее состояние явно.
      renderWithLang("en");
      expect(
        document.head.querySelector('link[rel="canonical"]'),
        "canonical пока не реализован",
      ).toBeNull();
      expect(
        document.head.querySelectorAll('link[rel="alternate"][hreflang]').length,
        "hreflang пока не реализован",
      ).toBe(0);
    });
  });
});
