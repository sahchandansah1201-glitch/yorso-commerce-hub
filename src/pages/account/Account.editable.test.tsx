/**
 * Editability, media, redirects and locale-leak tests for /account.
 * Frontend-only.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import {
  resetAccountProfile,
  getAccountProfile,
  ACCOUNT_STORAGE_KEY,
  calculateAccountCompletion,
} from "@/lib/account-store";
import Account from "@/pages/account/Account";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/account" element={<Navigate to="/account/personal" replace />} />
              <Route path="/account/:section" element={<Account />} />
              <Route path="/profile/company" element={<Navigate to="/account/company" replace />} />
              <Route path="/profile/company-addresses" element={<Navigate to="/account/branches" replace />} />
              <Route path="/profile/classify" element={<Navigate to="/account/products" replace />} />
              <Route path="/profile/meta-regions" element={<Navigate to="/account/meta-regions" replace />} />
              <Route path="/profile/company-spam" element={<Navigate to="/account/notifications" replace />} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signIn = () =>
  buyerSession.signIn({ identifier: "demo@example.com", method: "email" });

describe("Account editability", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  it("Personal: edit -> save persists to localStorage", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    const input = within(card).getByTestId("account-input-firstName") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Maria" } });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    expect(getAccountProfile().user.firstName).toBe("Maria");
    expect(localStorage.getItem(ACCOUNT_STORAGE_KEY)).toContain("Maria");
  });

  it("Personal: cancel restores previous value", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    const before = getAccountProfile().user.firstName;
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    fireEvent.change(within(card).getByTestId("account-input-firstName"), {
      target: { value: "Throwaway" },
    });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-cancel"));
    expect(getAccountProfile().user.firstName).toBe(before);
  });

  it("Personal: invalid email blocks save", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    const inputs = within(card).getAllByRole("textbox");
    // 3rd field is email
    const emailInput = inputs.find((i) => (i as HTMLInputElement).type === "email")!;
    fireEvent.change(emailInput, { target: { value: "broken" } });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    expect(card.getAttribute("data-editing")).toBe("true");
  });

  it("Company media card exists with logo and cover preview slots", () => {
    signIn();
    renderAt("/account/company");
    const media = screen.getByTestId("account-card-company-media");
    expect(media).toBeInTheDocument();
    fireEvent.click(within(media).getByTestId("account-card-company-media-edit"));
    expect(within(media).getByTestId("account-media-logo-url")).toBeInTheDocument();
    expect(within(media).getByTestId("account-media-cover-url")).toBeInTheDocument();
  });

  it("Adding logo+cover URLs increases completion", () => {
    signIn();
    renderAt("/account/company");
    const before = calculateAccountCompletion(getAccountProfile()).percent;
    const media = screen.getByTestId("account-card-company-media");
    fireEvent.click(within(media).getByTestId("account-card-company-media-edit"));
    fireEvent.change(within(media).getByTestId("account-media-logo-url"), {
      target: { value: "https://example.com/logo.png" },
    });
    fireEvent.change(within(media).getByTestId("account-media-cover-url"), {
      target: { value: "https://example.com/cover.jpg" },
    });
    fireEvent.click(within(media).getByTestId("account-card-company-media-save"));
    const after = calculateAccountCompletion(getAccountProfile()).percent;
    expect(after).toBeGreaterThan(before);
    expect(getAccountProfile().company.logoImageUrl).toContain("logo.png");
  });

  it("Supplier profile preview renders on company page", () => {
    signIn();
    renderAt("/account/company");
    expect(screen.getByTestId("account-supplier-preview")).toBeInTheDocument();
  });
});

describe("Account legacy /profile redirects", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  const cases: Array<[string, string]> = [
    ["/profile/company", "account-section-company"],
    ["/profile/company-addresses", "account-section-branches"],
    ["/profile/classify", "account-section-products"],
    ["/profile/meta-regions", "account-section-meta-regions"],
    ["/profile/company-spam", "account-section-notifications"],
  ];

  for (const [from, target] of cases) {
    it(`${from} redirects to /account/* equivalent`, () => {
      signIn();
      renderAt(from);
      expect(screen.getByTestId(target)).toBeInTheDocument();
    });
  }
});

describe("Account RU locale enum leaks", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  it("RU products page does not show raw English state enum values", () => {
    localStorage.setItem("yorso-lang", "ru");
    signIn();
    renderAt("/account/products");
    const table = screen.getByTestId("account-products-table");
    const html = table.innerHTML;
    expect(html).not.toMatch(/>\s*frozen\s*</);
    expect(html).not.toMatch(/>\s*fresh\s*</);
    expect(html).not.toMatch(/>\s*alive\s*</);
    // Cyrillic state label visible
    expect(within(table).getAllByText("Замороженный").length).toBeGreaterThan(0);
  });

  it("RU company page uses localized accountRole label, not raw enum", () => {
    localStorage.setItem("yorso-lang", "ru");
    signIn();
    renderAt("/account/company");
    const id = screen.getByTestId("account-card-company-identity");
    expect(within(id).queryByText("both")).toBeNull();
    expect(within(id).getByText("Покупатель и поставщик")).toBeInTheDocument();
  });

  it("does not render em dash fallback in personal page", () => {
    signIn();
    renderAt("/account/personal");
    const section = screen.getByTestId("account-section-personal");
    expect(section.textContent ?? "").not.toMatch(/[—–]/);
  });
});

describe("Account save UX (indicator + error handling)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  it("validation failure shows inline error summary and keeps edit mode", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    fireEvent.change(within(card).getByTestId("account-input-firstName"), {
      target: { value: "" },
    });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    expect(within(card).getByTestId("account-card-personal-basic-error")).toBeInTheDocument();
    expect(card.getAttribute("data-save-state")).toBe("error");
    expect(card.getAttribute("data-editing")).toBe("true");
  });

  it("successful save shows 'Saved' indicator and exits edit mode", async () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    });
    await act(async () => {
      fireEvent.change(within(card).getByTestId("account-input-firstName"), {
        target: { value: "Olga" },
      });
    });
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    });
    expect(card.getAttribute("data-editing")).toBe("false");
    expect(within(card).getByTestId("account-card-personal-basic-saved-indicator")).toBeInTheDocument();
  });

  it("localStorage write failure surfaces an inline error", async () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    try {
      await act(async () => {
        fireEvent.change(within(card).getByTestId("account-input-firstName"), {
          target: { value: "Quota" },
        });
      });
      await act(async () => {
        fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
      });
      expect(within(card).getByTestId("account-card-personal-basic-error")).toBeInTheDocument();
      expect(card.getAttribute("data-save-state")).toBe("error");
      expect(card.getAttribute("data-editing")).toBe("true");
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
