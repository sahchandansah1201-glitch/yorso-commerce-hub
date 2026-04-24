/**
 * Локаль-зависимое форматирование чисел, цен и количеств.
 *
 * Контракт:
 *   - Локаль определяется текущим `lang` (en | ru | es) и маппится на
 *     стандартный BCP-47 тег (en-US, ru-RU, es-ES).
 *   - Для валюты по умолчанию используется USD (исторически цены каталога
 *     указаны в долларах). Можно переопределить через параметр `currency`.
 *   - Дробная часть цены: 2 знака.
 *   - Количество: целое, с локализованным разделителем тысяч.
 *
 * Дизайн: тонкая обёртка над Intl.NumberFormat. Никакой бизнес-логики,
 * никакого кэширования (Intl сам кэширует внутренне в большинстве движков).
 */
import type { Language } from "@/i18n/translations";

const LOCALE_MAP: Record<Language, string> = {
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
};

export const localeFor = (lang: Language): string => LOCALE_MAP[lang] ?? "en-US";

/**
 * Внутренний хелпер: возвращает базовые опции с принудительной группировкой
 * тысяч во ВСЕХ локалях, включая es-ES.
 *
 * Зачем: ICU es-ES по умолчанию НЕ группирует 4-значные числа
 * ("1234" вместо "1.234"), что плохо читается в B2B-каталоге, где MOQ
 * и цены в районе 1000–9999 — типичный случай. `minimumGroupingDigits: 1`
 * заставляет группировать любое число ≥ 1000.
 */
const groupingOpts = (): Intl.NumberFormatOptions => ({
  useGrouping: true,
  // @ts-expect-error — minimumGroupingDigits поддерживается V8/Node 14+, но
  // ещё не во всех TS-libs. Безопасно: ICU игнорирует неизвестные опции.
  minimumGroupingDigits: 1,
});

export const formatNumber = (
  value: number,
  lang: Language,
  options?: Intl.NumberFormatOptions,
): string =>
  new Intl.NumberFormat(localeFor(lang), {
    maximumFractionDigits: 0,
    ...groupingOpts(),
    ...options,
  }).format(value);

export const formatPrice = (
  value: number,
  lang: Language,
  currency = "USD",
): string =>
  new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...groupingOpts(),
  }).format(value);

/**
 * Разделитель диапазона: en-dash, обёрнутый неразрывными пробелами, чтобы
 * строка вида "8,50 $ – 9,20 $" не переносилась посередине ни в EN, ни в RU,
 * ни в ES. NBSP (\u00a0) поддерживается всеми браузерами, читалками и при
 * копировании сохраняет визуальную целостность диапазона.
 */
export const RANGE_SEPARATOR = "\u00a0–\u00a0";

/**
 * Форматирует диапазон цен типа "8.50 – 9.20" → en: "$8.50 – $9.20",
 * ru: "8,50 $ – 9,20 $", es: "8,50 US$ – 9,20 US$".
 *
 * Намеренно повторяет символ валюты для каждого конца диапазона: это
 * читается однозначно во всех трёх локалях и не требует ручного парсинга
 * partial-форматов.
 */
export const formatPriceRange = (
  min: number,
  max: number,
  lang: Language,
  currency = "USD",
): string => {
  if (min === max) return formatPrice(min, lang, currency);
  return `${formatPrice(min, lang, currency)}${RANGE_SEPARATOR}${formatPrice(max, lang, currency)}`;
};

/**
 * Форматирует количество с единицей измерения. Единица — уже переведённая
 * строка (например, "kg" / "кг"), задача утилиты — только число.
 */
export const formatQuantity = (
  value: number,
  unit: string,
  lang: Language,
): string => `${formatNumber(value, lang)} ${unit}`;

/**
 * Локализованная дата (без времени) для UI workspace и других списков.
 */
export const formatDate = (
  iso: string,
  lang: Language,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeFor(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
};
