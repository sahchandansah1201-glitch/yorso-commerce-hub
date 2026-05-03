/**
 * SEO + i18n + image hardening tests for /blog and /blog/:slug.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
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

  it("/blog/:slug title survives a language switch (localized to current lang)", () => {
    const post = blogPosts[0];
    let setLang!: (l: "en" | "ru" | "es") => void;
    renderAt(`/blog/${post.slug}`, (s) => (setLang = s));
    expect(document.title).toContain(post.seoTitle);
    act(() => setLang("ru"));
    // После смены языка title локализован: должен НЕ совпадать с английским
    // и содержать кириллицу + "YORSO".
    expect(document.title).not.toContain(post.seoTitle);
    expect(/[А-Яа-яЁё]/.test(document.title)).toBe(true);
    expect(document.title).toContain("YORSO");
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

  it("every /blog/:slug sets a safe og:image (no lovable.dev, no /src/assets)", () => {
    for (const post of blogPosts) {
      document.head
        .querySelectorAll(
          "meta[property^='og:'], script[data-jsonld], meta[name='x-route-seo']",
        )
        .forEach((el) => el.remove());
      localStorage.setItem("yorso-lang", "en");

      const { unmount } = renderAt(`/blog/${post.slug}`);
      const og = document.head.querySelector(
        'meta[property="og:image"]',
      ) as HTMLMetaElement | null;
      expect(og, `og:image missing for /blog/${post.slug}`).not.toBeNull();
      expect(og!.content, `bad og:image for /blog/${post.slug}`).not.toMatch(
        /lovable\.dev/,
      );
      expect(og!.content, `bad og:image for /blog/${post.slug}`).not.toMatch(
        /\/src\/assets/,
      );
      unmount();
    }
  });

  it("/blog sets a non-Lovable og:image (no /src/assets, no lovable.dev)", () => {
    renderAt("/blog");
    const og = document.head.querySelector(
      'meta[property="og:image"]',
    ) as HTMLMetaElement | null;
    expect(og).not.toBeNull();
    expect(og!.content).not.toMatch(/\/src\/assets/);
    expect(og!.content).not.toMatch(/lovable\.dev/);
    expect(og!.content).toMatch(/\/blog\//);
  });

  it("RU /blog product update teaser does not render English enum values", () => {
    localStorage.setItem("yorso-lang", "ru");
    renderAt("/blog");
    const list = screen.getByTestId("blog-list");
    expect(within(list).queryByText("IMPROVED")).toBeNull();
    expect(within(list).queryByText("Improved")).toBeNull();
    expect(within(list).queryByText("PRICE ACCESS")).toBeNull();
    expect(within(list).queryByText("Price Access")).toBeNull();
    expect(within(list).queryByText("Supplier Profiles")).toBeNull();
  });

  it("RU /blog product update teaser hides English userBenefit text", () => {
    localStorage.setItem("yorso-lang", "ru");
    renderAt("/blog");
    const updates = blogPosts.filter(
      (p) => p.contentType === "product_update" && p.productUpdate?.userBenefit,
    );
    for (const p of updates) {
      expect(screen.queryByText(p.productUpdate!.userBenefit)).toBeNull();
    }
  });

  it("ES /blog product update teaser does not render English enum values", () => {
    localStorage.setItem("yorso-lang", "es");
    renderAt("/blog");
    const list = screen.getByTestId("blog-list");
    expect(within(list).queryByText("IMPROVED")).toBeNull();
    expect(within(list).queryByText("Improved")).toBeNull();
    expect(within(list).queryByText("PRICE ACCESS")).toBeNull();
    expect(within(list).queryByText("Price Access")).toBeNull();
    expect(within(list).queryByText("Supplier Profiles")).toBeNull();
    expect(within(list).queryByText("What changed")).toBeNull();
    expect(within(list).queryByText("Who benefits")).toBeNull();
  });

  it("ES /blog product update teaser hides English userBenefit text", () => {
    localStorage.setItem("yorso-lang", "es");
    renderAt("/blog");
    const updates = blogPosts.filter(
      (p) => p.contentType === "product_update" && p.productUpdate?.userBenefit,
    );
    for (const p of updates) {
      expect(screen.queryByText(p.productUpdate!.userBenefit)).toBeNull();
    }
  });
});
