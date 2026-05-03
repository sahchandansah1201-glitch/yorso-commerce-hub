/**
 * Article-template tests for /blog/:slug.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import BlogArticle from "@/pages/BlogArticle";
import { blogPosts } from "@/data/blogPosts";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/blog/:slug" element={<BlogArticle />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

describe("/blog/:slug · article template", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yorso-lang", "en");
    document.head
      .querySelectorAll('script[data-jsonld]')
      .forEach((el) => el.remove());
  });

  it("renders a known slug with exactly one h1", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(post.title);
  });

  it("falls back to not-found for unknown slug", () => {
    renderAt("/blog/this-slug-does-not-exist");
    expect(screen.getByTestId("blog-not-found")).toBeInTheDocument();
  });

  it("desktop TOC links match section H2 ids", () => {
    const post = blogPosts.find((p) => p.sections.length >= 2)!;
    renderAt(`/blog/${post.slug}`);
    const toc = screen.getByTestId("blog-toc");
    const links = within(toc).getAllByRole("link");
    const expected = post.sections.map((s) => `#${slugify(s.heading)}`);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(expected);
    // Each anchor target exists in the document
    for (const id of expected) {
      const el = document.querySelector(id);
      expect(el).not.toBeNull();
    }
  });

  it("renders related articles in the right rail", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    const related = screen.getByTestId("blog-related");
    const links = within(related).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((a) =>
      expect(a.getAttribute("href")).toMatch(/^\/blog\/[a-z0-9-]+$/),
    );
  });

  it("injects Article JSON-LD into the head", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    const script = document.head.querySelector(
      'script[data-jsonld="article"]',
    ) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.textContent ?? "{}");
    expect(data["@type"]).toBe("BlogPosting");
    expect(data.headline).toBe(post.title);
  });

  it("injects FAQ JSON-LD for guide content types", () => {
    const guide = blogPosts.find((p) => p.contentType === "buyer_guide")!;
    renderAt(`/blog/${guide.slug}`);
    const faq = document.head.querySelector(
      'script[data-jsonld="faq"]',
    ) as HTMLScriptElement | null;
    expect(faq).not.toBeNull();
    const data = JSON.parse(faq!.textContent ?? "{}");
    expect(data["@type"]).toBe("FAQPage");
    expect(Array.isArray(data.mainEntity)).toBe(true);
  });

  it("sets a canonical link tag", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    const link = document.head.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    expect(link).not.toBeNull();
    expect(link!.href).toContain(`/blog/${post.slug}`);
  });
});
