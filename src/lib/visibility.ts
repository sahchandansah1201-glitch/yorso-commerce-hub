// ─── Controlled-Access Visibility Helpers (Phase 0) ─────────────
// Pure functions that derive anonymous, guest-safe representations
// of commercially sensitive supplier data. No exact identity, no
// exact price, no exact MOQ leak through these helpers.

import type { SeafoodOffer } from "@/data/mockOffers";

export type AvailabilityTier = "container" | "pallet" | "limited";

/**
 * Derive abstract availability tier from the mock offer.
 * Heuristic only — replace with explicit field on SeafoodOffer
 * when the data model is enriched (see follow-up B7).
 */
export function getAvailabilityTier(offer: SeafoodOffer): AvailabilityTier {
  const status = offer.commercial?.stockStatus;
  const vol = (offer.commercial?.availableVolume || "").toLowerCase();

  if (status === "Limited" || /small|limited/.test(vol)) return "limited";
  if (/high|container|large/.test(vol)) return "container";
  return "pallet";
}

/**
 * Map a supplier country to a coarse trade region.
 * Conservative buckets — unknowns fall back to "International".
 */
export function getSupplierRegion(country: string | undefined): string {
  if (!country) return "International";
  const c = country.toLowerCase();
  const eu = [
    "norway", "iceland", "denmark", "netherlands", "spain", "portugal",
    "france", "germany", "italy", "poland", "sweden", "finland", "ireland",
    "united kingdom", "uk", "estonia", "lithuania", "latvia",
  ];
  const latam = ["ecuador", "chile", "peru", "argentina", "brazil", "mexico"];
  const apac = [
    "china", "vietnam", "thailand", "indonesia", "philippines", "india",
    "japan", "korea", "south korea", "malaysia", "bangladesh",
  ];
  const namerica = ["united states", "usa", "canada"];
  const mena = ["morocco", "egypt", "turkey", "tunisia"];
  const cis = ["russia", "kazakhstan", "ukraine", "belarus"];

  if (eu.includes(c)) return "EU";
  if (latam.includes(c)) return "LATAM";
  if (apac.includes(c)) return "APAC";
  if (namerica.includes(c)) return "North America";
  if (mena.includes(c)) return "MENA";
  if (cis.includes(c)) return "CIS";
  return "International";
}
