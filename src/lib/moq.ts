/**
 * Нормализация MOQ (Minimum Order Quantity).
 *
 * Контракт:
 *   В моковых данных и в будущем API минимальная партия может приходить в
 *   разных формах:
 *     - "MOQ: 1,000 kg"            (legacy строка с префиксом)
 *     - "1,000 kg"                  (без префикса)
 *     - "1 000 kg"                  (NBSP/обычный пробел как разделитель тысяч)
 *     - "1,000 – 4,999 kg"          (диапазон через en-dash)
 *     - "1,000 - 4,999 kg"          (диапазон через ASCII-дефис)
 *     - "20,000+ kg"                (открытый сверху диапазон)
 *     - { volumeBreaks[0].minQty }  (обычно уже в одной из форм выше)
 *     - number (1000)               (числовое значение из нового API)
 *
 * Цель этой утилиты — привести любую из этих форм к единой строке вида
 * `"<число|диапазон> <unit>"`, без префикса "MOQ:" (префикс/лейбл UI
 * добавляет сам). Локализация числа выполняется через formatNumber.
 *
 * Дизайн: чистая функция, никаких побочных эффектов, безопасна для SSR.
 * Если вход не распознан — возвращаем исходную строку, очищенную от
 * префикса "MOQ:". Это «honest fallback»: лучше показать сырой вход,
 * чем потерять информацию.
 */
import type { Language } from "@/i18n/translations";
import { formatNumber, RANGE_SEPARATOR } from "@/lib/format";

export interface NormalizedMoq {
  /** Готовая к показу строка, например "1 000 – 4 999 кг" или "20 000+ kg". */
  display: string;
  /** Числовая нижняя граница, если её удалось извлечь. */
  min?: number;
  /** Числовая верхняя граница, если задан явный диапазон. */
  max?: number;
  /** Распознанная единица измерения как она встретилась во входе. */
  unit?: string;
  /** true, если форма "20,000+" (открытый сверху). */
  openEnded?: boolean;
}

const MOQ_PREFIX = /^\s*MOQ\s*[:\-]?\s*/i;
// Разделители диапазонов: en-dash, em-dash, ASCII-минус, "to".
const RANGE_SEP = /\s*(?:–|—|-|to)\s*/i;
// Извлечение числа: цифры с возможными разделителями (',', '.', ' ', NBSP, NNBSP).
const NUMBER_RE = /(\d[\d.,\u00a0\u202f\s]*)/;

const stripPrefix = (raw: string): string => raw.replace(MOQ_PREFIX, "").trim();

const parseNumber = (token: string): number | undefined => {
  // Удаляем все разделители тысяч (пробелы любого типа и запятые).
  // Точка считается десятичным разделителем — но MOQ почти всегда целое,
  // и "1,000" встречается чаще, чем "1.5". Поэтому: если есть и ',' и '.',
  // считаем ',' разделителем тысяч; если только ',' — тоже разделитель тысяч
  // (типичный en-формат для MOQ); если только '.' — десятичная точка.
  const cleaned = token.replace(/[\u00a0\u202f\s]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    normalized = cleaned.replace(/,/g, "");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

const extractUnit = (raw: string, after: string): string | undefined => {
  // Единица — это нечисловой хвост строки после последнего числа.
  const tail = raw.slice(raw.lastIndexOf(after) + after.length).trim();
  // Удаляем ведущие "+", разделители и слеши.
  const unit = tail.replace(/^[+\s/]+/, "").trim();
  return unit.length > 0 ? unit : undefined;
};

/**
 * Главная функция нормализации.
 */
export const normalizeMoq = (
  input: string | number | null | undefined,
  lang: Language,
  fallbackUnit = "kg",
): NormalizedMoq => {
  if (input === null || input === undefined || input === "") {
    return { display: "—" };
  }

  if (typeof input === "number") {
    return {
      display: `${formatNumber(input, lang)} ${fallbackUnit}`,
      min: input,
      unit: fallbackUnit,
    };
  }

  const stripped = stripPrefix(input);
  if (stripped.length === 0) return { display: "—" };

  // Открытый сверху диапазон: "20,000+ kg"
  const openMatch = stripped.match(/^(\d[\d.,\u00a0\u202f\s]*)\s*\+\s*(.*)$/);
  if (openMatch) {
    const min = parseNumber(openMatch[1]);
    const unit = openMatch[2].trim() || fallbackUnit;
    if (min !== undefined) {
      return {
        display: `${formatNumber(min, lang)}+ ${unit}`,
        min,
        unit,
        openEnded: true,
      };
    }
  }

  // Диапазон: "1,000 – 4,999 kg"
  const parts = stripped.split(RANGE_SEP);
  if (parts.length === 2) {
    const left = parts[0].match(NUMBER_RE)?.[1];
    const rightMatch = parts[1].match(NUMBER_RE);
    const right = rightMatch?.[1];
    if (left && right) {
      const min = parseNumber(left);
      const max = parseNumber(right);
      // Единица — хвост второй части после числа.
      const tail = parts[1]
        .slice((rightMatch?.index ?? 0) + right.length)
        .trim();
      const unit = tail.length > 0 ? tail : fallbackUnit;
      if (min !== undefined && max !== undefined) {
        return {
          display: `${formatNumber(min, lang)}${RANGE_SEPARATOR}${formatNumber(max, lang)} ${unit}`,
          min,
          max,
          unit,
        };
      }
    }
  }

  // Одиночное значение: "1,000 kg"
  const singleMatch = stripped.match(NUMBER_RE);
  if (singleMatch) {
    const value = parseNumber(singleMatch[1]);
    const unit = extractUnit(stripped, singleMatch[1]) ?? fallbackUnit;
    if (value !== undefined) {
      return {
        display: `${formatNumber(value, lang)} ${unit}`,
        min: value,
        unit,
      };
    }
  }

  // Honest fallback: возвращаем как есть (без префикса MOQ:).
  return { display: stripped };
};

/**
 * Сводит набор тиров MOQ (или одиночный MOQ) к читаемому диапазону вида
 * "1,000 – 20,000+ kg". Используется чтобы показать покупателю масштаб
 * минимальной партии даже когда цена скрыта (anonymous_locked /
 * registered_locked).
 *
 * Правила:
 *   - Берём min нижнего тира и max верхнего тира.
 *   - Если верхний тир open-ended ("20,000+ kg") — добавляем "+".
 *   - Если все тиры свелись к одному значению — возвращаем его одиночным.
 *   - Единица берётся из первого распознанного тира; fallback — параметр.
 *   - Если ничего распознать не удалось — возвращаем undefined, чтобы
 *     вызывающая сторона могла скрыть строку, а не показать мусор.
 */
export const summarizeMoqRange = (
  tiers: ReadonlyArray<string | number | null | undefined>,
  lang: Language,
  fallbackUnit = "kg",
): string | undefined => {
  const parsed = tiers
    .map((t) => normalizeMoq(t, lang, fallbackUnit))
    .filter((m) => m.min !== undefined);
  if (parsed.length === 0) return undefined;

  const mins = parsed.map((m) => m.min as number);
  const maxes = parsed.map((m) => m.max ?? (m.min as number));
  const lowest = Math.min(...mins);
  const highest = Math.max(...maxes);
  const unit = parsed[0].unit ?? fallbackUnit;
  // Open-ended если хотя бы один тир — open-ended и его min == highest.
  const openEnded = parsed.some((m) => m.openEnded && (m.min ?? -Infinity) >= highest);

  if (lowest === highest && !openEnded) {
    return `${formatNumber(lowest, lang)} ${unit}`;
  }
  const upper = openEnded ? `${formatNumber(highest, lang)}+` : formatNumber(highest, lang);
  return `${formatNumber(lowest, lang)}${RANGE_SEPARATOR}${upper} ${unit}`;
};
