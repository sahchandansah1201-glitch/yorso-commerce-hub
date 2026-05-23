import type { Language } from "@/i18n/translations";

export const PUBLIC_ROUTE_OG_IMAGE_PATH = "/blog/og-for-suppliers.jpg";

export const publicRouteOgImageAlt: Record<Language, string> = {
  en: "YORSO seafood sourcing workspace preview",
  ru: "Рабочее окно YORSO для закупки морепродуктов",
  es: "Vista del espacio de compra de productos del mar en YORSO",
};

export const ogLocaleByLang: Record<Language, string> = {
  en: "en_US",
  ru: "ru_RU",
  es: "es_ES",
};

export const seoTitleWithBrand = (title: string): string =>
  `${title.replace(/[.!?]+$/u, "")} | YORSO`;
