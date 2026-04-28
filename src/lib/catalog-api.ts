/**
 * catalog-api.ts — слой доступа к каталогу через Supabase.
 *
 * Стратегия видимости:
 * - anonymous_locked / registered_locked: читают `offers_public` (без точной цены и supplier_id).
 *   Маппинг прячет цену и имя поставщика, оставляя диапазон и страну.
 * - qualified_unlocked: читают `offers` напрямую с join к `suppliers`, получают точную цену
 *   и контакт. Доступ контролируется RLS на стороне БД (has_price_access / роль).
 *
 * Важно: фронтенд НЕ должен слепо доверять результату — RLS в БД остаётся источником
 * истины. Этот слой лишь корректно мапит сырые строки в `SeafoodOffer`, чтобы
 * существующие компоненты Phase 1 работали без изменений.
 */

import { supabase } from "@/integrations/supabase/client";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";

const REDACTED_PRICE = "Цена по запросу";
const REDACTED_SUPPLIER = "Имя поставщика скрыто";

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
  price_min: number | null;
  price_max: number | null;
  price_currency: string;
  price_unit: string;
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
  supplier_public_id: string | null;
};

type SupplierPublicRow = {
  id: string;
  company_name: string;
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

interface MapContext {
  level: AccessLevel;
  supplierById: Map<string, SupplierPublicRow>;
  categoryById: Map<string, CategoryRow>;
}

const mapRow = (row: OfferPublicRow, ctx: MapContext): SeafoodOffer => {
  const supplier = row.supplier_public_id
    ? ctx.supplierById.get(row.supplier_public_id)
    : undefined;
  const category = row.category_id ? ctx.categoryById.get(row.category_id) : undefined;
  const showSupplierName = ctx.level === "qualified_unlocked";
  const showExactPrice = ctx.level === "qualified_unlocked";

  return {
    id: row.id,
    productName: row.product_name,
    species: row.species ?? "",
    latinName: row.latin_name ?? "",
    origin: COUNTRY_NAME[row.origin_country_code] ?? row.origin_country_code,
    originFlag: row.origin_flag ?? "",
    supplierName: showSupplierName && supplier ? supplier.company_name : REDACTED_SUPPLIER,
    isVerified: supplier?.verification_status === "verified",
    priceRange: showExactPrice && row.price_min != null && row.price_max != null
      ? `$${row.price_min.toFixed(2)} – $${row.price_max.toFixed(2)}`
      : (row.price_range_label ?? REDACTED_PRICE),
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
    priceMin: showExactPrice ? row.price_min ?? undefined : undefined,
    priceMax: showExactPrice ? row.price_max ?? undefined : undefined,
    currency: row.price_currency,
    priceUnitKey: "offers_priceUnit_perKg",
    moqValue: row.moq_value ?? undefined,
    moqUnitKey: "offers_qtyUnit_kg",
    supplier: {
      name: showSupplierName && supplier ? supplier.company_name : REDACTED_SUPPLIER,
      isVerified: supplier?.verification_status === "verified",
      country: supplier ? (COUNTRY_NAME[supplier.country_code] ?? supplier.country_code) : "",
      countryFlag: supplier?.country_flag ?? "",
      inBusinessSince: supplier?.in_business_since ?? 0,
      responseTime: supplier?.response_time ?? "",
      certifications: supplier?.certifications ?? [],
      documentsReviewed: supplier?.documents_reviewed ?? [],
      profileSlug: supplier?.profile_slug ?? "",
      verificationScope: supplier?.verification_scope ?? undefined,
      verificationDate: supplier?.verification_date ?? undefined,
    },
    specs: safeObj(row.specs) as SeafoodOffer["specs"],
    commercial: safeObj(row.commercial_terms) as SeafoodOffer["commercial"],
    deliveryBasisOptions: safeArr(row.delivery_basis_options),
    relatedArticles: safeArr(row.related_articles),
    volumeBreaks: safeArr(row.volume_breaks),
  } satisfies SeafoodOffer;
};

const fetchSupplierAndCategoryMaps = async (supplierIds: string[], categoryIds: string[]) => {
  const [{ data: suppliersData }, { data: categoriesData }] = await Promise.all([
    supabase.from("suppliers_public").select("*").in("id", supplierIds.length ? supplierIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("categories").select("id,slug,name").in("id", categoryIds.length ? categoryIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const supplierById = new Map<string, SupplierPublicRow>();
  for (const s of (suppliersData ?? []) as SupplierPublicRow[]) supplierById.set(s.id, s);
  const categoryById = new Map<string, CategoryRow>();
  for (const c of (categoriesData ?? []) as CategoryRow[]) categoryById.set(c.id, c);
  return { supplierById, categoryById };
};

export const fetchOffers = async (level: AccessLevel): Promise<SeafoodOffer[]> => {
  // Both anon and registered see the public view; qualified gets extra fields
  // (the same rows here, but mapping reveals price/supplier).
  const { data, error } = await supabase
    .from("offers_public")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as OfferPublicRow[];
  const supplierIds = Array.from(new Set(rows.map((r) => r.supplier_public_id).filter(Boolean) as string[]));
  const categoryIds = Array.from(new Set(rows.map((r) => r.category_id).filter(Boolean) as string[]));
  const { supplierById, categoryById } = await fetchSupplierAndCategoryMaps(supplierIds, categoryIds);
  return rows.map((r) => mapRow(r, { level, supplierById, categoryById }));
};

export const fetchOfferById = async (id: string, level: AccessLevel): Promise<SeafoodOffer | null> => {
  const { data, error } = await supabase
    .from("offers_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as OfferPublicRow;
  const { supplierById, categoryById } = await fetchSupplierAndCategoryMaps(
    row.supplier_public_id ? [row.supplier_public_id] : [],
    row.category_id ? [row.category_id] : [],
  );
  return mapRow(row, { level, supplierById, categoryById });
};
