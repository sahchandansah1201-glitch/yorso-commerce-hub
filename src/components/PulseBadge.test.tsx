import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import PulseBadge from "./PulseBadge";

const renderPulseBadge = (lang: "en" | "ru" | "es" = "en") => {
  localStorage.setItem("yorso-lang", lang);
  return render(
    <LanguageProvider>
      <PulseBadge offerId="offer-pulse-test" />
    </LanguageProvider>,
  );
};

describe("PulseBadge", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("makes estimate disclosure visible and programmatic", () => {
    renderPulseBadge("en");

    const badge = screen.getByTestId("pulse-badge");

    expect(badge).toHaveTextContent(/buyers viewing now/i);
    expect(badge).toHaveTextContent(/estimate/i);
    expect(badge).toHaveAttribute("aria-label", expect.stringMatching(/estimate/i));
    expect(badge).toHaveAttribute("title", "estimate");
  });

  it("keeps the disclosure localized", () => {
    renderPulseBadge("ru");

    const badge = screen.getByTestId("pulse-badge");

    expect(badge).toHaveTextContent(/оценка/i);
    expect(badge).toHaveAttribute("aria-label", expect.stringMatching(/оценка/i));
    expect(badge).not.toHaveTextContent(/estimate/i);
  });

  it("disables pulse animation when the user requests reduced motion", () => {
    const { container } = renderPulseBadge("en");

    const ping = container.querySelector(".animate-ping");

    expect(ping).not.toBeNull();
    expect(ping).toHaveClass("motion-reduce:animate-none");
  });
});
