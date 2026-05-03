/**
 * SEO + i18n + image hardening tests for /blog and /blog/:slug.
 */
import { describe, it, expect, beforeEach, act } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import { blogPosts } from "@/data/blogPosts";

const Switcher = ({ onReady }: { onReady: (set: (l: "en" | "ru" | "es") => void) => void }) => {
  const { setLang } = useLanguage();
  onReady(setLang);
  return null;
};

const renderAt = (path: string, onReady?: (set: (l: "en" | "ru" | "es") => void) => void) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          {onReady ? <Switcher onReady={onReady} /> : null}
          <Routes>
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const cleanHead = () => {
  document.head
    .querySelectorAll("script[data-jsonld], meta[name='x-route-seo']")
    .forEach((el) => el.remove());
};

describe("SEO hardening", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yorso-lang", "en");
    cleanHead();
  });

  it("/blog owns its document.title (not the global site title)", () => {
    renderAt("/blog");
    expect(document.title).toContain("YORSO Insights");
  });

  it("/blog title survives a language switch (LanguageContext does not overwrite)", () => {
    let setLang!: (l: "en" | "ru" | "es") => void;
    renderAt("/blog", (s) => (setLang = s));
    expect(document.title).toContain("YORSO Insights");
    act(() => setLang("ru"));
    expect(document.title).toContain("YORSO Insights");
    expect(document.title).not.toMatch(/B2B Seafood Marketplace/);
  });

  it("/blog has CollectionPage JSON-LD", () => {
    renderAt("/blog");
    const el = document.head.querySelector(
      'script[data-jsonld="blog-collection"]',
    ) as HTMLScriptElement | null;
    expect(el).not.toBeNull();
    const data = JSON.parse(el!.textContent ?? "{}");
    expect(data["@type"]).toBe("CollectionPage");
    expect(data.mainEntity["@type"]).toBe("ItemList");
    expect(Array.isArray(data.mainEntity.itemListElement)).toBe(true);
    expect(data.mainEntity.itemListElement.length).toBe(blogPosts.length);
  });

  it("RU blog index renders localized Popular Topics and Start Here (no English leak)", () => {
    localStorage.setItem("yorso-lang", "ru");
    renderAt("/blog");
    expect(screen.getByText("Популярные темы")).toBeInTheDocument();
    expect(screen.getByText("Начните отсюда")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Цены на лосось" })).toBeInTheDocument();
    expect(screen.queryByText("Salmon prices")).not.toBeInTheDocument();
    expect(screen.queryByText("Browse the catalog")).not.toBeInTheDocument();
  });

  it("blog post data contains no /src/assets URLs", () => {
    for (const p of blogPosts) {
      expect(p.heroImage).not.toMatch(/^\/src\/assets/);
    }
  });

  it("blog index image alt text is non-empty and meaningful", () => {
    renderAt("/blog");
    const featured = screen.getByTestId("blog-featured");
    const img = within(featured).getByRole("img") as HTMLImageElement;
    expect(img.alt.length).toBeGreaterThan(8);
  });

  it("article hero image alt text is non-empty", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    expect(post.heroImageAlt.length).toBeGreaterThan(8);
  });

  it("/blog/:slug title survives a language switch", () => {
    const post = blogPosts[0];
    let setLang!: (l: "en" | "ru" | "es") => void;
    renderAt(`/blog/${post.slug}`, (s) => (setLang = s));
    expect(document.title).toContain(post.seoTitle);
    act(() => setLang("ru"));
    expect(document.title).toContain(post.seoTitle);
  });

  it("/blog/:slug emits BreadcrumbList JSON-LD", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    const el = document.head.querySelector(
      'script[data-jsonld="breadcrumb"]',
    ) as HTMLScriptElement | null;
    expect(el).not.toBeNull();
    const data = JSON.parse(el!.textContent ?? "{}");
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement.length).toBe(3);
  });

  it("OG image on article uses absolute URL, not /src/assets", () => {
    const post = blogPosts[0];
    renderAt(`/blog/${post.slug}`);
    const og = document.head.querySelector(
      'meta[property="og:image"]',
    ) as HTMLMetaElement | null;
    expect(og).not.toBeNull();
    expect(og!.content).not.toMatch(/\/src\/assets/);
  });
});
