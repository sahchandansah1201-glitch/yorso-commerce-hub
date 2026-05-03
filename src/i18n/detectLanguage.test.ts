import { describe, it, expect } from "vitest";
import { detectLanguage, resolveHintLanguage } from "./detectLanguage";

describe("detectLanguage", () => {
  it("распознаёт чистый русский", () => {
    expect(detectLanguage("Цены на лосось")).toBe("ru");
  });

  it("распознаёт чистый испанский по диакритике", () => {
    expect(detectLanguage("¿Cuál es el precio?")).toBe("es");
    expect(detectLanguage("salmón fresco")).toBe("es");
  });

  it("распознаёт чистый английский", () => {
    expect(detectLanguage("Salmon prices today")).toBe("en");
  });

  it("смешанный ru+латиница → RU (кириллица доминирует семантически)", () => {
    expect(detectLanguage("RFQ по треске MSC")).toBe("ru");
    expect(detectLanguage("YORSO каталог")).toBe("ru");
  });

  it("пустой/числовой/пунктуационный ввод → preferred (RU по умолчанию)", () => {
    expect(detectLanguage("")).toBe("ru");
    expect(detectLanguage("   ")).toBe("ru");
    expect(detectLanguage("123 — 456")).toBe("ru");
    expect(detectLanguage(null)).toBe("ru");
    expect(detectLanguage(undefined)).toBe("ru");
  });

  it("короткий латинский акроним при preferred=ru остаётся RU", () => {
    expect(detectLanguage("RFQ", "ru")).toBe("ru");
    expect(detectLanguage("MOQ", "ru")).toBe("ru");
    expect(detectLanguage("EU", "ru")).toBe("ru");
  });

  it("короткий латинский акроним при preferred=en остаётся EN", () => {
    expect(detectLanguage("RFQ", "en")).toBe("en");
  });

  it("уважает явный preferred=es для пустого ввода", () => {
    expect(detectLanguage("", "es")).toBe("es");
  });
});

describe("resolveHintLanguage", () => {
  it("явный saved-выбор пользователя побеждает текст", () => {
    expect(resolveHintLanguage({ saved: "ru", text: "Salmon prices" })).toBe("ru");
    expect(resolveHintLanguage({ saved: "es", text: "лосось" })).toBe("es");
  });

  it("без saved использует детектор по тексту", () => {
    expect(resolveHintLanguage({ text: "Цены на треску" })).toBe("ru");
    expect(resolveHintLanguage({ text: "Cod prices" })).toBe("en");
    expect(resolveHintLanguage({ text: "salmón" })).toBe("es");
  });

  it("без saved и без сигналов использует preferred-фолбэк (RU)", () => {
    expect(resolveHintLanguage({})).toBe("ru");
    expect(resolveHintLanguage({ text: "" })).toBe("ru");
    expect(resolveHintLanguage({ text: "123" })).toBe("ru");
  });

  it("preferred=es применяется только при отсутствии сигналов", () => {
    expect(resolveHintLanguage({ text: "", preferred: "es" })).toBe("es");
    expect(resolveHintLanguage({ text: "Цены", preferred: "es" })).toBe("ru");
  });
});
