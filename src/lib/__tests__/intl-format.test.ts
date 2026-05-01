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

/* ============================================================
 *  ICU-толерантные шаблоны
 * ------------------------------------------------------------
 *  Между числом и суффиксом ICU разных версий вставляет либо
 *  NBSP (U+00A0), либо NNBSP/тонкий неразрывный (U+202F),
 *  иногда — обычный пробел (U+0020). Все три считаем валидными.
 *
 *  Внутри числа разделитель тысяч у ru-RU тоже колеблется между
 *  U+0020/U+00A0/U+202F, у es-ES исторически "." но в будущих
 *  версиях ICU теоретически возможен пробельный разделитель
 *  (мы не закладываемся на это, см. esThousandsClass ниже).
 *
 *  Эти константы используются вместо жёстких equals "12,000\u00A0t",
 *  чтобы тесты не ломались при апдейте ICU/Node.
 * ============================================================ */

/** Класс символов, который ICU может поставить между числом и суффиксом. */
const NUM_UNIT_SEP = "[\\u0020\\u00A0\\u202F]";

/** Класс «пробельных» разделителей тысяч (для ru-RU и любой будущей es-ES вариации). */
const SPACE_GROUP_SEP = "[\\u0020\\u00A0\\u202F]";

/** Суффикс единицы тонн по локали. */
const tonsSuffix = (lang: AppLang): "t" | "т" => (lang === "ru" ? "т" : "t");

/** Десятичный разделитель по локали (стабильный контракт ICU). */
const decimalSep = (lang: AppLang): "." | "," => (lang === "en" ? "." : ",");

/**
 * Экранирует regex-метасимвол. Достаточно для одиночного символа,
 * который мы вставляем как литерал (точка, запятая).
 */
const reEscape = (ch: string): string => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Строит regex для строки вида "<integer><sep>тонн-суффикс".
 * Группы тысяч задаются массивом; между ними — локаль-специфичный
 * разделитель тысяч (или его класс для пробельных локалей).
 *
 * Пример: tonsRegex("ru", ["1","234","567"]) →
 *   /^1[\u0020\u00A0\u202F]234[\u0020\u00A0\u202F]567[\u0020\u00A0\u202F]т$/
 */
const tonsRegex = (
  lang: AppLang,
  groups: string[],
  opts: { negative?: boolean } = {},
): RegExp => {
  const sign = opts.negative ? "-" : "";
  let groupSep: string;
  if (lang === "ru") groupSep = SPACE_GROUP_SEP;
  else if (lang === "es") groupSep = "\\."; // ICU es-ES today
  else groupSep = ","; // en-US
  const number = groups.join(groupSep);
  return new RegExp(`^${sign}${number}${NUM_UNIT_SEP}${reEscape(tonsSuffix(lang))}$`, "u");
};

/** Тот же шаблон, но без знака и без группировки — для значений < 1000. */
const tonsRegexSmall = (lang: AppLang, n: number): RegExp =>
  new RegExp(`^${n}${NUM_UNIT_SEP}${reEscape(tonsSuffix(lang))}$`, "u");

/** Шаблон для дробного значения: "<int><dec><frac><sep><suffix>". */
const tonsRegexFraction = (lang: AppLang, intPart: string, fracPart: string): RegExp =>
  new RegExp(
    `^${intPart}${reEscape(decimalSep(lang))}${fracPart}${NUM_UNIT_SEP}${reEscape(tonsSuffix(lang))}$`,
    "u",
  );

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

  it("EN: возвращает «<число> t» с неразрывным/тонким пробелом (NBSP|NNBSP|SP)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 20)).toMatch(tonsRegexSmall("en", 20));
  });

  it("RU: возвращает «<число> т» с неразрывным/тонким пробелом (NBSP|NNBSP|SP)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("ru", 20)).toMatch(tonsRegexSmall("ru", 20));
  });

  it("ES: возвращает «<число> t» с неразрывным/тонким пробелом (NBSP|NNBSP|SP)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("es", 20)).toMatch(tonsRegexSmall("es", 20));
  });

  it("использует локальные группировщики тысяч в фолбеке (RU)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("ru", 12000);
    // Суффикс — стабильный «т», между числом и суффиксом — какой-то
    // из неразрывных пробелов (NBSP/NNBSP) — оба валидны для ICU ru-RU.
    expect(out).toMatch(new RegExp(`${NUM_UNIT_SEP}т$`, "u"));
    expect(out).toMatch(tonsRegex("ru", ["12", "000"]));
  });

  it("использует локальные группировщики тысяч в фолбеке (EN)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("en", 12000);
    expect(out).toMatch(new RegExp(`${NUM_UNIT_SEP}t$`, "u"));
    expect(out).toMatch(tonsRegex("en", ["12", "000"]));
  });

  it("кэширует результат: повторный вызов не пытается снова создать unit-formatter", async () => {
    // Если бы кэш не работал, второй вызов снова попал бы в catch
    // и снова сработал бы фолбек — это нормально функционально, но
    // важно, что результат стабильный и идентичный.
    const { formatTons } = await import("@/lib/intl-format");
    const a = formatTons("ru", 7);
    const b = formatTons("ru", 7);
    expect(a).toBe(b);
    expect(a).toMatch(tonsRegexSmall("ru", 7));
  });

  it.each(langs)(
    "%s: между числом и суффиксом стоит неразрывный/тонкий пробел (NBSP|NNBSP), не обычный",
    async (lang) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons(lang, 5);
      // Допустимы NBSP и NNBSP. Обычный пробел перед буквой —
      // признак того, что суффикс «отвалился» от числа в HTML.
      expect(out).not.toMatch(/5 [a-zA-Zа-яА-Я]/);
      expect(out).toMatch(/5[\u00A0\u202F][a-zA-Zа-яА-Я]/u);
    },
  );
});

describe("formatTons · BCP47-теги локалей и группировка тысяч", () => {
  // Эти тесты проверяют, что AppLang ('en'|'ru'|'es') корректно мапится
  // на BCP47-теги en-US / ru-RU / es-ES и что выходная строка
  // использует именно те разделители тысяч, которые ICU выдаёт для
  // этих тегов. Тесты идут БЕЗ моков Intl — это «реальное» окружение.
  //
  // Важно: в Node/jsdom Intl.NumberFormat({ unit: 'metric-ton' })
  // бросает RangeError, поэтому formatTons автоматически идёт через
  // фолбек (formatNumber + локализованный суффикс). Это даёт нам
  // детерминированные строки для assert'ов в этих средах.
  // Если когда-то ICU начнёт поддерживать 'metric-ton' нативно —
  // часть жёстких equals можно будет ослабить до regex.

  beforeEach(() => {
    vi.resetModules();
  });

  it("en → en-US: запятая как разделитель тысяч", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 12000)).toMatch(tonsRegex("en", ["12", "000"]));
    expect(formatTons("en", 1234567)).toMatch(tonsRegex("en", ["1", "234", "567"]));
  });

  it("ru → ru-RU: пробел (NBSP/обычный/тонкий) как разделитель тысяч", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("ru", 12000)).toMatch(tonsRegex("ru", ["12", "000"]));
    expect(formatTons("ru", 1234567)).toMatch(tonsRegex("ru", ["1", "234", "567"]));
  });

  it("es → es-ES: точка как разделитель тысяч (для чисел ≥ 10 000)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    // ICU для es-ES не группирует 4-значные числа (1234 → "1234"),
    // зато группирует от 5 цифр (12000 → "12.000").
    expect(formatTons("es", 12000)).toMatch(tonsRegex("es", ["12", "000"]));
    expect(formatTons("es", 1234567)).toMatch(tonsRegex("es", ["1", "234", "567"]));
  });

  it("малые числа (< 1000) не получают группировки ни в одной локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      expect(formatTons(lang, 5)).toMatch(tonsRegexSmall(lang, 5));
      expect(formatTons(lang, 999)).toMatch(tonsRegexSmall(lang, 999));
    }
  });

  it("ноль форматируется без группировки и со стабильным суффиксом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      expect(formatTons(lang, 0)).toMatch(tonsRegexSmall(lang, 0));
    }
  });

  it("отрицательные числа сохраняют локаль-специфичный знак минуса", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    // Все три локали используют ASCII «-» для коротких чисел.
    for (const lang of langs) {
      expect(formatTons(lang, -20)).toMatch(
        new RegExp(`^-20${NUM_UNIT_SEP}${reEscape(tonsSuffix(lang))}$`, "u"),
      );
    }
  });

  it("группировка крупных чисел совпадает с эталонным Intl(<tag>) тех же локалей", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const cases: Array<{ lang: AppLang; tag: string }> = [
      { lang: "en", tag: "en-US" },
      { lang: "ru", tag: "ru-RU" },
      { lang: "es", tag: "es-ES" },
    ];
    for (const { lang, tag } of cases) {
      const expectedNumber = new Intl.NumberFormat(tag).format(1234567);
      // Извлекаем числовую часть formatTons (всё до последнего пробельного
      // разделителя — NBSP/NNBSP/SP — между числом и суффиксом).
      const out = formatTons(lang, 1234567);
      const m = out.match(new RegExp(`^(.*)${NUM_UNIT_SEP}\\S+$`, "u"));
      expect(m, `formatTons(${lang}, 1234567) = ${JSON.stringify(out)}`).not.toBeNull();
      expect(m![1]).toBe(expectedNumber);
    }
  });

  it("разделители тысяч различаются между en/ru/es для одного и того же числа", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const en = formatTons("en", 12000); // "12,000 t"
    const ru = formatTons("ru", 12000); // "12 000 т"
    const es = formatTons("es", 12000); // "12.000 t"
    // Разделитель = третий символ ("12X000…").
    const sepEn = en[2];
    const sepRu = ru[2];
    const sepEs = es[2];
    expect(sepEn).toBe(",");
    expect(sepEs).toBe(".");
    expect([" ", "\u00A0", "\u202F"]).toContain(sepRu);
    // Все три разделителя — разные.
    expect(new Set([sepEn, sepRu, sepEs]).size).toBe(3);
  });
});

describe("formatTons · граничные значения (0, отрицательные, большие)", () => {
  // Эти тесты сфокусированы на крайних входах: 0, отрицательные числа,
  // большие числа разных порядков и дробные значения. Цель — гарантировать,
  // что:
  //   1) ветка фолбека (когда ICU не знает unit:'metric-ton') корректно
  //      форматирует все эти случаи во всех трёх локалях;
  //   2) суффикс не «слипается» с числом, использует NBSP;
  //   3) дробные значения округляются до целых (maximumFractionDigits=0);
  //   4) очень большие числа группируются и не уходят в expo-нотацию.
  //
  // Тесты идут БЕЗ моков Intl. В Node/jsdom Intl.NumberFormat
  // с unit:'metric-ton' выбрасывает RangeError, поэтому вся ветка
  // фолбека гарантированно покрыта именно этими тестами.

  beforeEach(() => {
    vi.resetModules();
  });

  // ----- 0 -----

  it.each(langs)("ноль форматируется как '0<sep><суффикс>' для %s", async (lang) => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons(lang, 0)).toMatch(tonsRegexSmall(lang, 0));
  });

  it("ноль не превращается в '-0' и не получает знак", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, 0);
      expect(out.startsWith("-")).toBe(false);
      expect(out).not.toMatch(/^-?0[.,]/); // и без дробной части
    }
  });

  // ----- отрицательные -----

  it.each(langs)("маленькое отрицательное (-1) форматируется со знаком минус для %s", async (lang) => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons(lang, -1)).toMatch(
      new RegExp(`^-1${NUM_UNIT_SEP}${reEscape(tonsSuffix(lang))}$`, "u"),
    );
  });

  it("большое отрицательное число группируется и сохраняет знак", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      expect(formatTons(lang, -12000)).toMatch(
        tonsRegex(lang, ["12", "000"], { negative: true }),
      );
    }
  });

  it("очень большое отрицательное (-1 234 567) группируется по локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      expect(formatTons(lang, -1234567)).toMatch(
        tonsRegex(lang, ["1", "234", "567"], { negative: true }),
      );
    }
  });

  // ----- большие числа -----

  it.each([1_000, 10_000, 100_000, 1_000_000, 10_000_000, 999_999_999])(
    "большое число %i форматируется без expo-нотации во всех локалях",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      for (const lang of langs) {
        const out = formatTons(lang, value);
        expect(out).not.toMatch(/[eE][+-]?\d/);
        // Суффикс — последний токен после последнего «пробельного»
        // разделителя (NBSP/NNBSP/SP — зависит от ICU). Внутри числа
        // для RU тоже могут быть такие же разделители тысяч, поэтому
        // ищем именно последний.
        const m = out.match(new RegExp(`^(.*)${NUM_UNIT_SEP}(\\S+)$`, "u"));
        expect(m, `formatTons(${lang}, ${value}) = ${JSON.stringify(out)}`).not.toBeNull();
        expect(m![2]).toBe(tonsSuffix(lang));
      }
    },
  );

  it("миллиард группируется правильно для каждой локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      expect(formatTons(lang, 1_000_000_000)).toMatch(
        tonsRegex(lang, ["1", "000", "000", "000"]),
      );
    }
  });

  it("MAX_SAFE_INTEGER форматируется без потерь и без exponent", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, Number.MAX_SAFE_INTEGER);
      expect(out).not.toMatch(/[eE][+-]?\d/);
      // Должно содержать «9007199254740991» в любом виде с группировкой.
      const digits = out.replace(/[^\d]/g, "");
      expect(digits).toBe(String(Number.MAX_SAFE_INTEGER));
    }
  });

  // ----- дробные значения -----
  // Важно: в текущей реализации фолбек использует formatNumber()
  // (Intl.NumberFormat без явного maximumFractionDigits), поэтому
  // дробная часть СОХРАНЯЕТСЯ в фолбек-ветке. Округление до целых
  // настроено только в нативном unit-formatter'е. Это фиксируется
  // тестами ниже, чтобы будущее изменение поведения было осознанным.

  it("фолбек сохраняет дробную часть (текущий контракт formatNumber)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    // EN/ES — десятичный разделитель «.»/«,», но в любом случае
    // дробная часть должна остаться, и суффикс — в конце.
    expect(formatTons("en", 20.7)).toBe("20.7\u00A0t");
    expect(formatTons("es", 20.7)).toBe("20,7\u00A0t");
    // RU использует «,» как десятичный разделитель.
    expect(formatTons("ru", 20.7)).toBe("20,7\u00A0т");
  });

  it("дробное число не нарушает суффикс ни в одной локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, 0.5);
      expect(out).toMatch(/[тt]$/);
      // Между значением и суффиксом — NBSP.
      expect(out).toMatch(/\u00A0[тt]$/);
    }
  });

  it("отрицательное дробное (-0.4) корректно завершается суффиксом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, -0.4);
      expect(out.startsWith("-")).toBe(true);
      expect(out).toMatch(/\u00A0[тt]$/);
    }
  });

  // ----- суффиксы остаются корректными во всех граничных случаях -----

  it.each([0, -1, 12000, 1_000_000, 1_000_000_000])(
    "RU суффикс «т» сохраняется для значения %i",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons("ru", value);
      expect(out.endsWith("\u00A0т")).toBe(true);
    },
  );

  it.each([0, -1, 12000, 1_000_000, 1_000_000_000])(
    "EN суффикс «t» сохраняется для значения %i",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons("en", value);
      expect(out.endsWith("\u00A0t")).toBe(true);
    },
  );

  it.each([0, -1, 12000, 1_000_000, 1_000_000_000])(
    "ES суффикс «t» сохраняется для значения %i",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons("es", value);
      expect(out.endsWith("\u00A0t")).toBe(true);
    },
  );
});

describe("formatTons · паритет округления Intl ↔ фолбек на дробных", () => {
  // Контекст:
  //   • Нативная ветка создаёт Intl.NumberFormat({
  //       style: 'unit', unit: 'metric-ton', maximumFractionDigits: 0
  //     }) — то есть всегда округляет до целых.
  //   • Фолбек-ветка использует formatNumber(), который под капотом
  //     зовёт Intl.NumberFormat(BCP47[lang]) БЕЗ maximumFractionDigits —
  //     то есть СОХРАНЯЕТ дробную часть.
  //
  // Эти тесты делают расхождение явным: фиксируют, что нативная ветка
  // округляет, а фолбек — нет, на одних и тех же входах. Если паритет
  // будет починен (фолбек тоже добавит maximumFractionDigits=0),
  // it «РАСХОЖДЕНИЕ» упадёт с понятным diff'ом — это и есть сигнал
  // переписать его как проверку паритета.
  //
  // Чтобы ПРОГРАММНО получить нативную ветку в Node/jsdom (где ICU
  // не знает 'metric-ton'), мы патчим Intl.NumberFormat так, чтобы
  // запрос unit:'metric-ton' маппился на поддерживаемый юнит ('meter').
  // Численные опции (maximumFractionDigits и т.п.) сохраняются —
  // нам важна именно числовая часть, а не лексема суффикса.

  const OriginalNumberFormat = Intl.NumberFormat;

  /** Возвращает formatTons из ветки с реальным unit-formatter'ом. */
  const importNative = async () => {
    vi.resetModules();
    const PatchedNumberFormat = function (
      this: unknown,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions,
    ) {
      if (options && options.style === "unit" && options.unit === "metric-ton") {
        return new OriginalNumberFormat(locales, { ...options, unit: "meter" });
      }
      return new OriginalNumberFormat(locales, options);
    } as unknown as typeof Intl.NumberFormat;
    Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);
    (PatchedNumberFormat as unknown as { prototype: unknown }).prototype =
      OriginalNumberFormat.prototype;
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      PatchedNumberFormat;
    return (await import("@/lib/intl-format")).formatTons;
  };

  /** Возвращает formatTons из фолбек-ветки (style:'unit' кидает RangeError). */
  const importFallback = async () => {
    vi.resetModules();
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
    Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);
    (PatchedNumberFormat as unknown as { prototype: unknown }).prototype =
      OriginalNumberFormat.prototype;
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      PatchedNumberFormat;
    return (await import("@/lib/intl-format")).formatTons;
  };

  /** Числовая часть formatTons-выхода (всё до последнего «пробельного» разделителя
   * между числом и суффиксом — это может быть U+0020, U+00A0 или U+202F
   * в зависимости от ветки и движка ICU). */
  const numericPart = (s: string): string => {
    const m = s.match(/^(.*?)[\u0020\u00A0\u202F][^\u0020\u00A0\u202F\d-]+$/);
    return m ? m[1] : s;
  };

  afterEach(() => {
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      OriginalNumberFormat;
  });

  // ----- нативная ветка: округление до целых -----

  it("native EN: дробные округляются до целых для типичных значений", async () => {
    const formatTons = await importNative();
    expect(numericPart(formatTons("en", 20.4))).toBe("20");
    expect(numericPart(formatTons("en", 20.7))).toBe("21");
    expect(numericPart(formatTons("en", 0.4))).toBe("0");
    expect(numericPart(formatTons("en", 0.6))).toBe("1");
    expect(numericPart(formatTons("en", -0.6))).toBe("-1");
    expect(numericPart(formatTons("en", 1234.567))).toBe("1,235");
  });

  it("native: maximumFractionDigits=0 действует во всех трёх локалях", async () => {
    const formatTons = await importNative();
    for (const lang of langs) {
      const num = numericPart(formatTons(lang, 20.7));
      expect(num).not.toMatch(/[.,]\d/);
    }
  });

  // ----- фолбек-ветка: дробная часть СОХРАНЯЕТСЯ -----

  it.each([
    [20.4, "20.4"],
    [20.7, "20.7"],
    [20.45, "20.45"],
    [0.5, "0.5"],
    [-0.5, "-0.5"],
    [1234.567, "1,234.567"],
  ])("fallback EN: %f → числовая часть = %s (без округления)", async (input, expected) => {
    const formatTons = await importFallback();
    expect(numericPart(formatTons("en", input))).toBe(expected);
  });

  it("fallback RU использует «,» как десятичный разделитель", async () => {
    const formatTons = await importFallback();
    expect(numericPart(formatTons("ru", 20.7))).toBe("20,7");
    expect(numericPart(formatTons("ru", 0.05))).toBe("0,05");
  });

  it("fallback ES использует «,» как десятичный разделитель", async () => {
    const formatTons = await importFallback();
    expect(numericPart(formatTons("es", 20.7))).toBe("20,7");
    expect(numericPart(formatTons("es", 0.05))).toBe("0,05");
  });

  // ----- паритет vs расхождение между ветками -----

  it("ПАРИТЕТ: целые числа форматируются одинаково в обеих ветках (числовая часть)", async () => {
    for (const value of [0, 1, 20, 999, 12_000, 1_234_567]) {
      for (const lang of langs) {
        const native = await importNative();
        const nativeOut = numericPart(native(lang, value));
        const fallback = await importFallback();
        const fallbackOut = numericPart(fallback(lang, value));
        expect(
          fallbackOut,
          `lang=${lang}, value=${value}: native="${nativeOut}", fallback="${fallbackOut}"`,
        ).toBe(nativeOut);
      }
    }
  });

  it("РАСХОЖДЕНИЕ (известное): дробные округляются в нативной ветке и НЕ округляются в фолбеке", async () => {
    // ВАЖНО: formatTons лениво создаёт unit-formatter при первом вызове,
    // поэтому patch на Intl должен быть активен В МОМЕНТ вызова.
    // Прогоняем нативную ветку полностью прежде, чем переключаться на фолбек.
    const nativeOuts: Record<string, string> = {};
    const native = await importNative();
    for (const lang of langs) {
      nativeOuts[lang] = numericPart(native(lang, 20.7));
    }

    const fallbackOuts: Record<string, string> = {};
    const fallback = await importFallback();
    for (const lang of langs) {
      fallbackOuts[lang] = numericPart(fallback(lang, 20.7));
    }

    for (const lang of langs) {
      expect(nativeOuts[lang], `native ${lang}`).not.toMatch(/[.,]\d/);
      expect(fallbackOuts[lang], `fallback ${lang}`).toMatch(/[.,]\d/);
      expect(fallbackOuts[lang]).not.toBe(nativeOuts[lang]);
    }
  });

  it("оба варианта НИКОГДА не уходят в expo-нотацию даже на дробных больших числах", async () => {
    const value = 1_234_567.89;
    const nativeOuts: string[] = [];
    const native = await importNative();
    for (const lang of langs) nativeOuts.push(native(lang, value));

    const fallbackOuts: string[] = [];
    const fallback = await importFallback();
    for (const lang of langs) fallbackOuts.push(fallback(lang, value));

    for (const out of [...nativeOuts, ...fallbackOuts]) {
      expect(out).not.toMatch(/[eE][+-]?\d/);
    }
  });

  it("фолбек: суффикс t/т остаётся правильным на дробных значениях", async () => {
    const fallback = await importFallback();
    for (const value of [0.5, 20.7, 1234.567]) {
      expect(fallback("en", value).endsWith("\u00A0t")).toBe(true);
      expect(fallback("ru", value).endsWith("\u00A0т")).toBe(true);
      expect(fallback("es", value).endsWith("\u00A0t")).toBe(true);
    }
  });
});

describe("AppLang → BCP47 маппинг", () => {
  // Маппинг BCP47 — приватная константа в intl-format.ts, поэтому
  // тестируем его через НАБЛЮДАЕМОЕ поведение: шпионим конструктор
  // Intl.NumberFormat и Intl.DateTimeFormat и проверяем, с каким
  // первым аргументом (locales) он был вызван для каждого AppLang.
  //
  // Ожидаемый контракт:
  //   en → "en-US"
  //   ru → "ru-RU"
  //   es → "es-ES"
  // Неизвестные значения (вне union AppLang) → BCP47[lang] = undefined,
  // что для Intl означает «системная локаль» — конструктор НЕ должен
  // падать. Это и есть «корректный фолбек» для неизвестного языка.

  const OriginalNumberFormat = Intl.NumberFormat;
  const OriginalDateTimeFormat = Intl.DateTimeFormat;

  /** Список (locales, options) всех вызовов конструктора в этом тесте. */
  type Call = { locales: unknown; options?: Intl.NumberFormatOptions };

  /** Подменяет Intl.NumberFormat на прокси, фиксирующий каждый вызов
   * и делегирующий в оригинал (без изменения поведения). */
  const spyNumberFormat = (): Call[] => {
    const calls: Call[] = [];
    const Spy = function (
      this: unknown,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions,
    ) {
      calls.push({ locales, options });
      return new OriginalNumberFormat(locales, options);
    } as unknown as typeof Intl.NumberFormat;
    Object.setPrototypeOf(Spy, OriginalNumberFormat);
    (Spy as unknown as { prototype: unknown }).prototype = OriginalNumberFormat.prototype;
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat = Spy;
    return calls;
  };

  /** Аналогично для Intl.DateTimeFormat. */
  const spyDateTimeFormat = (): Call[] => {
    const calls: Call[] = [];
    const Spy = function (
      this: unknown,
      locales?: string | string[],
      options?: Intl.DateTimeFormatOptions,
    ) {
      calls.push({ locales, options });
      return new OriginalDateTimeFormat(locales, options);
    } as unknown as typeof Intl.DateTimeFormat;
    Object.setPrototypeOf(Spy, OriginalDateTimeFormat);
    (Spy as unknown as { prototype: unknown }).prototype = OriginalDateTimeFormat.prototype;
    (Intl as unknown as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat = Spy;
    return calls;
  };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      OriginalNumberFormat;
    (Intl as unknown as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat =
      OriginalDateTimeFormat;
  });

  it.each([
    ["en", "en-US"],
    ["ru", "ru-RU"],
    ["es", "es-ES"],
  ] as Array<[AppLang, string]>)(
    "formatNumber: %s → конструктор Intl.NumberFormat вызван с '%s'",
    async (lang, expectedTag) => {
      const calls = spyNumberFormat();
      const { formatNumber } = await import("@/lib/intl-format");
      formatNumber(lang, 12345);

      // Хотя бы один вызов с ожидаемым BCP47-тегом.
      const tags = calls.map((c) => c.locales);
      expect(tags, JSON.stringify(tags)).toContain(expectedTag);
    },
  );

  it.each([
    ["en", "en-US"],
    ["ru", "ru-RU"],
    ["es", "es-ES"],
  ] as Array<[AppLang, string]>)(
    "formatTons: %s → Intl.NumberFormat (любой ветки) вызван с '%s'",
    async (lang, expectedTag) => {
      const calls = spyNumberFormat();
      const { formatTons } = await import("@/lib/intl-format");
      formatTons(lang, 20);

      // formatTons делает 1-2 вызова конструктора:
      //   • попытка unit:'metric-ton' (может бросить);
      //   • затем formatNumber для группировки (если фолбек).
      // Все они должны идти с тем же BCP47-тегом.
      const tags = calls.map((c) => c.locales);
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) {
        expect(tag).toBe(expectedTag);
      }
    },
  );

  it.each([
    ["en", "en-US"],
    ["ru", "ru-RU"],
    ["es", "es-ES"],
  ] as Array<[AppLang, string]>)(
    "formatMonthYear: %s → Intl.DateTimeFormat вызван с '%s'",
    async (lang, expectedTag) => {
      const calls = spyDateTimeFormat();
      const { formatMonthYear } = await import("@/lib/intl-format");
      formatMonthYear(lang, "2024-10-15");

      const tags = calls.map((c) => c.locales);
      expect(tags).toContain(expectedTag);
    },
  );

  it("formatFullDate использует тот же BCP47-маппинг, что и formatMonthYear", async () => {
    const calls = spyDateTimeFormat();
    const { formatFullDate } = await import("@/lib/intl-format");
    formatFullDate("ru", "2024-10-15");

    const tags = calls.map((c) => c.locales);
    expect(tags).toContain("ru-RU");
    // Это именно DateTimeFormat (не NumberFormat) — проверяем,
    // что хотя бы один вызов был с DateTime-опцией month/day/year.
    const hasDateOptions = calls.some((c) => {
      const o = c.options as Intl.DateTimeFormatOptions | undefined;
      return Boolean(o && (o.day || o.month || o.year));
    });
    expect(hasDateOptions).toBe(true);
  });

  it("маппинг стабилен между вызовами (кэш formatter'ов не теряет язык)", async () => {
    const calls = spyNumberFormat();
    const { formatNumber } = await import("@/lib/intl-format");

    formatNumber("ru", 1);
    formatNumber("ru", 2);
    formatNumber("ru", 3);

    // Все вызовы конструктора (если они были — кэш может сэкономить
    // повторные) шли только с "ru-RU", без случайных перескоков.
    for (const c of calls) {
      expect(c.locales).toBe("ru-RU");
    }
    // И как минимум первый вызов точно произошёл.
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  // ----- неизвестные / некорректные значения -----

  it("неизвестный AppLang: BCP47[lang] = undefined → Intl получает undefined и не падает", async () => {
    const calls = spyNumberFormat();
    const { formatNumber } = await import("@/lib/intl-format");

    // Намеренно выходим за тип AppLang, имитируя «битый» вход
    // (например, забытое значение в БД или стороннюю ошибку).
    const out = formatNumber("xx" as AppLang, 1234);

    // Не упало, вернуло строку, содержащую цифры.
    expect(typeof out).toBe("string");
    expect(out).toMatch(/1.*2.*3.*4/);

    // Конструктор был вызван с locales=undefined (это и есть фолбек:
    // Intl выбирает системную локаль, что безопасно).
    expect(calls.some((c) => c.locales === undefined)).toBe(true);
  });

  it("неизвестный AppLang: formatTons не падает и заканчивается каким-то суффиксом", async () => {
    spyNumberFormat();
    const { formatTons } = await import("@/lib/intl-format");

    const out = formatTons("zz" as AppLang, 20);
    expect(typeof out).toBe("string");
    // Между числом и суффиксом обязан стоять разделитель (NBSP в фолбеке).
    expect(out).toMatch(/20[\u0020\u00A0\u202F]\S+$/);
    // Должен заканчиваться буквой, а не цифрой.
    expect(out).toMatch(/[A-Za-zА-Яа-я]$/);
  });

  it("неизвестный AppLang: formatMonthYear/formatFullDate не падают", async () => {
    spyDateTimeFormat();
    const { formatMonthYear, formatFullDate } = await import("@/lib/intl-format");

    expect(() => formatMonthYear("qq" as AppLang, "2024-10-15")).not.toThrow();
    expect(() => formatFullDate("qq" as AppLang, "2024-10-15")).not.toThrow();

    const m = formatMonthYear("qq" as AppLang, "2024-10-15");
    const d = formatFullDate("qq" as AppLang, "2024-10-15");
    expect(typeof m).toBe("string");
    expect(typeof d).toBe("string");
    expect(m.length).toBeGreaterThan(0);
    expect(d.length).toBeGreaterThan(0);
  });

  it("известные локали маппятся РАЗНО (en/ru/es дают разные locales-аргументы)", async () => {
    const calls = spyNumberFormat();
    const { formatNumber } = await import("@/lib/intl-format");

    formatNumber("en", 1);
    formatNumber("ru", 1);
    formatNumber("es", 1);

    const seen = new Set(calls.map((c) => c.locales));
    expect(seen.has("en-US")).toBe(true);
    expect(seen.has("ru-RU")).toBe(true);
    expect(seen.has("es-ES")).toBe(true);
  });
});

