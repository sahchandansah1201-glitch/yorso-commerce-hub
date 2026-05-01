/**
 * Intl-форматирование для дат, чисел и единиц измерения.
 *
 * Цель: убрать захардкоженные строковые шаблоны вида "Окт 2024", "{n} т"
 * из i18n и переводить их в формате, который Intl сам соберёт по локали.
 */

export type AppLang = "en" | "ru" | "es";

const BCP47: Record<AppLang, string> = {
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
};

const dateMonthYearCache = new Map<AppLang, Intl.DateTimeFormat>();
const dateFullCache = new Map<AppLang, Intl.DateTimeFormat>();
const numberCache = new Map<AppLang, Intl.NumberFormat>();
// null = ICU данной среды не знает unit:'metric-ton' (старые движки, jsdom).
// В этом случае используем фолбек на formatNumber + локализованный суффикс.
const tonsCache = new Map<AppLang, Intl.NumberFormat | null>();

// Локализованный короткий суффикс «т» — используется только в фолбеке,
// когда Intl.NumberFormat({ unit: 'metric-ton' }) бросает RangeError.
const TON_SUFFIX_FALLBACK: Record<AppLang, string> = {
  en: "t",
  ru: "т",
  es: "t",
};

const getMonthYearFormatter = (lang: AppLang): Intl.DateTimeFormat => {
  let f = dateMonthYearCache.get(lang);
  if (!f) {
    f = new Intl.DateTimeFormat(BCP47[lang], { month: "short", year: "numeric" });
    dateMonthYearCache.set(lang, f);
  }
  return f;
};

const getFullDateFormatter = (lang: AppLang): Intl.DateTimeFormat => {
  let f = dateFullCache.get(lang);
  if (!f) {
    f = new Intl.DateTimeFormat(BCP47[lang], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateFullCache.set(lang, f);
  }
  return f;
};

const getNumberFormatter = (lang: AppLang): Intl.NumberFormat => {
  let f = numberCache.get(lang);
  if (!f) {
    f = new Intl.NumberFormat(BCP47[lang]);
    numberCache.set(lang, f);
  }
  return f;
};

const getTonsFormatter = (lang: AppLang): Intl.NumberFormat | null => {
  if (tonsCache.has(lang)) return tonsCache.get(lang) ?? null;
  try {
    // unit: 'metric-ton' даёт "10 t" / "10 т" / "10 t" по локали.
    const f = new Intl.NumberFormat(BCP47[lang], {
      style: "unit",
      unit: "metric-ton",
      unitDisplay: "short",
      maximumFractionDigits: 0,
    });
    tonsCache.set(lang, f);
    return f;
  } catch {
    // Старые ICU (jsdom, некоторые мобильные браузеры) не знают 'metric-ton'.
    // Кэшируем null и далее идём через фолбек на formatNumber + суффикс.
    tonsCache.set(lang, null);
    return null;
  }
};

/** "Окт 2024" / "Oct 2024" / "oct 2024" из ISO-строки. */
export const formatMonthYear = (lang: AppLang, iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // Заглавная первая буква (для ru/es Intl возвращает строчную).
  const s = getMonthYearFormatter(lang).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Полная дата для случаев, когда нужен день. */
export const formatFullDate = (lang: AppLang, iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return getFullDateFormatter(lang).format(d);
};

/** Число с разделителями группы по локали. */
export const formatNumber = (lang: AppLang, n: number): string =>
  getNumberFormatter(lang).format(n);

/** Тонны: "20 t" / "20 т" / "20 t" — с фолбеком, если ICU не знает unit. */
export const formatTons = (lang: AppLang, n: number): string => {
  const f = getTonsFormatter(lang);
  if (f) return f.format(n);
  return `${formatNumber(lang, n)}\u00A0${TON_SUFFIX_FALLBACK[lang]}`;
};

/** Год — без форматирования (4 цифры одинаково везде), но через Intl для NaN-safety. */
export const formatYear = (lang: AppLang, year: number): string =>
  getNumberFormatter(lang).format(year).replace(/\u00A0|,|\s|\./g, "");
