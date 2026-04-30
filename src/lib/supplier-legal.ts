import type { MockSupplier } from "@/data/mockSuppliers";

/**
 * Юридические реквизиты поставщика.
 * Mock-слой: значения детерминированно выводятся из id + countryCode,
 * чтобы один и тот же поставщик всегда показывал одни и те же номера.
 * При переходе на реальный API заменить на поля из бэкенда.
 */
export interface SupplierLegalDetails {
  /** Национальный регистрационный номер (Org. number / ИНН / SIREN / UIC). */
  registrationLabel: string;
  registrationNumber: string;
  /** НДС-номер ЕС / страны (если применимо). */
  vatNumber?: string;
  /** Номер EORI (для экспорта в ЕС). */
  eoriNumber?: string;
  /** Юридическая форма компании. */
  legalForm: string;
  /** Полная дата основания (ISO YYYY-MM-DD). */
  foundedDate: string;
}

/** Простая детерминированная hash-функция для мок-данных. */
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const pad = (n: number, width: number) =>
  n.toString().padStart(width, "0").slice(0, width);

/** Метаданные регистрационного номера по стране. */
const REG_BY_COUNTRY: Record<
  string,
  { label: string; format: (seed: number) => string; vatPrefix?: string; vatLen?: number }
> = {
  NO: { label: "Org. nr (Brønnøysund)", format: (s) => pad(s, 9), vatPrefix: "NO", vatLen: 9 },
  IS: { label: "Kennitala", format: (s) => `${pad(s, 6)}-${pad(s >> 6, 4)}` },
  DK: { label: "CVR", format: (s) => pad(s, 8), vatPrefix: "DK", vatLen: 8 },
  SE: { label: "Org.nr", format: (s) => `${pad(s, 6)}-${pad(s >> 6, 4)}`, vatPrefix: "SE", vatLen: 12 },
  NL: { label: "KvK", format: (s) => pad(s, 8), vatPrefix: "NL", vatLen: 12 },
  ES: { label: "CIF", format: (s) => `B${pad(s, 8)}`, vatPrefix: "ES", vatLen: 9 },
  FR: { label: "SIREN", format: (s) => pad(s, 9), vatPrefix: "FR", vatLen: 11 },
  DE: { label: "HRB", format: (s) => `HRB ${pad(s, 6)}`, vatPrefix: "DE", vatLen: 9 },
  IT: { label: "REA", format: (s) => pad(s, 7), vatPrefix: "IT", vatLen: 11 },
  PL: { label: "KRS", format: (s) => pad(s, 10), vatPrefix: "PL", vatLen: 10 },
  GB: { label: "Companies House", format: (s) => pad(s, 8), vatPrefix: "GB", vatLen: 9 },
  CN: { label: "USCC", format: (s) => `91${pad(s, 16)}` },
  VN: { label: "Tax code", format: (s) => pad(s, 10) },
  TH: { label: "Tax ID", format: (s) => pad(s, 13) },
  IN: { label: "CIN", format: (s) => `U${pad(s, 5)}MH${pad(s >> 4, 4)}` },
  EC: { label: "RUC", format: (s) => pad(s, 13) },
  CL: { label: "RUT", format: (s) => `${pad(s, 8)}-${(s % 10).toString()}` },
  PE: { label: "RUC", format: (s) => `20${pad(s, 9)}` },
  RU: { label: "ОГРН", format: (s) => `1${pad(s, 12)}` },
  TR: { label: "MERSİS", format: (s) => pad(s, 16) },
  MA: { label: "RC", format: (s) => pad(s, 7) },
  US: { label: "EIN", format: (s) => `${pad(s, 2)}-${pad(s >> 4, 7)}` },
};

const DEFAULT_REG = {
  label: "Reg. number",
  format: (s: number) => pad(s, 9),
};

/** Юр. форма по стране — упрощённая карта. */
const LEGAL_FORM: Record<string, string> = {
  NO: "AS (Aksjeselskap)",
  IS: "ehf.",
  DK: "A/S",
  SE: "AB (Aktiebolag)",
  NL: "B.V.",
  ES: "S.L.",
  FR: "SAS",
  DE: "GmbH",
  IT: "S.r.l.",
  PL: "Sp. z o.o.",
  GB: "Ltd",
  CN: "Co., Ltd.",
  VN: "Co., Ltd.",
  TH: "Co., Ltd.",
  IN: "Pvt. Ltd.",
  EC: "Cía. Ltda.",
  CL: "S.A.",
  PE: "S.A.C.",
  RU: "ООО",
  TR: "A.Ş.",
  MA: "S.A.R.L.",
  US: "LLC",
};

/** Производит дату основания на базе известного года, добавляя детерминированные месяц/день. */
const buildFoundedDate = (year: number, seed: number): string => {
  const month = (seed % 12) + 1;
  // Безопасный диапазон дней (1..28), чтобы не зависеть от длины месяца.
  const day = ((seed >> 4) % 28) + 1;
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
};

/** Является ли страна членом ЕС/ЕЭЗ — для VAT/EORI. */
const EU_EEA = new Set([
  "NO", "IS", "DK", "SE", "NL", "ES", "FR", "DE", "IT", "PL", "BE", "PT",
  "FI", "AT", "IE", "GR", "RO", "BG", "HU", "CZ", "SK", "SI", "HR", "EE",
  "LV", "LT", "LU", "MT", "CY",
]);

export const getSupplierLegalDetails = (
  supplier: MockSupplier,
): SupplierLegalDetails => {
  const seed = hash(`${supplier.id}:${supplier.countryCode}`);
  const country = supplier.countryCode.toUpperCase();
  const reg = REG_BY_COUNTRY[country] ?? DEFAULT_REG;

  const registrationNumber = reg.format(seed);

  let vatNumber: string | undefined;
  if (reg.vatPrefix && reg.vatLen) {
    vatNumber = `${reg.vatPrefix}${pad(seed >> 2, reg.vatLen)}`;
  }

  // EORI: для ЕС/ЕЭЗ-стран — формат {ISO}{до 15 цифр}.
  const eoriNumber = EU_EEA.has(country)
    ? `${country}${pad(seed >> 1, 12)}`
    : undefined;

  return {
    registrationLabel: reg.label,
    registrationNumber,
    vatNumber,
    eoriNumber,
    legalForm: LEGAL_FORM[country] ?? "Ltd.",
    foundedDate: buildFoundedDate(supplier.inBusinessSinceYear, seed),
  };
};

/** Локализованный формат даты — DD.MM.YYYY (универсально для B2B). */
export const formatFoundedDate = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
