import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import SignIn from "@/pages/SignIn";
import ResetPassword from "@/pages/ResetPassword";

const renderAuthRoute = (initialPath: "/signin" | "/reset-password") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <BuyerSessionProvider>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("auth route CTA semantics", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders the /signin back control as a single link", () => {
    localStorage.setItem("yorso-lang", "en");
    renderAuthRoute("/signin");

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/");
    expect(document.querySelectorAll("a button, button a")).toHaveLength(0);
  });

  it("renders the /reset-password back control as a single link", () => {
    localStorage.setItem("yorso-lang", "en");
    renderAuthRoute("/reset-password");

    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute("href", "/signin");
    expect(document.querySelectorAll("a button, button a")).toHaveLength(0);
  });
});
