/**
 * catalog-api.ts — слой доступа к каталогу через Supabase.
 *
 * МОДЕЛЬ БЕЗОПАСНОСТИ (после миграции 2026-04-28):
 *
 *   anonymous_locked / registered_locked
 *     ├─ читают view `offers_public` БЕЗ price_min/max/currency/unit, БЕЗ supplier_id.
 *     │  Возвращается только `price_range_label` («$5.50 – $6.30/kg» или «По запросу»).
 *     └─ читают view `suppliers_public` БЕЗ company_name/website/contacts/rating.
 *        Только обезличенные сигналы доверия (страна, верификация, профиль-slug).
 *        ⇒ Точная цена и имя поставщика физически не приходят в network response.
 *
 *   qualified_unlocked
 *     └─ вызывает RPC `get_qualified_offers()` / `get_qualified_offer(id)`.
 *        SECURITY DEFINER внутри проверяет:
 *          • admin OR
 *          • supplier-owner этого оффера OR
 *          • buyer + has_price_access(uid, offer_id) = true
 *        Без подходящего права вернёт 0 строк → фронт упадёт обратно на public-флоу.
 *
 * RLS в БД — единственный источник истины. Этот слой только маппит сырые
 * строки в `SeafoodOffer` для существующих компонентов Phase 1.
 */

import { supabase } from "@/integrations/supabase/client";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { logCatalogPrivilegeError } from "@/lib/catalog-privilege-log";

const REDACTED_PRICE = "Цена по запросу";
const REDACTED_SUPPLIER = "Имя поставщика скрыто";

/** Строка из публичного view — без чувствительных полей. */
type OfferPublicRow = {
  id: string;
  product_name: string;
  species: string | null;
  latin_name: string | null;
  category_id: string | null;
  origin_country_code: string;
  origin_flag: string | null;
  format: string | null;
  format_cut: string | null;
  packaging_label: string | null;
  packaging: string | null;
  certifications: string[];
  price_range_label: string | null;
  moq_value: number | null;
  moq_unit: string | null;
  moq_label: string | null;
  freshness: string | null;
  image: string | null;
  image_list: string[];
  gallery: unknown;
  delivery_basis_options: unknown;
  volume_breaks: unknown;
  related_articles: unknown;
  specs: unknown;
  commercial_terms: unknown;
  traceability: string | null;
  sample_available: boolean;
  inspection_available: boolean;
  photo_source_label: string | null;
  status: string;
};

/** Строка из публичного view поставщиков — без company_name/website. */
type SupplierPublicRow = {
  id: string;
  country_code: string;
  country_flag: string | null;
  certifications: string[];
  verification_status: string;
  in_business_since: number | null;
  response_time: string | null;
  profile_slug: string | null;
  verification_scope: string | null;
  verification_date: string | null;
  documents_reviewed: string[];
};

/** Строка из RPC get_qualified_offer(s) — со всеми ценами и данными поставщика. */
type QualifiedOfferRow = OfferPublicRow & {
  price_min: number | null;
  price_max: number | null;
  price_currency: string;
  price_unit: string;
  supplier_id: string | null;
  supplier_company_name: string | null;
  supplier_country_code: string | null;
  supplier_country_flag: string | null;
  supplier_website: string | null;
  supplier_rating: number | null;
  supplier_verification_status: string | null;
  supplier_in_business_since: number | null;
  supplier_response_time: string | null;
  supplier_profile_slug: string | null;
};

type CategoryRow = { id: string; slug: string; name: string };

const COUNTRY_NAME: Record<string, string> = {
  NO: "Norway", EC: "Ecuador", IS: "Iceland", PH: "Philippines", RU: "Russia",
  AR: "Argentina", PE: "Peru", VN: "Vietnam", TR: "Turkey", MA: "Morocco",
  BD: "Bangladesh",
};

const ALLOWED_FORMATS = new Set(["Frozen", "Fresh", "Chilled"]);
const safeFormat = (f: string | null): "Frozen" | "Fresh" | "Chilled" =>
  f && ALLOWED_FORMATS.has(f) ? (f as "Frozen" | "Fresh" | "Chilled") : "Frozen";
const safeArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const safeObj = <T,>(v: unknown): T => (v && typeof v === "object" ? (v as T) : ({} as T));

const formatPriceRange = (
  min: number | null,
  max: number | null,
  currency: string,
  unit: string,
  fallback: string | null,
): string => {
  if (min == null || max == null) return fallback ?? REDACTED_PRICE;
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `${sym}${min.toFixed(2)} – ${sym}${max.toFixed(2)}/${unit}`;
};

interface MapPublicCtx {
  categoryById: Map<string, CategoryRow>;
  /** Только для отображения страны/верификации поставщика, БЕЗ имени. */
  supplierByCategoryHint?: never;
}

/** Маппинг публичной (не-qualified) строки. Имя поставщика и точная цена скрыты. */
const mapPublicRow = (row: OfferPublicRow, ctx: MapPublicCtx): SeafoodOffer => {
  const category = row.category_id ? ctx.categoryById.get(row.category_id) : undefined;
  return {
    id: row.id,
    productName: row.product_name,
    species: row.species ?? "",
    latinName: row.latin_name ?? "",
    origin: COUNTRY_NAME[row.origin_country_code] ?? row.origin_country_code,
    originFlag: row.origin_flag ?? "",
    supplierName: REDACTED_SUPPLIER,
    isVerified: false,
    priceRange: row.price_range_label ?? REDACTED_PRICE,
    priceUnit: "",
    moq: row.moq_label ?? (row.moq_value != null ? `MOQ: ${row.moq_value} ${row.moq_unit ?? "kg"}` : "MOQ on request"),
    freshness: row.freshness ?? "",
    image: row.image ?? "/placeholder.svg",
    images: row.image_list?.length ? row.image_list : (row.image ? [row.image] : []),
    gallery: safeArr(row.gallery),
    category: category?.name ?? "Other",
    format: safeFormat(row.format),
    cutType: row.format_cut ?? "",
    packaging: row.packaging_label ?? row.packaging ?? "",
    certifications: row.certifications ?? [],
    photoSourceLabel: row.photo_source_label ?? "",
    sampleAvailable: !!row.sample_available,
    inspectionAvailable: !!row.inspection_available,
    traceability: row.traceability ?? undefined,
    priceMin: undefined,
    priceMax: undefined,
    currency: undefined,
    priceUnitKey: "offers_priceUnit_perKg",
    moqValue: row.moq_value ?? undefined,
    moqUnitKey: "offers_qtyUnit_kg",
    supplier: {
      name: REDACTED_SUPPLIER,
      isVerified: false,
      country: "",
      countryFlag: "",
      inBusinessSince: 0,
      responseTime: "",
      certifications: [],
      documentsReviewed: [],
      profileSlug: "",
    },
    specs: safeObj(row.specs) as SeafoodOffer["specs"],
    commercial: safeObj(row.commercial_terms) as SeafoodOffer["commercial"],
    deliveryBasisOptions: safeArr(row.delivery_basis_options),
    relatedArticles: safeArr(row.related_articles),
    volumeBreaks: safeArr(row.volume_breaks),
  } satisfies SeafoodOffer;
};

/** Маппинг qualified-строки из RPC. Раскрывает цену и поставщика. */
const mapQualifiedRow = (row: QualifiedOfferRow, categoryById: Map<string, CategoryRow>): SeafoodOffer => {
  const category = row.category_id ? categoryById.get(row.category_id) : undefined;
  const supplierCountry = row.supplier_country_code
    ? (COUNTRY_NAME[row.supplier_country_code] ?? row.supplier_country_code)
    : "";
  return {
    id: row.id,
    productName: row.product_name,
    species: row.species ?? "",
    latinName: row.latin_name ?? "",
    origin: COUNTRY_NAME[row.origin_country_code] ?? row.origin_country_code,
    originFlag: row.origin_flag ?? "",
    supplierName: row.supplier_company_name ?? REDACTED_SUPPLIER,
    isVerified: row.supplier_verification_status === "verified",
    priceRange: formatPriceRange(row.price_min, row.price_max, row.price_currency, row.price_unit, row.price_range_label),
    priceUnit: `per ${row.price_unit}`,
    moq: row.moq_label ?? (row.moq_value != null ? `MOQ: ${row.moq_value} ${row.moq_unit ?? "kg"}` : "MOQ on request"),
    freshness: row.freshness ?? "",
    image: row.image ?? "/placeholder.svg",
    images: row.image_list?.length ? row.image_list : (row.image ? [row.image] : []),
    gallery: safeArr(row.gallery),
    category: category?.name ?? "Other",
    format: safeFormat(row.format),
    cutType: row.format_cut ?? "",
    packaging: row.packaging_label ?? row.packaging ?? "",
    certifications: row.certifications ?? [],
    photoSourceLabel: row.photo_source_label ?? "",
    sampleAvailable: !!row.sample_available,
    inspectionAvailable: !!row.inspection_available,
    traceability: row.traceability ?? undefined,
    priceMin: row.price_min ?? undefined,
    priceMax: row.price_max ?? undefined,
    currency: row.price_currency,
    priceUnitKey: "offers_priceUnit_perKg",
    moqValue: row.moq_value ?? undefined,
    moqUnitKey: "offers_qtyUnit_kg",
    supplier: {
      name: row.supplier_company_name ?? REDACTED_SUPPLIER,
      isVerified: row.supplier_verification_status === "verified",
      country: supplierCountry,
      countryFlag: row.supplier_country_flag ?? "",
      inBusinessSince: row.supplier_in_business_since ?? 0,
      responseTime: row.supplier_response_time ?? "",
      certifications: [],
      documentsReviewed: [],
      profileSlug: row.supplier_profile_slug ?? "",
    },
    specs: safeObj(row.specs) as SeafoodOffer["specs"],
    commercial: safeObj(row.commercial_terms) as SeafoodOffer["commercial"],
    deliveryBasisOptions: safeArr(row.delivery_basis_options),
    relatedArticles: safeArr(row.related_articles),
    volumeBreaks: safeArr(row.volume_breaks),
  } satisfies SeafoodOffer;
};

const fetchCategoryMap = async (categoryIds: string[]) => {
  const ids = categoryIds.length ? categoryIds : ["00000000-0000-0000-0000-000000000000"];
  const { data } = await supabase.from("categories").select("id,slug,name").in("id", ids);
  const map = new Map<string, CategoryRow>();
  for (const c of (data ?? []) as CategoryRow[]) map.set(c.id, c);
  return map;
};

export const fetchOffers = async (level: AccessLevel): Promise<SeafoodOffer[]> => {
  // Qualified — пробуем RPC. Если вернётся 0 (нет одобренных заявок), упадём на public.
  if (level === "qualified_unlocked") {
    const { data, error } = await supabase.rpc("get_qualified_offers");
    if (!error && Array.isArray(data) && data.length > 0) {
      const rows = data as unknown as QualifiedOfferRow[];
      const categoryIds = Array.from(new Set(rows.map((r) => r.category_id).filter(Boolean) as string[]));
      const categoryById = await fetchCategoryMap(categoryIds);
      return rows.map((r) => mapQualifiedRow(r, categoryById));
    }
    if (error) {
      logCatalogPrivilegeError({ operation: "get_qualified_offers", accessLevel: level, error });
      console.warn("[catalog-api] get_qualified_offers failed, falling back to public", error);
    }
  }
  // Anonymous / registered / qualified-без-доступа — публичный view.
  const { data, error } = await supabase
    .from("offers_public")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    logCatalogPrivilegeError({ operation: "fetchOffers", accessLevel: level, error });
    throw error;
  }
  const rows = (data ?? []) as unknown as OfferPublicRow[];
  const categoryIds = Array.from(new Set(rows.map((r) => r.category_id).filter(Boolean) as string[]));
  const categoryById = await fetchCategoryMap(categoryIds);
  return rows.map((r) => mapPublicRow(r, { categoryById }));
};

export const fetchOfferById = async (id: string, level: AccessLevel): Promise<SeafoodOffer | null> => {
  if (level === "qualified_unlocked") {
    const { data, error } = await supabase.rpc("get_qualified_offer", { p_offer_id: id });
    if (!error && Array.isArray(data) && data.length > 0) {
      const row = (data as unknown as QualifiedOfferRow[])[0];
      const categoryById = await fetchCategoryMap(row.category_id ? [row.category_id] : []);
      return mapQualifiedRow(row, categoryById);
    }
    if (error) console.warn("[catalog-api] get_qualified_offer failed, falling back to public", error);
  }
  const { data, error } = await supabase
    .from("offers_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as OfferPublicRow;
  const categoryById = await fetchCategoryMap(row.category_id ? [row.category_id] : []);
  return mapPublicRow(row, { categoryById });
};

// Утилита экспортируется для возможного использования в SupplierTrustPanel,
// если в будущем потребуется отдельный запрос обезличенного supplier-trust.
export type { SupplierPublicRow };
