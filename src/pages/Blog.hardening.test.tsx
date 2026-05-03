/**
 * Hardened-blog tests: header nav link, RU UI shell, no nested interactive
 * elements inside blog cards.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Header from "@/components/landing/Header";
import Blog from "@/pages/Blog";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";

const renderHeader = (lang: "en" | "ru") => {
  localStorage.setItem("yorso-lang", lang);
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <BuyerSessionProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Header />
          </TooltipProvider>
        </LanguageProvider>
      </BuyerSessionProvider>
    </MemoryRouter>,
  );
};

const renderBlog = (lang: "en" | "ru") => {
  localStorage.setItem("yorso-lang", lang);
  return render(
    <MemoryRouter initialEntries={["/blog"]}>
      <LanguageProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/blog" element={<Blog />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("Blog hardening", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("header has a /blog link in EN", () => {
    renderHeader("en");
    const links = screen.getAllByRole("link", { name: /insights/i });
    expect(
      links.some((a) => a.getAttribute("href") === "/blog"),
    ).toBe(true);
  });

  it("header has a /blog link in RU", () => {
    renderHeader("ru");
    const links = screen.getAllByRole("link");
    expect(
      links.some((a) => a.getAttribute("href") === "/blog"),
    ).toBe(true);
  });

  it("RU shell renders localized filter labels (no English leak)", () => {
    renderBlog("ru");
    expect(
      screen.getByRole("button", { name: "Обновления продукта" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Рыночная аналитика" }),
    ).toBeInTheDocument();
    // Old EN label must not appear
    expect(screen.queryByText("Product updates")).not.toBeInTheDocument();
  });

  it("category filters expose aria-pressed", () => {
    renderBlog("en");
    const btn = screen.getByRole("button", { name: "Market intelligence" });
    expect(btn).toHaveAttribute("aria-pressed");
  });

  it("blog cards do not contain nested button-in-link interactive elements", () => {
    renderBlog("en");
    const cards = screen.getAllByTestId("blog-card");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      // Find any anchor and ensure it does not contain a button or another anchor
      const anchors = within(card).queryAllByRole("link");
      anchors.forEach((a) => {
        expect(a.querySelector("button")).toBeNull();
        expect(a.querySelector("a")).toBeNull();
      });
    });
  });

  it("search input has accessible label", () => {
    renderBlog("en");
    expect(screen.getByRole("searchbox")).toHaveAccessibleName();
  });
});
