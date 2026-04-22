import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import type { Language } from "./translations";

const HREFLANG_MAP: Record<Language, string> = {
  en: "en",
  ru: "ru",
  es: "es",
};

const upsertLink = (rel: string, hreflang?: string): HTMLLinkElement => {
  const selector = hreflang
    ? `link[rel="alternate"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let tag = document.querySelector<HTMLLinkElement>(selector);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    if (hreflang) tag.setAttribute("hreflang", hreflang);
    document.head.appendChild(tag);
  }
  return tag;
};

/**
 * Синхронизирует document-level метаданные, зависящие от текущего маршрута:
 *   - <link rel="canonical">       — origin + pathname без query/hash
 *   - <link rel="alternate" hreflang="en|ru|es|x-default"> — все указывают на canonical URL
 * Локаль-зависимые теги (lang, og:*, twitter:*, dir) обрабатываются в LanguageProvider.
 */
const DocumentMetaSync = () => {
  const { lang } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const origin = window.location.origin || "";
    const canonicalUrl = `${origin}${location.pathname}`;

    const canonicalTag = upsertLink("canonical");
    canonicalTag.setAttribute("href", canonicalUrl);

    // hreflang — по одной alternate-ссылке на локаль + x-default.
    (Object.keys(HREFLANG_MAP) as Language[]).forEach((code) => {
      const hl = HREFLANG_MAP[code];
      const tag = upsertLink("alternate", hl);
      tag.setAttribute("href", canonicalUrl);
    });
    const xDefault = upsertLink("alternate", "x-default");
    xDefault.setAttribute("href", canonicalUrl);
  }, [lang, location.pathname]);

  return null;
};

export default DocumentMetaSync;
