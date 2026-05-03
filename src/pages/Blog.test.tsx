/**
 * Route rendering tests for the YORSO Insights (/blog) section.
 *
 * Verifies:
 *  - /blog renders the index with the YORSO Insights title and a list of cards.
 *  - /blog/:slug renders an article by slug with title and back link.
 *  - /blog/:slug for an unknown slug renders the in-page not-found state.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("renders the index with title and at least one card", () => {
    renderAt("/blog");
    expect(screen.getAllByText("YORSO Insights").length).toBeGreaterThan(0);
    const list = screen.getByTestId("blog-list");
    expect(list).toBeInTheDocument();
    const cards = screen.getAllByTestId("blog-card");
    expect(cards.length).toBe(blogPosts.length);
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
