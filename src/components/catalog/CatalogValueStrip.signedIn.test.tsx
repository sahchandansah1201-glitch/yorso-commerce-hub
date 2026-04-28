/**
 * CatalogValueStrip · видимость по статусу сессии.
 *
 * Контракт: блок «Получите больше от каталога» показывается ТОЛЬКО
 * незарегистрированным посетителям (anonymous_locked). Любой
 * авторизованный пользователь — registered_locked, qualified_unlocked,
 * или просто наличие buyer-сессии — этот блок видеть не должен.
 */
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import CatalogValueStrip from "@/components/catalog/CatalogValueStrip";

const renderStrip = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogValueStrip />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("CatalogValueStrip · скрыт для зарегистрированных пользователей", () => {
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

  it("анонимный посетитель ВИДИТ блок «Получите больше от каталога»", () => {
    const { queryByTestId } = renderStrip();
    expect(queryByTestId("catalog-value-strip")).not.toBeNull();
  });

  it("зарегистрированный пользователь НЕ видит блок", () => {
    // Создаём buyer-сессию ДО рендера, как после успешного логина.
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });

    const { queryByTestId } = renderStrip();
    expect(queryByTestId("catalog-value-strip")).toBeNull();
    expect(queryByTestId("catalog-value-strip-pending")).toBeNull();
    expect(queryByTestId("catalog-value-strip-cta")).toBeNull();
  });

  it("после signOut блок снова появляется", () => {
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    const { queryByTestId, rerender } = renderStrip();
    expect(queryByTestId("catalog-value-strip")).toBeNull();

    buyerSession.signOut();
    rerender(
      <MemoryRouter>
        <LanguageProvider>
          <BuyerSessionProvider>
            <CatalogValueStrip />
          </BuyerSessionProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(queryByTestId("catalog-value-strip")).not.toBeNull();
  });
});
