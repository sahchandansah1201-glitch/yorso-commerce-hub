import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import TrustSection from "@/components/offer-detail/TrustSection";
import FullSpecifications from "@/components/offer-detail/FullSpecifications";
import SimilarOffers from "@/components/offer-detail/SimilarOffers";
import SimilarProducts from "@/components/offer-detail/SimilarProducts";
import RelatedArticles from "@/components/offer-detail/RelatedArticles";
import DecisionFAQ from "@/components/offer-detail/DecisionFAQ";
import type { Language } from "@/i18n/translations";

const lockedOffer = (): SeafoodOffer => ({
  ...mockOffers[0],
  accessLevel: "anonymous_locked",
});

const renderDecisionSupport = (lang: Language = "ru") => {
  localStorage.setItem("yorso-lang", lang);
  const offer = lockedOffer();

  return render(
    <MemoryRouter>
      <LanguageProvider>
        <TrustSection offer={offer} accessLevel="anonymous_locked" />
        <FullSpecifications offer={offer} />
        <SimilarOffers current={offer} accessLevel="anonymous_locked" />
        <SimilarProducts current={offer} accessLevel="anonymous_locked" />
        <RelatedArticles articles={offer.relatedArticles} />
        <DecisionFAQ />
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("offer detail decision support locale/a11y", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders Russian buyer decision support labels without locked-price leakage", () => {
    renderDecisionSupport("ru");

    expect(screen.getByTestId("offer-trust-section")).toHaveTextContent("Почему это предложение безопаснее проверять");
    expect(screen.getByTestId("offer-trust-section")).toHaveTextContent("Экспорт и соответствие");
    expect(screen.getByTestId("offer-trust-section")).toHaveTextContent("Контакт поставщика открывается после одобрения покупателя");

    const specs = screen.getByTestId("offer-full-specifications");
    fireEvent.click(within(specs).getByRole("button", { name: /Полная спецификация/ }));
    expect(specs).toHaveTextContent("Метод добычи");
    expect(specs).toHaveTextContent("Температура хранения");

    expect(screen.getByTestId("offer-similar-offers")).toHaveTextContent("Сравнить альтернативы");
    expect(screen.getByTestId("offer-similar-products")).toHaveTextContent("Похожие продукты");
    expect(screen.getAllByText("Цена доступна после регистрации").length).toBeGreaterThan(1);
    expect(document.body.textContent ?? "").not.toMatch(/\$5\.80|\$8\.50|\$9\.20|\$11\.00|Ниже цена/u);

    const insights = screen.getByTestId("offer-related-insights");
    expect(insights).toHaveTextContent("Связанная рыночная аналитика");
    expect(insights).toHaveTextContent("Гид покупателя");
    expect(insights).toHaveTextContent("Тот же вид");
    expect(within(insights).getAllByRole("link", { name: /Открыть рыночный материал/ }).length).toBeGreaterThan(0);

    const faq = screen.getByTestId("offer-decision-faq");
    expect(faq).toHaveTextContent("Вопросы перед запросом доступа");
    const question = within(faq).getByRole("button", { name: "Как связаться с этим поставщиком?" });
    expect(question).toHaveAttribute("aria-expanded", "false");
    expect(question).toHaveAttribute("aria-controls", "offer-decision-faq-answer-0");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(within(faq).getByText(/После одобрения вы сможете связаться с поставщиком напрямую/)).toBeVisible();

    for (const leaked of [
      "Why this offer is safe",
      "Full specifications",
      "Catching method",
      "Compare alternatives",
      "Explore similar products",
      "Related market insights",
      "Buying guide",
      "Same species",
      "Frequently asked questions",
      "Lower price",
    ]) {
      expect(screen.queryByText(leaked, { exact: false })).toBeNull();
    }
  });

  it("renders Spanish labels for the same decision-support surfaces", () => {
    renderDecisionSupport("es");

    expect(screen.getByTestId("offer-trust-section")).toHaveTextContent("Por qué esta oferta es segura para revisar");
    expect(screen.getByTestId("offer-full-specifications")).toHaveTextContent("Especificación completa");
    expect(screen.getByTestId("offer-similar-offers")).toHaveTextContent("Comparar alternativas");
    expect(screen.getByTestId("offer-similar-products")).toHaveTextContent("Productos similares");
    expect(screen.getByTestId("offer-related-insights")).toHaveTextContent("Análisis de mercado relacionado");
    expect(screen.getByTestId("offer-related-insights")).toHaveTextContent("Misma especie");
    expect(screen.getByTestId("offer-decision-faq")).toHaveTextContent("Preguntas antes de solicitar acceso");
    expect(screen.getAllByText("Precio disponible tras registrarte").length).toBeGreaterThan(1);

    for (const leaked of [
      "Why this offer is safe",
      "Full specifications",
      "Related market insights",
      "Frequently asked questions",
      "Same species",
      "Lower price",
    ]) {
      expect(screen.queryByText(leaked, { exact: false })).toBeNull();
    }
  });
});
