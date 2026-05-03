/**
 * Product-update layer tests for /blog and /blog/:slug.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
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

describe("Product updates layer", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yorso-lang", "en");
  });

  it("Product Updates filter narrows the grid to product_update posts", () => {
    renderAt("/blog");
    const updates = blogPosts.filter((p) => p.contentType === "product_update");
    expect(updates.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Product updates" }));
    const cards = within(screen.getByTestId("blog-list")).getAllByTestId("blog-card");
    expect(cards.length).toBe(updates.length);
    cards.forEach((c) =>
      expect(c.getAttribute("data-content-type")).toBe("product_update"),
    );
  });

  it("Latest product updates strip links to article pages", () => {
    renderAt("/blog");
    const strip = screen.getByTestId("blog-latest-updates");
    const links = within(strip).getAllByTestId("blog-latest-update-link");
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(3);
    links.forEach((a) =>
      expect(a.getAttribute("href")).toMatch(/^\/blog\/[a-z0-9-]+$/),
    );
  });

  it("renders product-update structured sections on the article page", () => {
    const post = blogPosts.find(
      (p) => p.contentType === "product_update" && p.productUpdate,
    )!;
    renderAt(`/blog/${post.slug}`);
    const block = screen.getByTestId("blog-product-update");
    expect(within(block).getByText("What changed")).toBeInTheDocument();
    expect(within(block).getByText("Who benefits")).toBeInTheDocument();
    expect(within(block).getByText("How to use it")).toBeInTheDocument();
    expect(within(block).getByText("Related workflow")).toBeInTheDocument();
    const cta = screen.getByTestId("blog-product-update-cta");
    expect(cta.getAttribute("href")).toBe(post.productUpdate!.relatedRoute);
  });
});
