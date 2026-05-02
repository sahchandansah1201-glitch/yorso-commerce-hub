/**
 * Coverage gate for locked-state UI hints.
 *
 * Каждый ключ supplier_locked_* должен:
 *  • существовать во всех локалях (en/ru/es);
 *  • быть непустой строкой;
 *  • не совпадать с английским значением для ru/es (значит fallback, а не перевод),
 *    кроме сознательно одинаковых символьных масок (••••••).
 */
import { describe, it, expect } from "vitest";
import { translations } from "@/i18n/translations";

const LOCKED_KEYS = [
  "supplier_locked_identityHint",
  "supplier_locked_aboutPlaceholder",
  "supplier_locked_anonCtaTitle",
  "supplier_locked_anonCtaBody",
  "supplier_locked_anonCtaButton",
  "supplier_locked_legalHidden",
  "supplier_locked_offersCountHidden",
  "supplier_locked_passportHint",
  "supplier_locked_offersAvailable",
  "supplier_locked_valueMask",
  "supplier_locked_catalogPriceHidden",
  "supplier_locked_catalogSupplierHidden",
] as const;

const SYMBOL_ONLY_KEYS = new Set(["supplier_locked_valueMask"]);

describe("i18n · supplier_locked_* coverage", () => {
  const langs = ["en", "ru", "es"] as const;

  it.each(langs)("locale %s содержит все locked ключи и они непустые", (lang) => {
    const dict = translations[lang] as Record<string, unknown>;
    for (const key of LOCKED_KEYS) {
      const v = dict[key];
      expect(typeof v, `${lang}.${key} должен быть строкой`).toBe("string");
      expect((v as string).trim().length, `${lang}.${key} не должен быть пустым`).toBeGreaterThan(0);
    }
  });

  it("ru/es значения отличаются от en (нет fallback)", () => {
    for (const key of LOCKED_KEYS) {
      if (SYMBOL_ONLY_KEYS.has(key)) continue;
      const en = (translations.en as Record<string, string>)[key];
      const ru = (translations.ru as Record<string, string>)[key];
      const es = (translations.es as Record<string, string>)[key];
      expect(ru, `ru.${key} равен en — похоже на fallback`).not.toBe(en);
      expect(es, `es.${key} равен en — похоже на fallback`).not.toBe(en);
    }
  });

  it("ru локаль содержит кириллицу для текстовых ключей", () => {
    for (const key of LOCKED_KEYS) {
      if (SYMBOL_ONLY_KEYS.has(key)) continue;
      const ru = (translations.ru as Record<string, string>)[key];
      expect(ru, `ru.${key} должен содержать кириллицу`).toMatch(/[А-Яа-яЁё]/);
    }
  });

  it("es локаль содержит характерные испанские символы или слова", () => {
    // Хотя бы один из набора признаков (acceso/oculto/proveedor/precio/registro/solicit/disponibles/tras)
    const esMarkers = /(acceso|oculto|proveedor|precio|registro|solicit|disponibles|tras|datos|complet)/i;
    for (const key of LOCKED_KEYS) {
      if (SYMBOL_ONLY_KEYS.has(key)) continue;
      const es = (translations.es as Record<string, string>)[key];
      expect(es, `es.${key} не похож на испанский: "${es}"`).toMatch(esMarkers);
    }
  });
});
