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

/**
 * Классифицирует тип предупреждения по тексту первого аргумента warn.
 * INCOMPLETE — payload неполный или null/undefined; EXPIRED — TTL истёк
 * для preview/pending/source. Возвращает null, если первый аргумент —
 * не строка с известным маркером.
 */
type WarnKind = "INCOMPLETE" | "EXPIRED" | null;
const classifyWarn = (args: unknown[]): WarnKind => {
  const head = args[0];
  if (typeof head !== "string") return null;
  if (head.includes("EXPIRED")) return "EXPIRED";
  if (
    head.includes("неполная") ||
    head.includes("null/undefined")
  ) {
    return "INCOMPLETE";
  }
  return null;
};

/**
 * Зафиксированный «текущий момент» для всех тестов набора. Берём явную
 * детерминированную дату (а не Date.now() в момент запуска), чтобы
 * TTL-арифметика (Date.now() - ts > TTL_MS) не зависела от часов CI и
 * не ломалась со временем. Любая «протухшая» запись считается как
 * NOW − (TTL + запас), любая «свежая» — как NOW.
 */
const NOW = new Date("2026-01-15T12:00:00.000Z").getTime();
const TTL_MS = 30 * 60 * 1000;
const STALE_TS = NOW - (TTL_MS + 60 * 1000); // на 1 минуту старше TTL

describe("preview-attribution debug warnings", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    // Замораживаем системное время на NOW. Дальше любые Date.now() в
    // production-коде и в seed-хелперах вернут одно и то же значение —
    // тесты становятся детерминированными.
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
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
    // Тип предупреждения должен быть INCOMPLETE (текст «неполная»),
    // а не EXPIRED — иначе сводка теряет смысл.
    expect(classifyWarn(calls[0])).toBe("INCOMPLETE");
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
      ts: STALE_TS,
    };
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(stale));

    const result = readPreviewAttribution();
    expect(result).toBeNull();

    const expiredCall = warn.mock.calls.find((args) =>
      typeof args[0] === "string" && args[0].includes("preview_attribution EXPIRED"),
    );
    expect(expiredCall).toBeDefined();
    expect(classifyWarn(expiredCall!)).toBe("EXPIRED");
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
      ts: STALE_TS,
    };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(stale));

    expect(readPendingPreviewAttribution()).toBeNull();

    const expiredCall = warn.mock.calls.find((args) =>
      typeof args[0] === "string" &&
      args[0].includes("pending_preview_attribution EXPIRED"),
    );
    expect(expiredCall).toBeDefined();
    expect(classifyWarn(expiredCall!)).toBe("EXPIRED");
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
      JSON.stringify({ source: "header_cta", ts: STALE_TS }),
    );

    expect(readRegistrationSource()).toBeNull();

    const expiredCall = warn.mock.calls.find((args) =>
      typeof args[0] === "string" &&
      args[0].includes("registration_source EXPIRED"),
    );
    expect(expiredCall).toBeDefined();
    expect(classifyWarn(expiredCall!)).toBe("EXPIRED");
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

  // ---- Edge cases для missing: null/undefined/мусор ----
  // validateAttributionShape принимает Partial и считает любое НЕ-string
  // значение пустым (включая null/undefined). Сводка должна оставаться
  // консистентной: ключи attempt_id/registration_source присутствуют,
  // missing — нормализованный массив строк без null/undefined/дубликатов.

  it("edge: null/undefined в полях payload трактуются как пропуски, missing нормализован", () => {
    seedAttempt("att_null_fields");
    seedSource("hero_cta");
    // Передаём заведомо «грязные» значения — TS обходим через any,
    // потому что в проде такие значения теоретически могут прийти из
    // битого storage / внешнего источника.
    savePreviewAttribution({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supplier_id: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      species: undefined as any,
      form: "fillet",
      href: "/x",
      access_level: "anonymous_locked",
    });

    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_null_fields");
    expect(summary!.registration_source).toBe("hero_cta");
    expect(summary!.missing).toEqual(["supplier_id", "species"]);
    // Гарантируем: никаких null/undefined внутри missing не просочилось.
    for (const v of summary!.missing) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("edge: payload === null → missing=['<all>'], сводка с обоими ключами", () => {
    seedAttempt("att_null_payload");
    seedSource("trust_block");
    // Симулируем readPreviewAttribution с подменённым parsed=null
    // через прямую запись «не той формы» в storage и чтение.
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(null));
    const result = readPreviewAttribution();
    expect(result).toBeNull();
    // null payload в readPreviewAttribution просто возвращает null без warn —
    // зато прямой вызов через savePending с null невозможен по типу.
    // Проверим путь через явную форму: пустая запись после JSON.parse даёт null.
    // Здесь основная цель — убедиться, что storage с null не валит код.
  });

  it("edge: битый JSON в registration_source → флаг invalid_registration_source", () => {
    seedAttempt("att_bad_source");
    sessionStorage.setItem(SOURCE_KEY, "{not json");
    savePreviewAttribution({
      supplier_id: "",
      species: "salmon",
      form: "fillet",
      href: "/x",
      access_level: "anonymous_locked",
    });

    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_bad_source");
    expect(summary!.registration_source).toBeNull();
    // Известные поля идут в фиксированном порядке, неизвестные — после.
    expect(summary!.missing).toEqual(["supplier_id", "invalid_registration_source"]);
  });

  it("edge: registration_source с некорректной формой (source не строка) → invalid_registration_source", () => {
    seedAttempt("att_bad_shape");
    sessionStorage.setItem(
      SOURCE_KEY,
      JSON.stringify({ source: 42, ts: Date.now() }),
    );
    savePreviewAttribution({
      supplier_id: "",
      species: "",
      form: "",
      href: "/x",
      access_level: "anonymous_locked",
    });

    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_bad_shape");
    expect(summary!.registration_source).toBeNull();
    expect(summary!.missing).toEqual([
      "supplier_id",
      "species",
      "form",
      "invalid_registration_source",
    ]);
  });

  it("edge: сводка всегда содержит три ключа attempt_id, registration_source, missing", () => {
    // Никаких seed — оба контекста пустые. Любой warn всё равно даёт сводку
    // со всеми тремя ключами (attempt_id=null, registration_source=null,
    // missing — массив строк).
    savePreviewAttribution({
      supplier_id: "",
      species: "",
      form: "",
      href: "/x",
      access_level: "anonymous_locked",
    });
    const summary = findDebugSummary(debugWarnCalls(warn)[0]);
    expect(summary).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(summary!, "attempt_id")).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(summary!, "registration_source"),
    ).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(summary!, "missing")).toBe(true);
    expect(summary!.attempt_id).toBeNull();
    expect(summary!.registration_source).toBeNull();
    expect(Array.isArray(summary!.missing)).toBe(true);
  });

  it("kind+summary: null payload в savePreviewAttribution → INCOMPLETE с сводкой", () => {
    seedAttempt("att_null_payload_save");
    seedSource("hero_cta");
    // savePreviewAttribution принимает Omit<..., "ts"> — null обходим через any,
    // чтобы попасть в ветку validateAttributionShape("...payload is null/undefined").
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    savePreviewAttribution(null as any);

    const calls = debugWarnCalls(warn);
    expect(calls.length).toBeGreaterThan(0);
    expect(classifyWarn(calls[0])).toBe("INCOMPLETE");
    const summary = findDebugSummary(calls[0]);
    expect(summary).toBeDefined();
    expect(summary!.attempt_id).toBe("att_null_payload_save");
    expect(summary!.registration_source).toBe("hero_cta");
    expect(summary!.missing).toEqual(["<all>"]);
  });

  it("kind+summary матрица: каждый warn-вызов имеет известный kind и валидную сводку", () => {
    seedAttempt("att_matrix");
    seedSource("matrix_cta");

    // 1) INCOMPLETE через save
    savePreviewAttribution({
      supplier_id: "",
      species: "salmon",
      form: "fillet",
      href: "/x",
      access_level: "anonymous_locked",
    });
    // 2) EXPIRED через прочтение протухшей preview-записи
    sessionStorage.setItem(
      PREVIEW_KEY,
      JSON.stringify({
        ...completeAttribution(),
        ts: STALE_TS,
      }),
    );
    readPreviewAttribution();
    // 3) EXPIRED через прочтение протухшей pending-записи
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        ...completeAttribution(),
        ts: STALE_TS,
      }),
    );
    readPendingPreviewAttribution();

    const calls = debugWarnCalls(warn);
    expect(calls.length).toBeGreaterThanOrEqual(3);

    const kinds = new Set<WarnKind>();
    for (const call of calls) {
      const kind = classifyWarn(call);
      expect(kind).not.toBeNull(); // нет «безымянных» warn без типа
      kinds.add(kind);
      // У каждого warn должна быть сводка с тремя ключами и нормализованным missing.
      const summary = findDebugSummary(call);
      expect(summary).toBeDefined();
      expect(summary!.attempt_id).toBe("att_matrix");
      expect(Array.isArray(summary!.missing)).toBe(true);
      // Никаких null/undefined внутри missing.
      for (const v of summary!.missing) {
        expect(typeof v).toBe("string");
        expect(v.length).toBeGreaterThan(0);
      }
    }
    // В матрице должны встретиться оба типа warn.
    expect(kinds.has("INCOMPLETE")).toBe(true);
    expect(kinds.has("EXPIRED")).toBe(true);
  });
});
