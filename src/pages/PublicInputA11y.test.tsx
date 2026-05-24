import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";

const renderPublicRoute = (path: "/" | "/signin") => {
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
                <Route path="/signin" element={<SignIn />} />
              </Routes>
            </BuyerSessionProvider>
          </TooltipProvider>
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("public input accessibility", () => {
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

  it("homepage offer search has a programmatic label", () => {
    renderPublicRoute("/");

    const searchInput = screen.getByRole("textbox", { name: /search seafood offers/i });

    expect(searchInput).toHaveAttribute("id", "home-offer-search");
    expect(searchInput).toHaveAttribute("placeholder", expect.stringMatching(/salmon/i));
  });

  it("sign-in email mode labels the email and password fields", () => {
    renderPublicRoute("/signin");

    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
  });

  it("sign-in phone mode labels the phone and password fields", () => {
    renderPublicRoute("/signin");

    fireEvent.click(screen.getByRole("button", { name: /^phone$/i }));

    expect(screen.getByLabelText(/^phone number$/i)).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
  });

  it("forgot-password email field remains label-bound", () => {
    renderPublicRoute("/signin");

    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute("type", "email");
  });
});
