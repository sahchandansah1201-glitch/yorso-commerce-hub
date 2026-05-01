import { describe, it, expect, vi, afterEach } from "vitest";
const Original = Intl.NumberFormat;
describe("dbg", () => {
  afterEach(() => { (Intl as any).NumberFormat = Original; });
  it("native via meter mapping", async () => {
    vi.resetModules();
    const Patched = function (this: unknown, locales?: any, options?: any) {
      if (options && options.style === "unit" && options.unit === "metric-ton") {
        console.log("PATCH HIT", JSON.stringify(options));
        return new Original(locales, { ...options, unit: "meter" });
      }
      return new Original(locales, options);
    } as any;
    Object.setPrototypeOf(Patched, Original);
    (Patched as any).prototype = Original.prototype;
    (Intl as any).NumberFormat = Patched;
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("en", 20.7);
    console.log("OUT:", JSON.stringify(out));
    expect(out).toBeTruthy();
  });
});
