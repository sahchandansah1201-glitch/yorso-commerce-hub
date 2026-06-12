import { describe, expect, it } from "vitest";
import {
  COUNTRY_CATALOG,
  findCountryByName,
  localizedCountryName,
  searchCountries,
} from "@/lib/account-country-catalog";

describe("account-country-catalog", () => {
  it("every entry has alpha2, alpha3, phone and EN/RU/ES names", () => {
    for (const c of COUNTRY_CATALOG) {
      expect(c.alpha2).toMatch(/^[A-Z]{2}$/);
      expect(c.alpha3).toMatch(/^[A-Z]{3}$/);
      expect(c.phone).toMatch(/^\+\d+$/);
      expect(c.en).toBeTruthy();
      expect(c.ru).toBeTruthy();
      expect(c.es).toBeTruthy();
      expect(c.id).toBe(c.alpha2.toLowerCase());
    }
  });

  it("ids are unique", () => {
    const ids = new Set(COUNTRY_CATALOG.map((c) => c.id));
    expect(ids.size).toBe(COUNTRY_CATALOG.length);
  });

  it("findCountryByName matches localized name in any of EN/RU/ES", () => {
    expect(findCountryByName("Spain", "en")?.alpha2).toBe("ES");
    expect(findCountryByName("España", "es")?.alpha2).toBe("ES");
    expect(findCountryByName("Литва", "ru")?.alpha2).toBe("LT");
    expect(findCountryByName("NL", "en")?.alpha3).toBe("NLD");
    expect(findCountryByName("nld", "en")?.alpha2).toBe("NL");
  });

  it("searchCountries ranks exact ISO and prefix matches above substring matches", () => {
    const byIso = searchCountries("NL", "en", 5);
    expect(byIso[0].alpha2).toBe("NL");

    const byPrefix = searchCountries("Spa", "en", 5);
    expect(byPrefix[0].alpha2).toBe("ES");

    const byPhone = searchCountries("+34", "en", 5);
    expect(byPhone[0].alpha2).toBe("ES");

    const byRu = searchCountries("Лит", "ru", 5);
    expect(byRu[0].alpha2).toBe("LT");
  });

  it("returns empty list for unknown query", () => {
    expect(searchCountries("zzzznotacountry", "en", 5)).toHaveLength(0);
  });

  it("localizedCountryName falls back to English when locale value missing", () => {
    const c = { ...COUNTRY_CATALOG[0], ru: "" as string };
    expect(localizedCountryName(c, "ru")).toBe(c.en);
  });
});
