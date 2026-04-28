/**
 * Контракт стабильных testid для recovery-блока.
 *
 * Тест запрещает молчаливое удаление/переименование любого testid из
 * `CATALOG_RECOVERY_TEST_IDS` — без обновления этого списка тесты упадут.
 * Это защищает e2e-сценарии от рассинхрона при рефакторинге вёрстки.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import CatalogRecoveryCard from "./CatalogRecoveryCard";
import {
  CATALOG_RECOVERY_ANCHOR_ID,
  CATALOG_RECOVERY_TEST_IDS as TID,
} from "./catalog-recovery-testids";

const renderCard = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogRecoveryCard />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("CatalogRecoveryCard · стабильные data-testid селекторы", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    buyerSession.__resetForTests();
  });

  it("корневой контейнер несёт оба селектора: testid и id-якорь", () => {
    const { container, queryByTestId } = renderCard();
    const card = queryByTestId(TID.card);
    const anchor = container.querySelector(`#${CATALOG_RECOVERY_ANCHOR_ID}`);
    expect(card).not.toBeNull();
    expect(anchor).not.toBeNull();
    // Контейнер testid и якорь — один и тот же DOM-узел.
    expect(card).toBe(anchor);
  });

  it("у заголовка, описания, группы CTA и обеих кнопок есть testid", () => {
    const { queryByTestId } = renderCard();
    expect(queryByTestId(TID.title)).not.toBeNull();
    expect(queryByTestId(TID.body)).not.toBeNull();
    expect(queryByTestId(TID.ctaGroup)).not.toBeNull();
    expect(queryByTestId(TID.ctaSignup)).not.toBeNull();
    expect(queryByTestId(TID.ctaSignin)).not.toBeNull();
  });

  it("CTA-ссылки ведут на /register и /signin", () => {
    const { queryByTestId } = renderCard();
    const signup = queryByTestId(TID.ctaSignup) as HTMLAnchorElement | null;
    const signin = queryByTestId(TID.ctaSignin) as HTMLAnchorElement | null;
    expect(signup?.getAttribute("href")).toBe("/register");
    expect(signin?.getAttribute("href")).toBe("/signin");
  });
});
