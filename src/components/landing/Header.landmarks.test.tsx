import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { languageNames, translations, type Language } from "@/i18n/translations";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { BUYER_SESSION_STORAGE_KEY } from "@/lib/buyer-session";

const renderHeader = (lang: Language) => {
  localStorage.setItem("yorso-lang", lang);
  return render(
    <MemoryRouter>
      <BuyerSessionProvider>
        <LanguageProvider>
          <Header showSkipLink />
        </LanguageProvider>
      </BuyerSessionProvider>
    </MemoryRouter>,
  );
};

const renderSignedInHeader = (lang: Language, displayName = "Buyer Demo") => {
  localStorage.setItem("yorso-lang", lang);
  sessionStorage.setItem(
    BUYER_SESSION_STORAGE_KEY,
    JSON.stringify({
      id: "b_header_a11y",
      identifier: "buyer@example.com",
      method: "email",
      signedInAt: new Date("2026-05-27T00:00:00.000Z").toISOString(),
      displayName,
    }),
  );

  return render(
    <MemoryRouter>
      <BuyerSessionProvider>
        <LanguageProvider>
          <Header showSkipLink />
        </LanguageProvider>
      </BuyerSessionProvider>
    </MemoryRouter>,
  );
};

describe("Header landmark labels", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  (["en", "ru", "es"] as const).forEach((lang) => {
    it(`labels desktop and mobile navigation landmarks (${lang})`, () => {
      renderHeader(lang);
      const t = translations[lang];

      expect(
        screen.getByRole("navigation", { name: t.aria_mainNavigation }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: t.aria_skipToMain })).toHaveAttribute("href", "#main");

      fireEvent.click(screen.getByRole("button", { name: t.aria_toggleMenu }));

      expect(
        screen.getByRole("navigation", { name: t.aria_mobileNavigation }),
      ).toBeInTheDocument();
    });

    it(`labels desktop and mobile language selectors (${lang})`, () => {
      renderHeader(lang);
      const t = translations[lang];
      const currentLabel = `${t.aria_currentLanguage}: ${languageNames[lang]}`;

      fireEvent.click(
        screen.getByRole("button", {
          name: `${t.aria_languageSelector}. ${currentLabel}`,
        }),
      );

      const desktopGroup = screen.getByRole("group", { name: t.aria_languageSelector });
      expect(
        within(desktopGroup).getByRole("button", { name: currentLabel }),
      ).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByRole("button", { name: t.aria_toggleMenu }));

      const mobileGroup = screen.getAllByRole("group", { name: t.aria_languageSelector }).at(-1);
      expect(mobileGroup).toBeTruthy();
      expect(
        within(mobileGroup!).getByRole("button", { name: currentLabel }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it(`labels signed-in desktop and mobile account menus (${lang})`, () => {
      const displayName = "Buyer Demo";
      renderSignedInHeader(lang, displayName);
      const t = translations[lang];
      const accountLabel = `${t.aria_accountMenu}. ${t.aria_currentAccount}: ${displayName}`;

      const desktopChip = screen.getByRole("button", { name: accountLabel });
      expect(desktopChip).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(desktopChip);
      expect(desktopChip).toHaveAttribute("aria-expanded", "true");
      expect(desktopChip).toHaveAttribute("aria-haspopup", "true");
      expect(desktopChip).toHaveAttribute("aria-controls", "header-account-menu");
      expect(screen.getByRole("group", { name: t.aria_accountMenu })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: t.aria_toggleMenu }));

      expect(screen.getByRole("group", { name: accountLabel })).toBeInTheDocument();
    });
  });
});
