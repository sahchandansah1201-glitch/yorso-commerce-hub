/**
 * Account workspace shell + section preview tests.
 * Frontend-only — no backend assumptions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import { resetAccountProfile } from "@/lib/account-store";
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
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signIn = () =>
  buyerSession.signIn({ identifier: "demo@example.com", method: "email" });

describe("Account workspace", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  it("/account redirects to /account/personal and renders shell", () => {
    signIn();
    renderAt("/account");
    expect(screen.getByTestId("account-content")).toBeInTheDocument();
    expect(screen.getByTestId("account-section-personal")).toBeInTheDocument();
  });

  it("sidebar contains all 6 sections", () => {
    signIn();
    renderAt("/account/personal");
    const sidebar = screen.getByTestId("account-sidebar");
    for (const label of [
      "Personal info",
      "Company profile",
      "Branches",
      "Products",
      "Meta-regions",
      "Notifications",
    ]) {
      expect(within(sidebar).getByText(label)).toBeInTheDocument();
    }
  });

  it("account completion is visible", () => {
    signIn();
    renderAt("/account/personal");
    expect(screen.getAllByTestId("account-overview").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("account-overview-percent").length).toBeGreaterThan(0);
  });

  it("products page renders buying, selling and both products", () => {
    signIn();
    renderAt("/account/products");
    expect(screen.getByTestId("account-products-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-role-buying").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("product-role-selling").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("product-role-both").length).toBeGreaterThan(0);
  });

  it("branches page mentions delivery basis", () => {
    signIn();
    renderAt("/account/branches");
    const explainer = screen.getByTestId("account-branches-explainer");
    expect(explainer.textContent?.toLowerCase()).toMatch(/delivery basis|incoterms/);
  });

  it("meta-regions page renders countries and usedFor tags", () => {
    signIn();
    renderAt("/account/meta-regions");
    const section = screen.getByTestId("account-section-meta-regions");
    expect(within(section).getByText("Spain")).toBeInTheDocument();
    expect(within(section).getAllByText("Notifications").length).toBeGreaterThan(0);
  });

  it("notifications page renders all 4 channels", () => {
    signIn();
    renderAt("/account/notifications");
    expect(screen.getByTestId("account-notif-email")).toBeInTheDocument();
    expect(screen.getByTestId("account-notif-messenger")).toBeInTheDocument();
    expect(screen.getByTestId("account-notif-in_app")).toBeInTheDocument();
    expect(screen.getByTestId("account-notif-agent")).toBeInTheDocument();
  });

  it("signed-out state shows CTA to sign in", () => {
    renderAt("/account/personal");
    const gate = screen.getByTestId("account-signin-required");
    expect(gate).toBeInTheDocument();
    const cta = within(gate).getByRole("link");
    expect(cta).toHaveAttribute("href", "/signin");
  });

  it("RU locale renders shell labels in Russian without English fallback", () => {
    localStorage.setItem("yorso-lang", "ru");
    signIn();
    renderAt("/account/personal");
    const sidebar = screen.getByTestId("account-sidebar");
    expect(within(sidebar).getByText("Личные данные")).toBeInTheDocument();
    expect(within(sidebar).getByText("Профиль компании")).toBeInTheDocument();
    expect(within(sidebar).getByText("Филиалы")).toBeInTheDocument();
    expect(within(sidebar).getByText("Продукты")).toBeInTheDocument();
    expect(within(sidebar).getByText("Мета-регионы")).toBeInTheDocument();
    expect(within(sidebar).getByText("Уведомления")).toBeInTheDocument();
    expect(within(sidebar).queryByText("Personal info")).toBeNull();
    expect(within(sidebar).queryByText("Company profile")).toBeNull();
  });
});

describe("calculateAccountCompletion", () => {
  it("returns a percent and items list", async () => {
    const { calculateAccountCompletion } = await import("@/lib/account-store");
    const { mockAccountProfile } = await import("@/data/mockAccount");
    const r = calculateAccountCompletion(mockAccountProfile);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.percent).toBeGreaterThanOrEqual(0);
    expect(r.percent).toBeLessThanOrEqual(100);
  });
});
