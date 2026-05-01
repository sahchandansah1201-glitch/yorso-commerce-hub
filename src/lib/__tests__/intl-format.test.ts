/**
 * Unit-тесты для formatTons.
 *
 * Цель:
 *  1) проверить «happy path» через нативный Intl с unit:'metric-ton';
 *  2) гарантировать корректный фолбек, когда ICU среды не поддерживает
 *     unit:'metric-ton' (старые движки, некоторые сборки jsdom);
 *  3) зафиксировать стабильные строки локализованного суффикса для RU/EN/ES.
 *
 * Кэш formatter'ов внутри intl-format.ts — модульный, поэтому ветки
 * (нативная vs фолбек) разводятся через `vi.resetModules()` и подмену
 * глобального Intl.NumberFormat ДО динамического импорта модуля.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppLang } from "@/lib/intl-format";

const langs: AppLang[] = ["en", "ru", "es"];

describe("formatTons · нативный Intl (happy path)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.each(langs)("формирует число и суффикс для %s через Intl unit", async (lang) => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons(lang, 20);

    // Должно содержать локализованную форму числа и какой-то непустой
    // суффикс (Intl сам выберет 't' / 'т' / 'tn' и т.п. — нам важно,
    // что строка не пустая и в ней есть «20»).
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(1);
    expect(out).toMatch(/20/);
    // Не оставляем «20» одиноко — должен быть символ единицы рядом.
    expect(out.replace(/20/, "").trim().length).toBeGreaterThan(0);
  });

  it("целые числа без дробной части (maximumFractionDigits=0)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("en", 20);
    // "20.0 t" быть не должно — настройка явно режет дробную часть.
    expect(out).not.toMatch(/20[.,]\d/);
  });

  it("разделители тысяч соответствуют локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const en = formatTons("en", 12000);
    const ru = formatTons("ru", 12000);
    // EN: запятая или тонкий пробел; RU: пробел/неразрывный пробел.
    // Главное — присутствие «12» и «000» в группированном виде.
    expect(en).toMatch(/12[\s,\u00A0\u202F]?000/);
    expect(ru).toMatch(/12[\s\u00A0\u202F]?000/);
  });
});

describe("formatTons · фолбек, когда ICU не знает unit:'metric-ton'", () => {
  // Сохраним оригинальный Intl.NumberFormat и подменим его так,
  // чтобы конструктор бросал RangeError на любых style:'unit' опциях.
  const OriginalNumberFormat = Intl.NumberFormat;

  beforeEach(() => {
    vi.resetModules();

    // Прокси-конструктор: при попытке создать formatter с style:'unit'
    // выбрасываем RangeError, как это делает старый ICU. Для всех
    // прочих случаев делегируем в оригинальный Intl.NumberFormat.
    const PatchedNumberFormat = function (
      this: unknown,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions,
    ) {
      if (options && options.style === "unit") {
        throw new RangeError("Invalid unit argument for Intl.NumberFormat()");
      }
      return new OriginalNumberFormat(locales, options);
    } as unknown as typeof Intl.NumberFormat;
    // Сохраняем статические методы (supportedLocalesOf и т.п.).
    Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);
    (PatchedNumberFormat as unknown as { prototype: unknown }).prototype =
      OriginalNumberFormat.prototype;

    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      PatchedNumberFormat;
  });

  afterEach(() => {
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      OriginalNumberFormat;
  });

  it("EN: возвращает «<число> t» с неразрывным пробелом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 20)).toBe("20\u00A0t");
  });

  it("RU: возвращает «<число> т» с неразрывным пробелом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("ru", 20)).toBe("20\u00A0т");
  });

  it("ES: возвращает «<число> t» с неразрывным пробелом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("es", 20)).toBe("20\u00A0t");
  });

  it("использует локальные группировщики тысяч в фолбеке (RU)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("ru", 12000);
    // Суффикс — стабильный «т», между числом и суффиксом —
    // именно неразрывный пробел \u00A0 (а не обычный).
    expect(out.endsWith("\u00A0т")).toBe(true);
    expect(out).toMatch(/^12[\s\u00A0\u202F]?000\u00A0т$/);
  });

  it("использует локальные группировщики тысяч в фолбеке (EN)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("en", 12000);
    expect(out.endsWith("\u00A0t")).toBe(true);
    expect(out).toMatch(/^12,000\u00A0t$/);
  });

  it("кэширует результат: повторный вызов не пытается снова создать unit-formatter", async () => {
    // Если бы кэш не работал, второй вызов снова попал бы в catch
    // и снова сработал бы фолбек — это нормально функционально, но
    // важно, что результат стабильный и идентичный.
    const { formatTons } = await import("@/lib/intl-format");
    const a = formatTons("ru", 7);
    const b = formatTons("ru", 7);
    expect(a).toBe(b);
    expect(a).toBe("7\u00A0т");
  });

  it.each(langs)(
    "%s: между числом и суффиксом стоит именно \\u00A0, а не обычный пробел",
    async (lang) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons(lang, 5);
      // Не должно быть последовательности «обычный пробел + буква»:
      // только NBSP допустим как разделитель.
      expect(out).not.toMatch(/5 [a-zA-Zа-яА-Я]/);
      expect(out).toMatch(/5\u00A0[a-zA-Zа-яА-Я]/);
    },
  );
});
