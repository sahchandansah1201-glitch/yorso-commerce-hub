/**
 * /offers · Footer присутствует и расположен после основного контента.
 *
 * Регрессия от инцидента «не видно подвала со всеми ссылками»:
 * глобальный <Footer /> должен рендериться на странице каталога,
 * содержать ключевые навигационные ссылки (Privacy, Terms, FAQ и т.д.)
 * и в DOM-порядке стоять ПОСЛЕ <main> — то есть в самом низу страницы,
 * куда пользователь попадает после прокрутки.
 *
 * Тест намеренно проверяет:
 *   1. наличие <footer> (одного и единственного на странице),
 *   2. что footer стоит позже main в порядке документа
 *      (compareDocumentPosition → FOLLOWING),
 *   3. наличие ключевых ссылок подвала.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import Offers from "@/pages/Offers";

const renderOffers = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <MemoryRouter initialEntries={["/offers"]}>
              <Offers />
            </MemoryRouter>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
};

describe("/offers · Footer присутствует в конце страницы", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    buyerSession.__resetForTests();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    buyerSession.__resetForTests();
  });

  it("рендерит ровно один <footer> на странице каталога", () => {
    const { container } = renderOffers();
    const footers = container.querySelectorAll("footer");
    expect(footers.length).toBe(1);
  });

  it("footer расположен в DOM после <main> (то есть внизу страницы)", () => {
    const { container } = renderOffers();
    const main = container.querySelector("main");
    const footer = container.querySelector("footer");
    expect(main, "ожидался <main> на странице /offers").not.toBeNull();
    expect(footer, "ожидался <footer> на странице /offers").not.toBeNull();

    // Bit 4 (DOCUMENT_POSITION_FOLLOWING) → footer идёт после main.
    const relation = main!.compareDocumentPosition(footer!);
    expect(
      relation & Node.DOCUMENT_POSITION_FOLLOWING,
      "footer должен находиться в DOM после <main>",
    ).toBeTruthy();
  });

  it("footer содержит ключевые навигационные ссылки", () => {
    const { container } = renderOffers();
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    const scope = within(footer as HTMLElement);

    // Стабильные ссылки, которые есть во всех локализациях
    // (различаются только надписи — проверяем по href).
    const expectedHrefs = ["/privacy", "/terms", "/faq", "/contact"];
    for (const href of expectedHrefs) {
      const link = (footer as HTMLElement).querySelector(`a[href="${href}"]`);
      expect(link, `ожидалась ссылка ${href} в footer`).not.toBeNull();
    }

    // YORSO-бренд тоже должен быть в подвале — это якорь подвала.
    expect(scope.getAllByText(/yorso/i).length).toBeGreaterThan(0);
  });
});
