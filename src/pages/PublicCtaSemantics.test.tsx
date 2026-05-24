import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "@/pages/Index";
import About from "@/pages/About";

const renderRoute = (path: "/" | "/about") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <LanguageProvider>
          <TooltipProvider>
            <BuyerSessionProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </BuyerSessionProvider>
          </TooltipProvider>
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("public CTA semantics", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("yorso-lang", "en");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("homepage renders offer links and desktop view-all CTA without nested controls", () => {
    renderRoute("/");

    const hasOffersLink = screen
      .getAllByRole("link", { name: /view all offers/i })
      .some((link) => link.getAttribute("href") === "/offers");

    expect(hasOffersLink).toBe(true);
    expect(document.querySelectorAll("a button, button a, a a, button button")).toHaveLength(0);
  });

  it("info page back CTA is one semantic link", () => {
    renderRoute("/about");

    expect(screen.getByRole("link", { name: /back to homepage/i })).toHaveAttribute("href", "/");
    expect(document.querySelectorAll("a button, button a, a a, button button")).toHaveLength(0);
  });
});
