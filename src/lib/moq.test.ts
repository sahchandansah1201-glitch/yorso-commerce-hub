/**
 * Тесты нормализации MOQ.
 *
 * Проверяем:
 *  - снятие префикса "MOQ:"
 *  - одиночное значение и локализация числа (en/ru)
 *  - диапазон через en-dash и ASCII-дефис
 *  - "20,000+ kg" (open-ended)
 *  - числовой вход + fallbackUnit
 *  - пустой/невалидный вход → "—"
 *  - разные разделители тысяч (',', NBSP, обычный пробел)
 */
import { describe, it, expect } from "vitest";
import { normalizeMoq } from "@/lib/moq";

const norm = (s: string) => s.replace(/\u00a0|\u202f/g, " ");

describe("lib/moq — normalizeMoq", () => {
  it("strips MOQ: prefix and formats single value (en)", () => {
    const r = normalizeMoq("MOQ: 1,000 kg", "en");
    expect(norm(r.display)).toBe("1,000 kg");
    expect(r.min).toBe(1000);
    expect(r.unit).toBe("kg");
  });

  it("formats single value in ru with space thousands separator", () => {
    const r = normalizeMoq("1,000 kg", "ru");
    expect(norm(r.display)).toBe("1 000 kg");
  });

  it("parses en-dash range and re-formats both bounds", () => {
    const r = normalizeMoq("1,000 – 4,999 kg", "en");
    expect(norm(r.display)).toBe("1,000 – 4,999 kg");
    expect(r.min).toBe(1000);
    expect(r.max).toBe(4999);
  });

  it("parses ASCII-dash range", () => {
    const r = normalizeMoq("1000 - 4999 kg", "en");
    expect(r.min).toBe(1000);
    expect(r.max).toBe(4999);
    expect(norm(r.display)).toBe("1,000 – 4,999 kg");
  });

  it("parses NBSP-separated thousands", () => {
    const r = normalizeMoq("1\u00a0000 kg", "en");
    expect(r.min).toBe(1000);
    expect(norm(r.display)).toBe("1,000 kg");
  });

  it("handles open-ended 20,000+ kg", () => {
    const r = normalizeMoq("20,000+ kg", "ru");
    expect(r.openEnded).toBe(true);
    expect(r.min).toBe(20000);
    expect(norm(r.display)).toBe("20 000+ kg");
  });

  it("accepts numeric input with fallback unit", () => {
    const r = normalizeMoq(2500, "en");
    expect(norm(r.display)).toBe("2,500 kg");
    expect(r.min).toBe(2500);
  });

  it("returns em-dash placeholder for empty/null input", () => {
    expect(normalizeMoq("", "en").display).toBe("—");
    expect(normalizeMoq(null, "en").display).toBe("—");
    expect(normalizeMoq(undefined, "en").display).toBe("—");
  });

  it("falls back to raw stripped string when unparseable", () => {
    const r = normalizeMoq("MOQ: ask supplier", "en");
    expect(r.display).toBe("ask supplier");
  });
});

import { summarizeMoqRange } from "@/lib/moq";

describe("lib/moq — summarizeMoqRange", () => {
  it("collapses single tier to one value", () => {
    expect(summarizeMoqRange(["1,000 kg"], "en")).toBe("1,000 kg");
  });

  it("returns lowest min – highest max across tiers", () => {
    const out = summarizeMoqRange(
      ["1,000 – 4,999 kg", "5,000 – 19,999 kg"],
      "en",
    );
    expect(out?.replace(/\u00a0|\u202f/g, " ")).toBe("1,000 – 19,999 kg");
  });

  it("preserves open-ended marker on the upper bound", () => {
    const out = summarizeMoqRange(
      ["1,000 – 4,999 kg", "5,000 – 19,999 kg", "20,000+ kg"],
      "en",
    );
    expect(out?.replace(/\u00a0|\u202f/g, " ")).toBe("1,000 – 20,000+ kg");
  });

  it("returns undefined when no tier is parseable", () => {
    expect(summarizeMoqRange(["ask supplier", null, ""], "en")).toBeUndefined();
  });

  it("localizes thousands separators (ru)", () => {
    const out = summarizeMoqRange(["1,000 – 4,999 kg", "20,000+ kg"], "ru");
    expect(out?.replace(/\u00a0|\u202f/g, " ")).toBe("1 000 – 20 000+ kg");
  });
});
