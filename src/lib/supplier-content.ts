/**
 * Key-based content factories for the SupplierProfile page.
 *
 * Шаг C локализации: вместо хардкод-русских строк фабрики возвращают
 * структуры с i18n-ключами и параметрами интерполяции. Шаг D подключит
 * это в JSX через t(key, params).
 *
 * Все ключи зарегистрированы в src/i18n/translations.ts (Шаг A) для всех
 * трёх языков (en/ru/es). Числа/значения, не зависящие от языка
 * (volume tons, supplier id, hash seed), остаются как параметры — итоговая
 * строка форматируется через t(...) на стороне рендера.
 */
import type { MockSupplier } from "@/data/mockSuppliers";
import { translations } from "@/i18n/translations";

/**
 * TranslationKeys не экспортируется из translations.ts (внутренний тип).
 * Выводим тип ключей из самого объекта переводов — это даёт строгую
 * типизацию без модификации публичного API i18n-модуля.
 */
type TKey = keyof (typeof translations)["en"];

/* ===== Детерминированный seed (тот же алгоритм, что в SupplierProfile) ===== */
const hashSeed = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/* ===== Supplier type label ===== */

export const supplierTypeLabelKey = (
  type: MockSupplier["supplierType"],
): TKey | null => {
  switch (type) {
    case "producer":
      return "supplier_type_producer";
    case "processor":
      return "supplier_type_processor";
    case "exporter":
      return "supplier_type_exporter";
    case "distributor":
      return "supplier_type_distributor";
    case "trader":
      return "supplier_type_trader";
    default:
      return null;
  }
};

/* ===== Shipment cases ===== */

export interface ShipmentCaseI18n {
  id: string;
  /** i18n-ключ заголовка с параметром {product}. */
  titleKey: TKey;
  /** i18n-ключ даты партии (без параметров). */
  dateKey: TKey;
  /** i18n-ключ порта/города назначения. */
  destinationKey: TKey;
  /** Название продукта — уже локализованное вызывающей стороной (через localizeSupplier). */
  product: string;
  /** Объём партии в тоннах (число) — форматируется через ключ supplier_cases_volumeTons. */
  volumeTons: number;
  /** Incoterm-код (язык-нейтральный). */
  incoterm: string;
  /** i18n-ключ типа покупателя (retail / horeca / wholesale). */
  buyerTypeKey: TKey;
  /** i18n-ключ описания/notes партии. */
  notesKey: TKey;
  /** Подписи к фото — каждая как i18n-ключ. */
  photoCaptionKeys: TKey[];
}

export const buildShipmentCasesI18n = (
  supplier: MockSupplier,
  productLabel: string,
): ShipmentCaseI18n[] => {
  const seed = hashSeed(supplier.id);
  return [
    {
      id: "case-de-2024",
      titleKey: "supplier_cases_caseTitle_de",
      dateKey: "supplier_cases_date_oct2024",
      destinationKey: "supplier_cases_destination_de",
      product: productLabel,
      volumeTons: 20 + (seed % 8),
      incoterm: "CFR Hamburg",
      buyerTypeKey: "supplier_cases_buyerType_retail",
      notesKey: "supplier_cases_notes_de",
      photoCaptionKeys: [
        "supplier_cases_photoCaption_loading",
        "supplier_cases_photoCaption_logger",
        "supplier_cases_photoCaption_seal",
        "supplier_cases_photoCaption_docs",
      ],
    },
    {
      id: "case-fr-2024",
      titleKey: "supplier_cases_caseTitle_fr",
      dateKey: "supplier_cases_date_jul2024",
      destinationKey: "supplier_cases_destination_fr",
      product: productLabel,
      volumeTons: 10 + (seed % 6),
      incoterm: "DAP Marseille",
      buyerTypeKey: "supplier_cases_buyerType_horeca",
      notesKey: "supplier_cases_notes_fr",
      photoCaptionKeys: [
        "supplier_cases_photoCaption_pallets",
        "supplier_cases_photoCaption_label",
        "supplier_cases_photoCaption_tempLog",
      ],
    },
    {
      id: "case-ae-2023",
      titleKey: "supplier_cases_caseTitle_ae",
      dateKey: "supplier_cases_date_dec2023",
      destinationKey: "supplier_cases_destination_ae",
      product: productLabel,
      volumeTons: 24 + (seed % 5),
      incoterm: "CIF Jebel Ali",
      buyerTypeKey: "supplier_cases_buyerType_wholesale",
      notesKey: "supplier_cases_notes_ae",
      photoCaptionKeys: [
        "supplier_cases_photoCaption_survey",
        "supplier_cases_photoCaption_loadingHC",
      ],
    },
  ];
};

/* ===== FAQ ===== */

export interface FaqItemI18n {
  /** i18n-ключ вопроса. */
  qKey: TKey;
  /** i18n-ключ ответа (может содержать параметры — см. params). */
  aKey: TKey;
  /** Параметры для интерполяции в ответ (опционально). */
  params?: Record<string, string | number>;
}

export const buildFaqItemsI18n = (supplier: MockSupplier): FaqItemI18n[] => {
  const minBatch = 1 + (hashSeed(supplier.id) % 4);
  return [
    { qKey: "supplier_faq_q1", aKey: "supplier_faq_a1", params: { n: minBatch } },
    { qKey: "supplier_faq_q2", aKey: "supplier_faq_a2" },
    { qKey: "supplier_faq_q3", aKey: "supplier_faq_a3" },
    { qKey: "supplier_faq_q4", aKey: "supplier_faq_a4" },
    { qKey: "supplier_faq_q5", aKey: "supplier_faq_a5" },
    { qKey: "supplier_faq_q6", aKey: "supplier_faq_a6" },
  ];
};

/* ===== Production / logistics — числовые факты, без хардкода строк ===== */
/*
 * Эти билдеры остаются в SupplierProfile.tsx, потому что возвращают
 * чистые числа и язык-нейтральные коды (Incoterms, контейнеры, °C).
 * Локализация их обёрток (label "Tons / day", "Containers" и т.п.)
 * выполняется в JSX через t(...) — ключи готовы (supplier_passport_*).
 */
