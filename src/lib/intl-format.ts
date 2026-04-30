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
const tonsCache = new Map<AppLang, Intl.NumberFormat>();

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

const getTonsFormatter = (lang: AppLang): Intl.NumberFormat => {
  let f = tonsCache.get(lang);
  if (!f) {
    // unit: 'metric-ton' даёт "10 t" / "10 т" / "10 t" по локали.
    f = new Intl.NumberFormat(BCP47[lang], {
      style: "unit",
      unit: "metric-ton",
      unitDisplay: "short",
      maximumFractionDigits: 0,
    });
    tonsCache.set(lang, f);
  }
  return f;
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

/** Тонны: "20 t" / "20 т" / "20 t". */
export const formatTons = (lang: AppLang, n: number): string =>
  getTonsFormatter(lang).format(n);

/** Год — без форматирования (4 цифры одинаково везде), но через Intl для NaN-safety. */
export const formatYear = (lang: AppLang, year: number): string =>
  getNumberFormatter(lang).format(year).replace(/\u00A0|,|\s|\./g, "");
