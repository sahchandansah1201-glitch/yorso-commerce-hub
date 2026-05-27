import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations, type Language } from "@/i18n/translations";
import { mockOffers } from "@/data/mockOffers";
import CompareTray from "@/components/catalog/CompareTray";
import IntelligenceRail from "@/components/catalog/IntelligenceRail";

vi.mock("@/lib/analytics", () => ({
  default: {
    track: vi.fn(),
  },
}));

const renderShell = (ui: ReactElement, lang: Language) => {
  localStorage.setItem("yorso-lang", lang);
  sessionStorage.clear();

  return render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>{ui}</BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const expectLocalizedCloseOnly = (lang: "ru" | "es") => {
  expect(screen.getByRole("button", { name: translations[lang].aria_close })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Close$/ })).not.toBeInTheDocument();
};

describe("catalog sheet close labels", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  for (const lang of ["ru", "es"] as const) {
    it(`localizes the CompareTray sheet close control in ${lang.toUpperCase()}`, () => {
      renderShell(
        <CompareTray
          offers={mockOffers.slice(0, 2)}
          onRemove={() => undefined}
          onClear={() => undefined}
        />,
        lang,
      );

      fireEvent.click(screen.getByTestId("catalog-compare-open"));

      expectLocalizedCloseOnly(lang);
    });

    it(`localizes the IntelligenceRail signal drawer close control in ${lang.toUpperCase()}`, () => {
      renderShell(<IntelligenceRail category="Salmon" />, lang);

      const openHint = translations[lang].catalog_intel_signal_drawer_openHint;
      const signalButtons = screen.getAllByRole("button", {
        name: new RegExp(escapeRegExp(openHint)),
      });
      fireEvent.click(signalButtons[0]);

      expectLocalizedCloseOnly(lang);
    });
  }
});
