/**
 * Route rendering tests for the YORSO Insights (/blog) section.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import { blogPosts } from "@/data/blogPosts";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("/blog · YORSO Insights", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yorso-lang", "en");
  });

  it("renders h1, category filters, search and crawlable article links", () => {
    renderAt("/blog");
    expect(
      screen.getByRole("heading", { level: 1, name: "YORSO Insights" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /content type/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    const list = screen.getByTestId("blog-list");
    const cards = within(list).getAllByTestId("blog-card");
    expect(cards.length).toBe(blogPosts.length);
    // crawlable: each card contains an anchor to /blog/<slug>
    const links = within(list).getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href")?.startsWith("/blog/"))).toBe(true);
  });

  it("filters by content type", () => {
    renderAt("/blog");
    const productUpdates = blogPosts.filter((p) => p.contentType === "product_update");
    fireEvent.click(screen.getByRole("button", { name: "Product updates" }));
    const cards = within(screen.getByTestId("blog-list")).getAllByTestId("blog-card");
    expect(cards.length).toBe(productUpdates.length);
    cards.forEach((c) => expect(c.getAttribute("data-content-type")).toBe("product_update"));
  });

  it("search narrows results by tag/title", () => {
    renderAt("/blog");
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "salmon" } });
    const cards = within(screen.getByTestId("blog-list")).getAllByTestId("blog-card");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(blogPosts.length);
  });

  it("shows empty state when nothing matches", () => {
    renderAt("/blog");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz-no-match-xyz-123" },
    });
    expect(screen.getByTestId("blog-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("blog-list")).not.toBeInTheDocument();
  });

  it("renders an article by slug", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    expect(screen.getByTestId("blog-article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeInTheDocument();
  });

  it("shows in-page not-found state for unknown slug", () => {
    renderAt("/blog/this-slug-does-not-exist-xyz");
    expect(screen.getByTestId("blog-not-found")).toBeInTheDocument();
  });
});
