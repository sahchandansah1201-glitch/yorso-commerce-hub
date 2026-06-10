/**
 * Account product catalog loader.
 *
 * Source of truth: `latin_name_fish_localized.xlsx` (sheet `localized_names`),
 * exported at build/author time to `public/data/account-product-catalog.json`.
 *
 * The browser only ever loads the static JSON asset — never the workbook.
 * If the fetch fails for any reason, a tiny inline fallback keeps the
 * product picker usable.
 */

export type CatalogLang = "en" | "es" | "ru" | "fr" | "cn" | "de";

export interface CatalogItem {
  id: string;
  latin: string;
  en?: string;
  es?: string;
  ru?: string;
  fr?: string;
  cn?: string;
  de?: string;
}

export const CATALOG_ASSET_URL = "/data/account-product-catalog.json";

/**
 * Minimal fallback so the picker stays functional if the JSON asset
 * is not reachable (offline, asset gate, etc.). Not a mock catalog —
 * only a last-resort safety net for the failure mode.
 */
const FALLBACK_CATALOG: CatalogItem[] = [
  {
    id: "salmo-salar-fallback",
    latin: "Salmo salar",
    en: "Atlantic salmon",
    ru: "Атлантический лосось",
    es: "Salmón del Atlántico",
  },
  {
    id: "gadus-morhua-fallback",
    latin: "Gadus morhua",
    en: "Atlantic cod",
    ru: "Атлантическая треска",
    es: "Bacalao del Atlántico",
  },
];

const LANG_FALLBACK_ORDER: CatalogLang[] = ["en", "es", "ru"];

export const localizedName = (
  item: CatalogItem,
  lang: string,
): string => {
  const primary = (item as unknown as Record<string, string | undefined>)[lang];
  if (primary && primary.trim()) return primary;
  for (const l of LANG_FALLBACK_ORDER) {
    const v = item[l];
    if (v && v.trim()) return v;
  }
  return item.latin;
};

let cache: CatalogItem[] | null = null;
let inflight: Promise<CatalogItem[]> | null = null;

export const loadAccountProductCatalog = async (
  fetchImpl: typeof fetch = fetch,
): Promise<CatalogItem[]> => {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetchImpl(CATALOG_ASSET_URL, { cache: "force-cache" });
      if (!res.ok) throw new Error(`catalog fetch ${res.status}`);
      const data = (await res.json()) as CatalogItem[];
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("catalog empty");
      }
      cache = data;
      return data;
    } catch {
      cache = FALLBACK_CATALOG;
      return FALLBACK_CATALOG;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

export const _resetCatalogCacheForTests = () => {
  cache = null;
  inflight = null;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Filter catalog by free-text query. Matches against latin and every
 * localized name (en/es/ru/fr/cn/de). Returns up to `limit` items.
 */
export const searchCatalog = (
  items: CatalogItem[],
  query: string,
  limit = 25,
): CatalogItem[] => {
  const q = normalize(query.trim());
  if (!q) return items.slice(0, limit);
  const out: CatalogItem[] = [];
  for (const item of items) {
    const hay = [
      item.latin,
      item.en,
      item.es,
      item.ru,
      item.fr,
      item.cn,
      item.de,
    ]
      .filter(Boolean)
      .map((v) => normalize(v as string))
      .join(" \u0001 ");
    if (hay.includes(q)) {
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
};
