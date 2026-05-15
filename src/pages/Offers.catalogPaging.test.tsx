import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import Offers from "@/pages/Offers";

const renderOffers = (initialEntry = "/offers") => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
              <Offers />
            </MemoryRouter>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
};

describe("/offers catalog pagination and sort controls", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    localStorage.clear();
    sessionStorage.clear();
    buyerSession.__resetForTests();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    buyerSession.__resetForTests();
  });

  it("hydrates URL-backed sort and page-size controls in local fallback mode", async () => {
    renderOffers("/offers?q=salmon&category=Salmon&sort=origin&dir=asc&rows=20&page=2");

    await waitFor(() => expect(screen.getByTestId("offer-catalog-sort")).toHaveValue("origin"));
    expect(screen.getByTestId("offer-catalog-direction")).toHaveValue("asc");
    expect(screen.getByTestId("offer-catalog-page-size")).toHaveValue("20");
    expect(screen.getByTestId("offer-catalog-page-summary")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-result-count")).toHaveTextContent(/active offers/i);
  });
});
