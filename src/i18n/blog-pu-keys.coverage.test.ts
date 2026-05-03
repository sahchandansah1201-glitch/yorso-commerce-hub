/**
 * i18n coverage · product update teaser keys.
 *
 * Гарантирует, что новые ключи blog_pu_type_*, blog_pu_area_*
 * и blog_pu_teaserNeutral присутствуют, не пустые и язык-специфичны
 * во всех локалях en/ru/es.
 */
import { describe, it, expect } from "vitest";
import { translations } from "./translations";

const TYPE_KEYS = [
  "blog_pu_type_added",
  "blog_pu_type_improved",
  "blog_pu_type_fixed",
  "blog_pu_type_guide",
] as const;

const AREA_KEYS = [
  "blog_pu_area_catalog",
  "blog_pu_area_supplierProfiles",
  "blog_pu_area_priceAccess",
  "blog_pu_area_registration",
  "blog_pu_area_requests",
  "blog_pu_area_intelligence",
] as const;

const NEUTRAL_KEY = "blog_pu_teaserNeutral" as const;

const ALL_KEYS = [...TYPE_KEYS, ...AREA_KEYS, NEUTRAL_KEY];
const LANGS = ["en", "ru", "es"] as const;

const CYRILLIC = /[А-Яа-яЁё]/;
// Spanish-specific markers (diacritics or ñ); fallback to non-empty string.
const SPANISH_MARKERS = /[ñÑáéíóúÁÉÍÓÚ¿¡]/;

describe("i18n · product update teaser keys", () => {
  for (const lang of LANGS) {
    describe(lang, () => {
      const dict = translations[lang] as unknown as Record<string, string>;

      it.each(ALL_KEYS)("has non-empty key %s", (k) => {
        expect(typeof dict[k]).toBe("string");
        expect(dict[k].trim().length).toBeGreaterThan(0);
      });
    });
  }

  it("RU values for type/area/neutral are Cyrillic (no English leak)", () => {
    const dict = translations.ru as unknown as Record<string, string>;
    for (const k of ALL_KEYS) {
      expect(CYRILLIC.test(dict[k]), `ru:${k}="${dict[k]}" must be Cyrillic`).toBe(true);
    }
  });

  it("ES values are not identical to EN (real translation, not pass-through)", () => {
    const en = translations.en as unknown as Record<string, string>;
    const es = translations.es as unknown as Record<string, string>;
    for (const k of ALL_KEYS) {
      expect(es[k], `es:${k} must differ from en`).not.toBe(en[k]);
    }
  });

  it("ES neutral teaser uses Spanish markers (not English text)", () => {
    const v = (translations.es as unknown as Record<string, string>)[NEUTRAL_KEY];
    expect(SPANISH_MARKERS.test(v) || /producto/i.test(v)).toBe(true);
    expect(/^Product update\b/i.test(v)).toBe(false);
  });

  it("EN neutral teaser is plain English (no Cyrillic, no Spanish markers)", () => {
    const v = (translations.en as unknown as Record<string, string>)[NEUTRAL_KEY];
    expect(CYRILLIC.test(v)).toBe(false);
    expect(SPANISH_MARKERS.test(v)).toBe(false);
  });

  it("all locales have unique enum labels (no duplicates inside type/area)", () => {
    for (const lang of LANGS) {
      const dict = translations[lang] as unknown as Record<string, string>;
      const typeVals = TYPE_KEYS.map((k) => dict[k]);
      const areaVals = AREA_KEYS.map((k) => dict[k]);
      expect(new Set(typeVals).size).toBe(typeVals.length);
      expect(new Set(areaVals).size).toBe(areaVals.length);
    }
  });
});
