/**
 * Dev-регрессионные тесты: каждое предупреждение в preview-attribution.ts
 * (incomplete payload, expired preview, expired pending, expired source,
 * null payload) должно содержать debug-сводку с attempt_id,
 * registration_source и нормализованным missing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readPendingPreviewAttribution,
  readPreviewAttribution,
  readRegistrationSource,
  savePendingPreviewAttribution,
  savePreviewAttribution,
  saveRegistrationSource,
  type PreviewAttribution,
} from "./preview-attribution";

const ATTEMPT_KEY = "yorso_registration_attempt_id";
const PREVIEW_KEY = "yorso_preview_attribution";
const PENDING_KEY = "yorso_preview_attribution_pending";
const SOURCE_KEY = "yorso_registration_source";

const seedAttempt = (id = "att_test_123") => {
  sessionStorage.setItem(ATTEMPT_KEY, id);
};
const seedSource = (source = "hero_cta") => {
  sessionStorage.setItem(
    SOURCE_KEY,
    JSON.stringify({ source, ts: Date.now() }),
  );
};

const completeAttribution = (): Omit<PreviewAttribution, "ts"> => ({
  supplier_id: "sup_1",
  species: "salmon",
  form: "fillet",
  href: "/suppliers/sup_1",
  access_level: "anonymous_locked",
});

/**
 * Возвращает все warn-вызовы, в чьих аргументах хотя бы один объект
 * содержит ключ `missing` — то есть только те, что прошли через
 * buildAttributionDebugSummary.
 */
const debugWarnCalls = (warn: ReturnType<typeof vi.spyOn>) =>
  warn.mock.calls.filter((args) =>
    args.some(
      (a) =>
        a !== null &&
        typeof a === "object" &&
        Object.prototype.hasOwnProperty.call(a, "missing"),
    ),
  );

const findDebugSummary = (args: unknown[]) =>
  args.find(
    (a): a is {
      attempt_id: string | null;
      registration_source: string | null;
      missing: string[];
    } =>
      a !== null &&
      typeof a === "object" &&
      Object.prototype.hasOwnProperty.call(a, "missing") &&
      Object.prototype.hasOwnProperty.call(a, "attempt_id") &&
      Object.prototype.hasOwnProperty.call(a, "registration_source"),
  );

describe("preview-attribution debug warnings", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("incomplete payload: warn содержит attempt_id, registration_source и missing", () => {
    seedAttempt("att_incomplete");
    seedSource("hero_cta");

    savePreviewAttribution({
      supplier_id: "",
      species: "",
      form: "fillet",
      href: "/suppliers/x",
      access_level: "anonymous_locked",
    });

    const calls = debugWarnCalls(warn);
    expect(calls.length).toBeGreaterThan(0);
    const summary = findDebugSummary(calls[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_incomplete");
    expect(summary!.registration_source).toBe("hero_cta");
    // Нормализованный, отсортированный, без дубликатов.
    expect(summary!.missing).toEqual(["supplier_id", "species"]);
  });

  it("complete payload: warn НЕ должен содержать debug-сводку", () => {
    seedAttempt();
    seedSource();
    savePreviewAttribution(completeAttribution());
    expect(debugWarnCalls(warn).length).toBe(0);
  });

  it("attempt_id и registration_source могут быть null, ключи всё равно есть", () => {
    // Никаких seed — оба источника пустые.
    savePreviewAttribution({
      supplier_id: "",
      species: "salmon",
      form: "fillet",
      href: "/x",
      access_level: "anonymous_locked",
    });
    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBeNull();
    expect(summary!.registration_source).toBeNull();
    expect(summary!.missing).toEqual(["supplier_id"]);
  });

  it("expired preview_attribution: warn содержит сводку с missing=['<all>']", () => {
    seedAttempt("att_expired");
    seedSource("trust_block");
    // Запись старше TTL (30 минут).
    const stale: PreviewAttribution = {
      ...completeAttribution(),
      ts: Date.now() - 31 * 60 * 1000,
    };
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(stale));

    const result = readPreviewAttribution();
    expect(result).toBeNull();

    const expiredCall = warn.mock.calls.find((args) =>
      typeof args[0] === "string" && args[0].includes("preview_attribution EXPIRED"),
    );
    expect(expiredCall).toBeDefined();
    const summary = findDebugSummary(expiredCall!);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_expired");
    expect(summary!.registration_source).toBe("trust_block");
    expect(summary!.missing).toEqual(["<all>"]);
  });

  it("expired pending_preview_attribution: warn содержит сводку", () => {
    seedAttempt("att_pending_expired");
    const stale: PreviewAttribution = {
      ...completeAttribution(),
      ts: Date.now() - 31 * 60 * 1000,
    };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(stale));

    expect(readPendingPreviewAttribution()).toBeNull();

    const expiredCall = warn.mock.calls.find((args) =>
      typeof args[0] === "string" &&
      args[0].includes("pending_preview_attribution EXPIRED"),
    );
    expect(expiredCall).toBeDefined();
    const summary = findDebugSummary(expiredCall!);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_pending_expired");
    expect(summary!.registration_source).toBeNull();
    expect(summary!.missing).toEqual(["<all>"]);
  });

  it("expired registration_source: warn содержит сводку", () => {
    seedAttempt("att_src_expired");
    sessionStorage.setItem(
      SOURCE_KEY,
      JSON.stringify({ source: "header_cta", ts: Date.now() - 31 * 60 * 1000 }),
    );

    expect(readRegistrationSource()).toBeNull();

    const expiredCall = warn.mock.calls.find((args) =>
      typeof args[0] === "string" &&
      args[0].includes("registration_source EXPIRED"),
    );
    expect(expiredCall).toBeDefined();
    const summary = findDebugSummary(expiredCall!);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_src_expired");
    // На момент warn registration_source ещё в storage (clear идёт после warn).
    // Главное — ключ присутствует и missing нормализован.
    expect(Array.isArray(summary!.missing)).toBe(true);
    expect(summary!.missing).toEqual(["<all>"]);
  });

  it("savePendingPreviewAttribution с пустым form: warn содержит сводку с missing=['form']", () => {
    seedAttempt("att_pending_incomplete");
    seedSource("final_cta");
    const attr: PreviewAttribution = {
      ...completeAttribution(),
      form: "",
      ts: Date.now(),
    };
    savePendingPreviewAttribution(attr);

    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_pending_incomplete");
    expect(summary!.registration_source).toBe("final_cta");
    expect(summary!.missing).toEqual(["form"]);
  });

  it("missing всегда нормализован: фиксированный порядок supplier_id → species → form", () => {
    seedAttempt();
    seedSource();
    // Все три поля пустые — порядок в выводе должен быть стабильным.
    savePreviewAttribution({
      supplier_id: "",
      species: "",
      form: "",
      href: "/x",
      access_level: "anonymous_locked",
    });
    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(summary!.missing).toEqual(["supplier_id", "species", "form"]);
  });

  // saveRegistrationSource не валидирует attribution-поля — sanity-check,
  // что он не прицепляет debug-сводку (это не его ответственность).
  it("saveRegistrationSource не генерирует attribution-warn", () => {
    saveRegistrationSource("hero_cta");
    expect(debugWarnCalls(warn).length).toBe(0);
  });
});
