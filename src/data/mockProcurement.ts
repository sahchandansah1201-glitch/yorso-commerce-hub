/**
 * Offer-specific procurement intelligence helpers.
 *
 * Internally backed by mock data. User-facing copy must use words like
 * "Preview", "Estimate", "Pending verification", "Supplier-provided" —
 * never expose internal naming such as "mock" in user-facing UI.
 *
 * Backend-readiness: each function mirrors a future endpoint shape
 * (`/offers/:id/price-detail`, `/offers/:id/relevant-news`,
 *  `/offers/:id/document-readiness`, `/offers/:id/landed-cost`).
 */
import type { SeafoodOffer } from "@/data/mockOffers";
import {
  countryNews,
  countryImpact,
  getPriceTrend,
  type CountryNewsItem,
  type CountryRole,
  type PriceTrend,
  type TrendDirection,
} from "@/data/mockIntelligence";
import type { AccessLevel } from "@/lib/access-level";

// ── Price detail ────────────────────────────────────────────────────────────

export interface OfferPriceDetail {
  /** Mid-point indicative price in offer currency, kg. */
  unitPrice: number;
  currency: string;
  /** Range floor/ceiling in offer currency, kg. */
  floor: number;
  ceiling: number;
  /** Origin/supplier-adjusted index for this specific offer (base 100). */
  contextIndex: number;
  /** Category-level index used as anchor. */
  categoryIndex: number;
  /** Movement vs category benchmark. */
  vsBenchmarkPct: number;
  d7: { dir: TrendDirection; pct: number };
  d30: { dir: TrendDirection; pct: number };
  d90: { dir: TrendDirection; pct: number };
  series: { label: string; index: number }[];
  /** ISO-like short label, e.g. "2 days ago". */
  lastUpdated: string;
  /** Internal data source label shown to qualified users only. */
  sourceLabel: string;
  /** Short procurement explanation derived from offer context. */
  explanation: string;
  /** Inputs that biased the offer-specific result. */
  contextFactors: string[];
}

const formatBias = (offer: SeafoodOffer): number => {
  // Different cuts/formats command different premiums.
  const cut = offer.cutType.toLowerCase();
  if (cut.includes("loin")) return 6;
  if (cut.includes("fillet")) return 4;
  if (cut.includes("steak")) return 2;
  if (cut.includes("hgt") || cut.includes("h&g")) return -3;
  if (cut.includes("hoso")) return -1;
  return 0;
};

const incotermBias = (offer: SeafoodOffer): number => {
  const i = offer.commercial.incoterm.toUpperCase();
  if (i === "DDP") return 7;
  if (i === "CIF" || i === "CFR") return 3;
  if (i === "FOB") return 0;
  if (i === "EXW") return -4;
  return 0;
};

const supplierCountryBias = (offer: SeafoodOffer): number => {
  // Reprocessing hubs typically discount, primary producers price closer to benchmark.
  if (offer.supplier.country === offer.origin) return 0;
  const reprocessingHubs = ["China", "Vietnam", "Thailand"];
  if (reprocessingHubs.includes(offer.supplier.country)) return -2;
  return 1;
};

const originContextBias = (offer: SeafoodOffer): { delta: number; note?: string } => {
  // Use category-level countryImpact to find a directional bias for the origin country.
  const impacts = countryImpact[offer.category] ?? [];
  const originImpact = impacts.find((c) => c.countryName === offer.origin);
  if (!originImpact) return { delta: 0 };
  // Higher origin-country impactPct → tighter supply-side premium.
  const delta = Math.round(originImpact.impactPct / 12);
  return {
    delta,
    note: originImpact.reason,
  };
};

export const getOfferPriceDetail = (offer: SeafoodOffer): OfferPriceDetail => {
  const trend = getPriceTrend(offer.category) as PriceTrend | null;
  const categoryIndex = trend?.currentIndex ?? 100;
  const fmt = formatBias(offer);
  const inc = incotermBias(offer);
  const sup = supplierCountryBias(offer);
  const origin = originContextBias(offer);
  const totalDelta = fmt + inc + sup + origin.delta;
  const contextIndex = Math.max(60, categoryIndex + totalDelta);
  const vsBenchmarkPct = ((contextIndex - categoryIndex) / categoryIndex) * 100;

  const hasNumeric =
    typeof offer.priceMin === "number" && typeof offer.priceMax === "number";
  const floor = hasNumeric ? offer.priceMin! : 0;
  const ceiling = hasNumeric ? offer.priceMax! : 0;
  const unitPrice = hasNumeric ? (floor + ceiling) / 2 : 0;

  // Adjust trend deltas slightly so each offer shows differentiated movement.
  const adjust = (base: { dir: TrendDirection; pct: number }) => {
    const sign = base.dir === "down" ? -1 : base.dir === "up" ? 1 : 0;
    const adjustedPct = base.pct + sign * (totalDelta / 40);
    const dir: TrendDirection =
      adjustedPct > 0.3 ? "up" : adjustedPct < -0.3 ? "down" : "flat";
    return { dir, pct: Number(adjustedPct.toFixed(1)) };
  };

  const series =
    trend?.series.map((p) => ({
      ...p,
      index: Math.max(60, p.index + totalDelta),
    })) ?? [];

  const factors: string[] = [];
  if (fmt !== 0) factors.push(`${offer.cutType.split(",")[0]}`);
  if (inc !== 0) factors.push(offer.commercial.incoterm);
  if (sup !== 0) factors.push(`${offer.supplier.country} processing`);
  if (origin.delta !== 0 && origin.note) factors.push(origin.note);

  const explanationParts: string[] = [];
  if (origin.note) explanationParts.push(origin.note);
  if (trend?.explanation) explanationParts.push(trend.explanation);

  return {
    unitPrice,
    currency: offer.currency ?? "USD",
    floor,
    ceiling,
    contextIndex,
    categoryIndex,
    vsBenchmarkPct: Number(vsBenchmarkPct.toFixed(1)),
    d7: adjust(trend?.d7 ?? { dir: "flat", pct: 0 }),
    d30: adjust(trend?.d30 ?? { dir: "flat", pct: 0 }),
    d90: adjust(trend?.d90 ?? { dir: "flat", pct: 0 }),
    series,
    lastUpdated: "Updated 2 days ago",
    sourceLabel: "Aggregated wholesale benchmarks · supplier-provided",
    explanation: explanationParts.join(" "),
    contextFactors: factors,
  };
};

// ── Offer-relevant news ─────────────────────────────────────────────────────

export type NewsRelevanceReason =
  | "affects_price"
  | "affects_availability"
  | "affects_logistics"
  | "affects_compliance"
  | "affects_supplier_risk";

export interface OfferRelevantNews extends CountryNewsItem {
  /** Why this country/news is relevant to the selected offer. */
  role: CountryRole;
  reason: NewsRelevanceReason;
}

const tagToReason = (
  tags: CountryNewsItem["tags"],
  role: CountryRole,
): NewsRelevanceReason => {
  if (tags.includes("regulation")) {
    return role === "supplier_country"
      ? "affects_supplier_risk"
      : "affects_compliance";
  }
  if (tags.includes("logistics")) return "affects_logistics";
  if (tags.includes("seasonality")) return "affects_availability";
  if (tags.includes("export")) return "affects_availability";
  return "affects_price";
};

/**
 * Returns news scoped to the selected offer, ordered by role priority:
 * supplier_country > origin_country > export_port > competing_producer > demand_driver.
 * Falls back to category-only news only if no contextual news exists.
 */
export const getOfferRelevantNews = (offer: SeafoodOffer): OfferRelevantNews[] => {
  const impacts = countryImpact[offer.category] ?? [];
  const roleByCountry = new Map<string, CountryRole>();

  // Direct mapping from offer context.
  roleByCountry.set(offer.supplier.country, "supplier_country");
  if (offer.origin && !roleByCountry.has(offer.origin)) {
    roleByCountry.set(offer.origin, "origin_country");
  }
  // Plus competitor/demand-driver/export-port from category impact.
  for (const imp of impacts) {
    if (!roleByCountry.has(imp.countryName)) {
      roleByCountry.set(imp.countryName, imp.role);
    }
  }

  const rolePriority: Record<CountryRole, number> = {
    supplier_country: 0,
    origin_country: 1,
    export_port: 2,
    competing_producer: 3,
    demand_driver: 4,
  };

  const items: OfferRelevantNews[] = countryNews
    .filter(
      (n) =>
        n.category === offer.category && roleByCountry.has(n.countryName),
    )
    .map((n) => {
      const role = roleByCountry.get(n.countryName)!;
      return { ...n, role, reason: tagToReason(n.tags, role) };
    })
    .sort(
      (a, b) =>
        rolePriority[a.role] - rolePriority[b.role] ||
        a.publishedAt.localeCompare(b.publishedAt),
    );

  return items;
};

// ── Document readiness ──────────────────────────────────────────────────────

export type DocumentStatus = "verified" | "pending" | "supplier_provided";

export interface DocumentReadinessItem {
  key:
    | "health"
    | "haccp"
    | "catch"
    | "cert"
    | "packing"
    | "traceability";
  status: DocumentStatus;
}

export const getDocumentReadiness = (offer: SeafoodOffer): DocumentReadinessItem[] => {
  const certs = offer.certifications ?? [];
  const hasHaccp = certs.some((c) => c.toUpperCase().includes("HACCP"));
  const hasSustain = certs.some((c) =>
    ["MSC", "ASC", "BAP", "GLOBALG.A.P", "GLOBALGAP"].some((k) =>
      c.toUpperCase().includes(k),
    ),
  );
  const isWild = offer.specs.catchingMethod.toLowerCase().includes("wild");
  return [
    { key: "health", status: offer.supplier.isVerified ? "verified" : "supplier_provided" },
    { key: "haccp", status: hasHaccp ? "verified" : "pending" },
    {
      key: "catch",
      status: isWild ? (offer.supplier.isVerified ? "verified" : "supplier_provided") : "verified",
    },
    { key: "cert", status: hasSustain ? "verified" : certs.length > 0 ? "supplier_provided" : "pending" },
    { key: "packing", status: "supplier_provided" },
    { key: "traceability", status: offer.traceability ? "supplier_provided" : "pending" },
  ];
};

// ── Supplier risk/trust summary ─────────────────────────────────────────────

export interface SupplierRiskSummary {
  verification: "verified" | "pending";
  responseTime: string;
  inBusinessSince: number;
  documentReadinessPct: number;
  countryRisk: "low" | "medium" | "elevated";
  activity: "active" | "moderate" | "quiet";
}

const COUNTRY_RISK: Record<string, "low" | "medium" | "elevated"> = {
  Norway: "low",
  Iceland: "low",
  "Faroe Islands": "low",
  Chile: "low",
  Spain: "low",
  Japan: "low",
  Ecuador: "medium",
  India: "medium",
  Vietnam: "medium",
  Indonesia: "medium",
  Philippines: "medium",
  Argentina: "medium",
  Morocco: "medium",
  Mauritania: "medium",
  China: "medium",
  Russia: "elevated",
};

export const getSupplierRisk = (offer: SeafoodOffer): SupplierRiskSummary => {
  const docs = getDocumentReadiness(offer);
  const ready = docs.filter((d) => d.status !== "pending").length;
  return {
    verification: offer.supplier.isVerified ? "verified" : "pending",
    responseTime: offer.supplier.responseTime,
    inBusinessSince: offer.supplier.inBusinessSince,
    documentReadinessPct: Math.round((ready / docs.length) * 100),
    countryRisk: COUNTRY_RISK[offer.supplier.country] ?? "medium",
    activity:
      offer.commercial.stockStatus === "In Stock"
        ? "active"
        : offer.commercial.stockStatus === "Limited"
          ? "moderate"
          : "quiet",
  };
};

// ── Landed cost estimate ────────────────────────────────────────────────────

export interface LandedCostEstimate {
  currency: string;
  /** Per-kg components — all numeric, all marked as Estimate in UI. */
  unitPrice: number;
  freight: number;
  insurance: number;
  duty: number;
  handling: number;
  /** Sum per kg. */
  totalPerKg: number;
  /** Lower / upper bounds reflecting price range and freight variability. */
  rangeLow: number;
  rangeHigh: number;
  /** True when access level allows numeric breakdown. */
  numericVisible: boolean;
}

const FREIGHT_BY_BASIS: Record<string, number> = {
  EXW: 0.95,
  FOB: 0.7,
  CFR: 0.35,
  CIF: 0.25,
  DDP: 0.0,
};

export const getLandedCostEstimate = (
  offer: SeafoodOffer,
  level: AccessLevel,
): LandedCostEstimate => {
  const detail = getOfferPriceDetail(offer);
  const incoterm = offer.commercial.incoterm.toUpperCase();
  const freight = FREIGHT_BY_BASIS[incoterm] ?? 0.4;
  const insurance = freight > 0 ? 0.05 : 0;
  // Duty placeholder by category — frontend-only.
  const duty = offer.category === "Crab" ? 0.6 : offer.category === "Salmon" ? 0.25 : 0.35;
  const handling = 0.12;
  const numericVisible = level === "qualified_unlocked";
  const unitPrice = detail.unitPrice;
  const totalPerKg = unitPrice + freight + insurance + duty + handling;
  const variance = 0.15;
  return {
    currency: detail.currency,
    unitPrice,
    freight,
    insurance,
    duty,
    handling,
    totalPerKg,
    rangeLow: detail.floor + freight + insurance + duty + handling,
    rangeHigh: detail.ceiling + freight + insurance + duty + handling + variance,
    numericVisible,
  };
};
