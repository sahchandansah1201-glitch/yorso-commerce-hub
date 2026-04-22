/**
 * Проверяет, что при автоопределении ru через navigator.language
 * поиск по странам в CountryPhoneInput отображает русский placeholder
 * и русское сообщение «ничего не найдено», без английских аналогов.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import CountryPhoneInput from "@/components/registration/CountryPhoneInput";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", {
    value: primary,
    configurable: true,
  });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

const renderInput = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <CountryPhoneInput
          phone=""
          onPhoneChange={() => {}}
          onCountryChange={() => {}}
          countryName=""
          disabled={false}
        />
      </LanguageProvider>
    </MemoryRouter>,
  );

const getPlaceholders = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>("input[placeholder]")).map(
    (i) => i.getAttribute("placeholder") ?? "",
  );

describe("Country search shows Russian hints under auto-detected ru locale", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("ru-RU", ["ru-RU", "ru", "en"]);
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("Placeholder поиска по странам — русский 'Страна или код'", () => {
    const { container } = renderInput();
    const trigger = container.querySelector("button");
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger!);

    const placeholders = getPlaceholders();
    expect(placeholders).toContain(translations.ru.country_searchPlaceholder);
    expect(placeholders).not.toContain(translations.en.country_searchPlaceholder);
    expect(placeholders).not.toContain(translations.es.country_searchPlaceholder);
  });

  it("Empty-state при заведомо несуществующем запросе — на русском 'Ничего не найдено'", () => {
    const { container } = renderInput();
    const trigger = container.querySelector("button");
    fireEvent.click(trigger!);

    // Находим именно поле поиска (по русскому плейсхолдеру).
    const searchInput = Array.from(
      container.querySelectorAll<HTMLInputElement>("input[placeholder]"),
    ).find(
      (i) => i.getAttribute("placeholder") === translations.ru.country_searchPlaceholder,
    );
    expect(searchInput).toBeDefined();

    fireEvent.change(searchInput!, { target: { value: "zzzzzznotacountry" } });

    const text = document.body.textContent ?? "";
    expect(text).toContain(translations.ru.country_noResults);
    expect(text).not.toContain(translations.en.country_noResults);
    expect(text).not.toContain(translations.es.country_noResults);
  });

  it("При сохранённой en-локали в localStorage — английские подсказки (контрольный кейс)", () => {
    localStorage.setItem("yorso-lang", "en");
    const { container } = renderInput();
    const trigger = container.querySelector("button");
    fireEvent.click(trigger!);

    const placeholders = getPlaceholders();
    expect(placeholders).toContain(translations.en.country_searchPlaceholder);
    expect(placeholders).not.toContain(translations.ru.country_searchPlaceholder);
  });
});
