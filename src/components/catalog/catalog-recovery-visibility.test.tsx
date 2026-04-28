/**
 * `useCatalogRecoveryVisible` / `<CatalogRecoveryGate>` — единый источник
 * правды для recovery-блоков каталога. Тест проверяет инвариант:
 * блок видим только анонимам и скрыт сразу после signIn (и снова виден
 * после signOut), независимо от места использования.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import { CatalogRecoveryGate } from "./catalog-recovery-visibility";

const renderGate = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogRecoveryGate>
            <div data-testid="recovery-child">child</div>
          </CatalogRecoveryGate>
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("CatalogRecoveryGate · единый источник правды видимости", () => {
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

  it("анонимный посетитель ВИДИТ children", () => {
    const { queryByTestId } = renderGate();
    expect(queryByTestId("recovery-child")).not.toBeNull();
  });

  it("зарегистрированный пользователь НЕ видит children", () => {
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    const { queryByTestId } = renderGate();
    expect(queryByTestId("recovery-child")).toBeNull();
  });

  it("после signOut children снова появляются", () => {
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    const { queryByTestId, rerender } = renderGate();
    expect(queryByTestId("recovery-child")).toBeNull();

    buyerSession.signOut();
    rerender(
      <MemoryRouter>
        <LanguageProvider>
          <BuyerSessionProvider>
            <CatalogRecoveryGate>
              <div data-testid="recovery-child">child</div>
            </CatalogRecoveryGate>
          </BuyerSessionProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(queryByTestId("recovery-child")).not.toBeNull();
  });

  it("использует кастомный fallback, когда блок скрыт", () => {
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    const { queryByTestId } = render(
      <MemoryRouter>
        <LanguageProvider>
          <BuyerSessionProvider>
            <CatalogRecoveryGate fallback={<div data-testid="fallback">x</div>}>
              <div data-testid="recovery-child">child</div>
            </CatalogRecoveryGate>
          </BuyerSessionProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(queryByTestId("recovery-child")).toBeNull();
    expect(queryByTestId("fallback")).not.toBeNull();
  });
});
