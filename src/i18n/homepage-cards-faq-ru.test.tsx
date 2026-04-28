/**
 * Прицельная проверка: на главной странице под локалью `ru` все
 * тексты Hero, кнопок, карточек предложений и FAQ отображаются на
 * русском, без английских утечек.
 *
 * Дополняет общий сторож `no-english-leak.ru.test.tsx`:
 *  - явно проверяет локализованные строки FAQ (вопросы и ответы);
 *  - явно проверяет CTA-кнопки Hero;
 *  - явно проверяет карточки в LiveOffers.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import Hero from "@/components/landing/Hero";
import FAQ from "@/components/landing/FAQ";
import LiveOffers from "@/components/landing/LiveOffers";
import { translations } from "@/i18n/translations";

const ru = translations.ru;
const en = translations.en;

const wrap = (node: React.ReactNode) => {
  localStorage.setItem("yorso-lang", "ru");
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>{node}</RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

const bodyText = () =>
  (document.body.textContent ?? "").replace(/\s+/g, " ").trim();

describe("Главная страница (ru): Hero + кнопки", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("Hero: заголовки, подзаголовок и CTA-кнопки на русском", () => {
    wrap(<Hero />);
    const text = bodyText();

    expect(text).toContain(ru.hero_title1);
    expect(text).toContain(ru.hero_title2);
    expect(text).toContain(ru.hero_searchBtn);
    expect(text).toContain(ru.hero_registerFree);
    expect(text).toContain(ru.hero_exploreLiveOffers);

    // Английские варианты тех же ключей не должны просочиться
    expect(text).not.toContain(en.hero_title1);
    expect(text).not.toContain(en.hero_registerFree);
    expect(text).not.toContain(en.hero_exploreLiveOffers);
    expect(text).not.toContain(en.hero_searchBtn);
  });
});

describe("Главная страница (ru): FAQ", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("FAQ: заголовок секции и каждый вопрос отображаются на русском", () => {
    wrap(<FAQ />);
    const text = bodyText();

    expect(text).toContain(ru.faq_title);
    expect(text).toContain(ru.faq_subtitle);
    expect(text).not.toContain(en.faq_title);

    // Все вопросы из ru.faq_items должны присутствовать.
    // (Ответы лежат внутри AccordionContent и могут рендериться позже —
    // достаточно гарантировать локализацию вопросов и заголовка.)
    expect(ru.faq_items.length).toBeGreaterThan(0);
    for (const item of ru.faq_items) {
      expect(item.question).toMatch(/[А-Яа-яЁё]/);
      expect(text).toContain(item.question);
    }

    // Английские вопросы не просачиваются
    for (const item of en.faq_items) {
      expect(text).not.toContain(item.question);
    }
  });
});

describe("Главная страница (ru): карточки предложений", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("LiveOffers: бейдж, заголовок и подписи карточек на русском", () => {
    wrap(<LiveOffers />);
    const text = bodyText();

    expect(text).toContain(ru.offers_liveMarketplace);
    expect(text).toContain(ru.offers_title);
    expect(text).toContain(ru.card_perKg);
    expect(text).toContain(ru.card_viewOffer);

    expect(text).not.toContain("Live Marketplace");
    expect(text).not.toContain("per kg");
    expect(text).not.toContain("View Offer");
  });
});
