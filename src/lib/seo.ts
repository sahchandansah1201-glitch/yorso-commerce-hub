/**
 * Small SEO helpers shared by route-owned pages (Blog, BlogArticle, etc.).
 *
 * The `x-route-seo` marker tells LanguageContext that the current route owns
 * <title> and <meta name="description">, so the global LanguageContext effect
 * must NOT overwrite them on language switches or re-renders.
 */

const MARKER_NAME = "x-route-seo";

export const upsertMeta = (
  selector: string,
  attrs: Record<string, string>,
): void => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
};

export const upsertLink = (rel: string, href: string): void => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const upsertJsonLd = (id: string, data: unknown): void => {
  let el = document.head.querySelector<HTMLScriptElement>(
    `script[data-jsonld="${id}"]`,
  );
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute("data-jsonld", id);
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
};

export const removeJsonLd = (id: string): void => {
  document.head.querySelector(`script[data-jsonld="${id}"]`)?.remove();
};

export const setRouteSeoMarker = (): void => {
  if (typeof document === "undefined") return;
  let m = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${MARKER_NAME}"]`,
  );
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute("name", MARKER_NAME);
    document.head.appendChild(m);
  }
};

export const clearRouteSeoMarker = (): void => {
  if (typeof document === "undefined") return;
  document.head.querySelector(`meta[name="${MARKER_NAME}"]`)?.remove();
};

export const isRouteSeoOwned = (): boolean =>
  typeof document !== "undefined" &&
  document.head.querySelector(`meta[name="${MARKER_NAME}"]`) !== null;

export const absoluteUrl = (path: string): string => {
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return path;
  }
};

/**
 * Set route-owned SEO. Honors the marker so global LanguageContext skips it.
 */
export const applyRouteSeo = (opts: {
  title: string;
  description: string;
  canonical?: string;
  og?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
}): void => {
  if (typeof document === "undefined") return;
  setRouteSeoMarker();
  document.title = opts.title;
  upsertMeta('meta[name="description"]', {
    name: "description",
    content: opts.description,
  });
  if (opts.canonical) upsertLink("canonical", opts.canonical);
  if (opts.og) {
    if (opts.og.type)
      upsertMeta('meta[property="og:type"]', {
        property: "og:type",
        content: opts.og.type,
      });
    if (opts.og.title)
      upsertMeta('meta[property="og:title"]', {
        property: "og:title",
        content: opts.og.title,
      });
    if (opts.og.description)
      upsertMeta('meta[property="og:description"]', {
        property: "og:description",
        content: opts.og.description,
      });
    if (opts.og.url)
      upsertMeta('meta[property="og:url"]', {
        property: "og:url",
        content: opts.og.url,
      });
    if (opts.og.image)
      upsertMeta('meta[property="og:image"]', {
        property: "og:image",
        content: opts.og.image,
      });
  }
};
