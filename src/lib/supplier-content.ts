import type { MockSupplier } from "@/data/mockSuppliers";
import { translations } from "@/i18n/translations";

/**
 * TranslationKeys не экспортируется из translations.ts (внутренний тип).
 * Выводим тип ключей из самого объекта переводов — это даёт строгую
 * типизацию без модификации публичного API i18n-модуля.
 */
type TKey = keyof (typeof translations)["en"];

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
