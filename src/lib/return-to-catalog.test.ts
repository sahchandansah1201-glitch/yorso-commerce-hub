/**
 * Юнит-тесты return-to-catalog state.
 *
 * Проверяем:
 *  - build снимает текущий window.location и scrollY
 *  - read валидирует маркер и типы полей
 *  - read возвращает undefined для чужого/отсутствующего state
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildCatalogReturnState,
  readCatalogReturnState,
} from "@/lib/return-to-catalog";

describe("lib/return-to-catalog", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 1234, configurable: true });
    // jsdom location is read-only; we mock pathname+search via a getter.
    Object.defineProperty(window, "location", {
      value: { pathname: "/offers", search: "?category=Whitefish" },
      configurable: true,
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildCatalogReturnState snapshots pathname+search and scrollY", () => {
    const s = buildCatalogReturnState("offer-1");
    expect(s.__catalogReturn).toBe(true);
    expect(s.offerId).toBe("offer-1");
    expect(s.scrollY).toBe(1234);
    expect(s.pathname).toBe("/offers?category=Whitefish");
  });

  it("readCatalogReturnState returns parsed state when marker matches", () => {
    const s = buildCatalogReturnState("offer-2");
    const out = readCatalogReturnState({ state: s });
    expect(out).toEqual(s);
  });

  it("readCatalogReturnState returns undefined for missing/foreign state", () => {
    expect(readCatalogReturnState({ state: null })).toBeUndefined();
    expect(readCatalogReturnState({ state: undefined })).toBeUndefined();
    expect(readCatalogReturnState({ state: { foo: "bar" } })).toBeUndefined();
    expect(
      readCatalogReturnState({ state: { __catalogReturn: false, pathname: "/x" } }),
    ).toBeUndefined();
  });

  it("readCatalogReturnState defaults bad numeric/string fields safely", () => {
    const out = readCatalogReturnState({
      state: { __catalogReturn: true, pathname: "/offers", offerId: 42, scrollY: "x" },
    });
    expect(out).toEqual({
      __catalogReturn: true,
      pathname: "/offers",
      offerId: "",
      scrollY: 0,
    });
  });
});
