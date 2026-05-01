/**
 * E2E-стиль (интеграционный) тест переключения языка на SupplierProfile.
 *
 * Проектная среда: Vitest + React Testing Library + jsdom. Полноценного
 * браузерного e2e (Playwright/Cypress) в проекте нет, поэтому здесь
 * мы прогоняем сценарий "пользователь меняет язык и видит другие
 * единицы/разделители" через реальный LanguageProvider, реальную
 * страницу SupplierProfile и реальный formatTons.
 *
 * Что проверяем:
 *  1) При переключении lang через контекст (en → ru → es) на странице
 *     перерисовываются значения тонн в case-карточках с правильным
 *     суффиксом единицы для каждой локали:
 *        en-US, es-ES → "t"
 *        ru-RU       → "т"
 *  2) formatTons для en-US/ru-RU/es-ES даёт ожидаемые разделители тысяч
 *     и десятичные знаки (контракт BCP47 + локального разделителя).
 *  3) Маленькие значения тонн из supplier-content (10..32) не получают
 *     разделителя тысяч ни в одной локали.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, within, fireEvent } from "@testing-library/react";
import { translations } from "@/i18n/translations";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { formatTons, type AppLang } from "@/lib/intl-format";
import type { Language } from "@/i18n/translations";

const SUPPLIER_ID = "sup-no-001";

/**
 * Тестовый "пульт" над контекстом: позволяет переключать lang
 * императивно из теста, не имитируя клик по UI-свитчеру.
 */
let switchLangFromTest: ((l: Language) => void) | null = null;

const LangProbe = () => {
  const { setLang } = useLanguage();
  switchLangFromTest = setLang;
  return null;
};

const renderApp = (initialLang: Language) => {
  cleanup();
  localStorage.setItem("yorso-lang", initialLang);
  document.head.querySelectorAll('script[id^="org-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="faq-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="itemlist-jsonld-"]').forEach((s) => s.remove());

  return render(
    <MemoryRouter initialEntries={[`/suppliers/${SUPPLIER_ID}`]}>
      <LanguageProvider>
        <LangProbe />
        <BuyerSessionProvider>
          <Routes>
            <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
          </Routes>
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

/**
 * Кейсы (TabsContent value="cases") по умолчанию не в DOM —
 * Radix Tabs рендерит только активный таб. Чтобы протестировать
 * рендер volumeTons в case-карточках, программно активируем таб.
 * Текст таба локализован — берём его из текущих переводов.
 */
const activateCasesTab = (lang: Language) => {
  const label = translations[lang].supplier_tab_cases;
  const trigger = screen.getByRole("tab", { name: label });
  fireEvent.click(trigger);
};

/**
 * Ищем все вхождения строк вида "<число><sep><unit>" с целевым unit
 * (t или т) и возвращаем сами совпадения. Нужен непустой результат —
 * иначе значит, что страница не отрисовала тонны в этой локали.
 */
const collectTonStrings = (unit: "t" | "т"): string[] => {
  // \u00A0 NBSP, \u202F NNBSP, обычный пробел.
  const re = new RegExp(
    `\\d[\\d\\s.,\u00A0\u202F]*[\u0020\u00A0\u202F]${unit}(?![а-яa-zA-Z])`,
    "g",
  );
  const text = document.body.textContent ?? "";
  return text.match(re) ?? [];
};

describe("SupplierProfile · e2e переключение языка и форматирование тонн", () => {
  beforeEach(() => {
    localStorage.clear();
    switchLangFromTest = null;
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    switchLangFromTest = null;
  });

  describe("Сценарий: пользователь монтирует страницу и переключает язык", () => {
    it("en → ru → es: суффикс единицы тонн в case-карточках меняется t → т → t", () => {
      renderApp("en");
      activateCasesTab("en");

      // EN: должны быть значения в тоннах с суффиксом "t" (а не "т").
      const en = collectTonStrings("t");
      expect(en.length, "EN: ожидаются значения тонн с суффиксом t").toBeGreaterThan(0);
      // В EN не должно быть кириллического "т" в качестве единицы тонн.
      expect(collectTonStrings("т")).toHaveLength(0);

      // Переключаем язык через публичное API контекста.
      expect(switchLangFromTest).toBeTypeOf("function");
      act(() => switchLangFromTest!("ru"));
      activateCasesTab("ru");

      const ru = collectTonStrings("т");
      expect(ru.length, "RU: ожидаются значения тонн с суффиксом т").toBeGreaterThan(0);
      // EN-суффикс "t" не должен оставаться у тонн.
      // (отдельные "t" в других словах отфильтрованы регуляркой через границу).
      expect(collectTonStrings("t")).toHaveLength(0);

      act(() => switchLangFromTest!("es"));
      activateCasesTab("es");

      const es = collectTonStrings("t");
      expect(es.length, "ES: ожидаются значения тонн с суффиксом t").toBeGreaterThan(0);
      expect(collectTonStrings("т")).toHaveLength(0);
    });

    it("<html lang> синхронизируется при каждом переключении", () => {
      renderApp("en");
      expect(document.documentElement.lang).toBe("en");

      act(() => switchLangFromTest!("ru"));
      expect(document.documentElement.lang).toBe("ru");

      act(() => switchLangFromTest!("es"));
      expect(document.documentElement.lang).toBe("es");
    });

    it("ru: каждое значение тонн использует именно кириллическое 'т' как unit", () => {
      renderApp("ru");
      activateCasesTab("ru");
      const ru = collectTonStrings("т");
      expect(ru.length).toBeGreaterThan(0);
      for (const s of ru) {
        // Последний символ — кириллическая т, перед ней — какой-то пробел.
        expect(s.endsWith("т")).toBe(true);
        const sepChar = s[s.length - 2];
        expect([" ", "\u00A0", "\u202F"]).toContain(sepChar);
      }
    });
  });

  describe("formatTons · разделители тысяч и десятичных для en-US/ru-RU/es-ES", () => {
    // Эти ожидания — детерминированный контракт BCP47-маппинга,
    // который уже зафиксирован в unit-тестах intl-format. Здесь
    // подтверждаем его именно в связке "локаль страницы → форматтер".
    it.each<[AppLang, number, RegExp, string]>([
      // 1 234 567 — тысячи в каждой локали выглядят по-разному:
      //   en-US: запятая  → "1,234,567"
      //   ru-RU: NBSP/ NNBSP → "1 234 567"
      //   es-ES: точка    → "1.234.567" (для значений ≥ 10 000;
      //          у Intl es-ES для 4-значных может не быть разделителя — поэтому
      //          здесь берём заведомо большое 7-значное число).
      ["en", 1_234_567, /^1,234,567[\u0020\u00A0\u202F]t$/u, "en-US 7-знач."],
      ["ru", 1_234_567, /^1[\u00A0\u202F]234[\u00A0\u202F]567[\u0020\u00A0\u202F]т$/u, "ru-RU 7-знач."],
      ["es", 1_234_567, /^1\.234\.567[\u0020\u00A0\u202F]t$/u, "es-ES 7-знач."],
    ])("formatTons(%s, %i) соответствует %s (%s)", (lang, n, re) => {
      const out = formatTons(lang, n);
      expect(out).toMatch(re);
      // Никакой экспоненциальной нотации.
      expect(out).not.toMatch(/[eE][+-]?\d/);
    });

    it("маленькие значения (10..32) не получают разделителей тысяч ни в одной локали", () => {
      for (const lang of ["en", "ru", "es"] as AppLang[]) {
        for (const n of [10, 20, 27, 32]) {
          const out = formatTons(lang, n);
          // Не должно быть запятой/точки/NBSP-разделителя ВНУТРИ числовой части.
          // Отрезаем суффикс единицы (t/т) и предшествующий ему пробел.
          const numeric = out.replace(/[\u0020\u00A0\u202F](?:t|т)$/u, "");
          expect(numeric, `${lang} → ${n}`).toBe(String(n));
        }
      }
    });

    it("суффикс единицы стабилен: en/es → 't', ru → 'т'", () => {
      expect(formatTons("en", 12).endsWith("t")).toBe(true);
      expect(formatTons("es", 12).endsWith("t")).toBe(true);
      expect(formatTons("ru", 12).endsWith("т")).toBe(true);
    });
  });

  describe("Связка: первый case на странице форматирует volume через активную локаль", () => {
    it("ru показывает 'т', en показывает 't' для одного и того же кейса", () => {
      renderApp("en");
      activateCasesTab("en");
      // Берём первую карточку с заголовком 'Case' (анкер не используем —
      // достаточно проверить, что хотя бы одна dt с label volume имеет
      // соседнее значение, оканчивающееся на " t" в EN).
      const enUnits = collectTonStrings("t");
      const enFirst = enUnits[0];
      expect(enFirst, "EN: должен быть первый блок тонн").toBeDefined();
      expect(enFirst.endsWith("t")).toBe(true);

      act(() => switchLangFromTest!("ru"));
      activateCasesTab("ru");
      const ruUnits = collectTonStrings("т");
      const ruFirst = ruUnits[0];
      expect(ruFirst, "RU: должен быть первый блок тонн").toBeDefined();
      expect(ruFirst.endsWith("т")).toBe(true);

      // Числовая часть (без суффикса) у первого case должна совпасть —
      // данные одни и те же, меняется только локаль форматтера.
      const stripUnit = (s: string) =>
        s.replace(/[\u0020\u00A0\u202F](?:t|т)$/u, "");
      // У значений 10..32 разделитель тысяч не появляется,
      // поэтому числовые части обязаны совпасть посимвольно.
      expect(stripUnit(ruFirst)).toBe(stripUnit(enFirst));
    });
  });

  // Глушим неиспользуемый импорт within (оставлен на случай расширения
  // теста до scoped-поиска в case-карточках).
  void within;
});
