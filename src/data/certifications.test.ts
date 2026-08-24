import { describe, expect, it } from "vitest";
import {
  canonicalizeCertificationList,
  getCertificationDisplayCode,
  getCertificationInfo,
  sortCertificationCodes,
} from "./certifications";

describe("certifications display contract", () => {
  it("localizes user-facing EU and religious certification names", () => {
    expect(getCertificationInfo("EU", "en").name).toBe("EU approval");
    expect(getCertificationInfo("EU", "ru").name).toBe("Допуск ЕС");
    expect(getCertificationInfo("EU", "es").name).toBe("Autorización UE");
    expect(getCertificationInfo("HALAL", "ru").name).toBe("Халяль");
    expect(getCertificationInfo("KOSHER", "ru").name).toBe("Кошер");
  });

  it("suppresses duplicate abbreviation fallbacks", () => {
    expect(getCertificationDisplayCode(getCertificationInfo("IFS", "en"))).toBeNull();
    expect(getCertificationDisplayCode(getCertificationInfo("FDA", "en"))).toBeNull();
    expect(getCertificationDisplayCode(getCertificationInfo("HACCP", "en"))).toBeNull();
    expect(getCertificationDisplayCode(getCertificationInfo("FOS", "en"))).toBeNull();
    expect(getCertificationDisplayCode(getCertificationInfo("EU", "ru"))).toBe("EU");
  });

  it("uses catalog order without mutating legacy storage values", () => {
    expect(sortCertificationCodes(["BAP", "EU Approval Number", "ASC", "IFS Food", "MSC"])).toEqual([
      "MSC",
      "ASC",
      "IFS",
      "EU",
      "BAP",
    ]);
    expect(canonicalizeCertificationList(["BAP", "EU Approval Number"])).toEqual(["BAP", "EU"]);
  });
});
