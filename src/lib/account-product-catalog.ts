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

const LOCALIZED_KEYS: CatalogLang[] = ["en", "es", "ru", "fr", "cn", "de"];

/**
 * Filter catalog by free-text query with ranking:
 *   0 — exact Latin match
 *   1 — exact match on any localized name (active locale preferred)
 *   2 — Latin starts-with
 *   3 — localized starts-with
 *   4 — Latin contains
 *   5 — localized contains
 * Returns up to `limit` items, sorted by rank then by original index.
 */
export const searchCatalog = (
  items: CatalogItem[],
  query: string,
  limit = 25,
  activeLang?: string,
): CatalogItem[] => {
  const q = normalize(query.trim());
  if (!q) return items.slice(0, limit);
  const scored: Array<{ item: CatalogItem; rank: number; idx: number }> = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const latinN = normalize(item.latin);
    let rank = Infinity;
    if (latinN === q) rank = 0;
    else {
      // exact localized
      const activeVal = activeLang
        ? (item as unknown as Record<string, string | undefined>)[activeLang]
        : undefined;
      if (activeVal && normalize(activeVal) === q) rank = 1;
      else {
        for (const l of LOCALIZED_KEYS) {
          const v = item[l];
          if (v && normalize(v) === q) {
            rank = 1;
            break;
          }
        }
      }
      if (rank === Infinity && latinN.startsWith(q)) rank = 2;
      if (rank === Infinity) {
        for (const l of LOCALIZED_KEYS) {
          const v = item[l];
          if (v && normalize(v).startsWith(q)) {
            rank = 3;
            break;
          }
        }
      }
      if (rank === Infinity && latinN.includes(q)) rank = 4;
      if (rank === Infinity) {
        for (const l of LOCALIZED_KEYS) {
          const v = item[l];
          if (v && normalize(v).includes(q)) {
            rank = 5;
            break;
          }
        }
      }
    }
    if (rank !== Infinity) scored.push({ item, rank, idx });
  }
  scored.sort((a, b) => (a.rank - b.rank) || (a.idx - b.idx));
  return scored.slice(0, limit).map((s) => s.item);
};
