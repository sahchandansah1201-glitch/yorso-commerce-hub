/**
 * Anti-flicker гарантия: при наличии buyer-сессии recovery-блок
 * (`#catalog-anchor-recovery` / `data-testid="catalog-recovery-card"`)
 * не должен ни на один тик попадать в DOM — даже до завершения
 * асинхронных эффектов страницы /offers.
 *
 * Источник правды видимости (`useCatalogRecoveryVisible`) опирается на
 * `useBuyerSession`, который инициализируется синхронно из storage:
 *   useState(() => buyerSession.getSession())
 * Значит, при сессии, созданной ДО mount, на первом же рендере
 * `<CatalogRecoveryGate>` обязан вернуть `null`. Любой регресс
 * (например, перенос проверки в useEffect) приведёт к одно-кадровому
 * «миганию» — и этот тест его поймает.
 *
 * Реализация: вешаем MutationObserver на body ещё ДО render(),
 * собираем все добавления нод за весь lifecycle render+эффекты+
 * микрозадачи+таймеры, и проверяем, что узел с recovery-testid
 * никогда не появлялся.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import Offers from "@/pages/Offers";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";

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

const flushAsync = async () => {
  // микро + макро задачи: эффекты, подписки, отложенные setState.
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 50));
};

const isRecoveryNode = (node: Node): boolean => {
  if (!(node instanceof HTMLElement)) return false;
  if (node.getAttribute?.("data-testid") === RECOVERY_TESTID) return true;
  if (node.id === RECOVERY_ANCHOR_ID) return true;
  if (
    node.querySelector?.(
      `[data-testid="${RECOVERY_TESTID}"], #${RECOVERY_ANCHOR_ID}`,
    )
  ) {
    return true;
  }
  return false;
};

describe("/offers · recovery-блок не «мигает» при isSignedIn=true", () => {
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

  it("recovery-блок не появляется ни на один тик, если сессия есть до mount", async () => {
    // Сессия установлена ДО рендера — как при возврате на сайт авторизованного пользователя.
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });

    // Подписываемся на DOM ДО render(), чтобы поймать даже одно-кадровое появление.
    const sightings: string[] = [];
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (isRecoveryNode(n)) sightings.push("added");
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    try {
      const { queryByTestId, container } = renderOffers();

      // Сразу после первого рендера блока быть не должно.
      expect(queryByTestId(RECOVERY_TESTID)).toBeNull();
      expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).toBeNull();

      // Дожидаемся всех асинхронных эффектов и подписок.
      await flushAsync();

      // По итогам lifecycle блок так и не должен был отрисоваться.
      expect(queryByTestId(RECOVERY_TESTID)).toBeNull();
      expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).toBeNull();

      // Главное anti-flicker утверждение: MutationObserver не зафиксировал
      // ни одной вставки recovery-узла за весь lifecycle.
      expect(
        sightings,
        `recovery-блок мигнул в DOM ${sightings.length} раз — это flicker-регресс`,
      ).toHaveLength(0);
    } finally {
      observer.disconnect();
    }
  });

  it("анонимный посетитель ВИДИТ блок (контроль теста — observer корректно ловит вставки)", async () => {
    const sightings: string[] = [];
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (isRecoveryNode(n)) sightings.push("added");
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    try {
      const { queryByTestId } = renderOffers();
      await flushAsync();

      expect(queryByTestId(RECOVERY_TESTID)).not.toBeNull();
      // Observer обязан был увидеть хотя бы одну вставку — иначе
      // anti-flicker ассерт выше становится бесполезным.
      expect(sightings.length).toBeGreaterThan(0);
    } finally {
      observer.disconnect();
    }
  });
});
