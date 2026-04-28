// Edge function: seed-catalog
// Idempotently seeds categories, suppliers, offers from inline data.
// Admin-only: requires authenticated user with `admin` role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mockOffers } from "./data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COUNTRY_CODE: Record<string, string> = {
  Norway: "NO", Ecuador: "EC", Iceland: "IS", Philippines: "PH", Russia: "RU",
  Argentina: "AR", Peru: "PE", Vietnam: "VN", Turkey: "TR", Morocco: "MA",
  Bangladesh: "BD",
};

const CATEGORY_SLUG: Record<string, string> = {
  Salmon: "salmon",
  Shrimp: "shrimp",
  Whitefish: "whitefish",
  Tuna: "tuna",
  Crab: "crab",
  "Squid & Octopus": "squid-octopus",
  Squid: "squid-octopus",
  Shellfish: "shellfish",
  Surimi: "surimi",
};

const CATEGORIES = [
  { slug: "salmon", name: "Salmon" },
  { slug: "shrimp", name: "Shrimp" },
  { slug: "whitefish", name: "Whitefish" },
  { slug: "tuna", name: "Tuna" },
  { slug: "crab", name: "Crab" },
  { slug: "squid-octopus", name: "Squid & Octopus" },
  { slug: "shellfish", name: "Shellfish" },
  { slug: "surimi", name: "Surimi" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: accept either (a) admin-role JWT, or (b) X-Seed-Token equal to service-role key.
  const seedToken = req.headers.get("x-seed-token");
  let authorized = false;

  if (seedToken && seedToken === serviceKey) {
    authorized = true;
  } else {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await userClient.auth.getClaims(token);
      if (claims?.claims?.sub) {
        const adminCheck = createClient(supabaseUrl, serviceKey);
        const { data: roleRow } = await adminCheck
          .from("user_roles")
          .select("role")
          .eq("user_id", claims.claims.sub)
          .eq("role", "admin")
          .maybeSingle();
        if (roleRow) authorized = true;
      }
    }
  }

  if (!authorized) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: admin role or X-Seed-Token required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Categories
    const { error: catErr } = await admin
      .from("categories")
      .upsert(CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, sort_order: i })), {
        onConflict: "slug",
      });
    if (catErr) throw catErr;

    // 2. Suppliers (unique by profile_slug)
    const seenSuppliers = new Set<string>();
    const suppliersPayload: Record<string, unknown>[] = [];
    for (const o of mockOffers as any[]) {
      const s = o.supplier;
      if (seenSuppliers.has(s.profileSlug)) continue;
      seenSuppliers.add(s.profileSlug);
      suppliersPayload.push({
        company_name: s.name,
        country_code: COUNTRY_CODE[s.country] ?? "XX",
        country_flag: s.countryFlag,
        verification_status: s.isVerified ? "verified" : "unverified",
        certifications: s.certifications,
        in_business_since: s.inBusinessSince,
        response_time: s.responseTime,
        profile_slug: s.profileSlug,
        verification_scope: s.verificationScope,
        verification_date: s.verificationDate,
        documents_reviewed: s.documentsReviewed,
      });
    }
    const { error: supErr } = await admin
      .from("suppliers")
      .upsert(suppliersPayload, { onConflict: "profile_slug" });
    if (supErr) throw supErr;

    // 3. Map slug -> id
    const { data: supplierRows } = await admin.from("suppliers").select("id, profile_slug");
    const { data: categoryRows } = await admin.from("categories").select("id, slug");
    const supplierIdBySlug = new Map<string, string>(
      (supplierRows ?? []).map((r: any) => [r.profile_slug, r.id]),
    );
    const categoryIdBySlug = new Map<string, string>(
      (categoryRows ?? []).map((r: any) => [r.slug, r.id]),
    );

    // 4. Delete existing demo offers (stable UUIDs starting with 0000…000…)
    await admin
      .from("offers")
      .delete()
      .like("id", "00000000-0000-0000-0000-0000000000%");

    // 5. Insert offers
    const offersPayload = (mockOffers as any[]).map((o) => {
      const stableId = `00000000-0000-0000-0000-${String(Number(o.id)).padStart(12, "0")}`;
      const catSlug = CATEGORY_SLUG[o.category] ?? "shellfish";
      return {
        id: stableId,
        supplier_id: supplierIdBySlug.get(o.supplier.profileSlug),
        category_id: categoryIdBySlug.get(catSlug),
        product_name: o.productName,
        latin_name: o.latinName,
        species: o.species,
        origin_country_code: COUNTRY_CODE[o.origin] ?? "XX",
        origin_flag: o.originFlag,
        format: o.format,
        format_cut: o.cutType,
        packaging: o.packaging,
        packaging_label: o.packaging,
        certifications: o.certifications,
        price_min: o.priceMin ?? null,
        price_max: o.priceMax ?? null,
        price_currency: o.currency ?? "USD",
        price_unit: "kg",
        price_range_label: o.priceRange,
        moq_value: o.moqValue ?? null,
        moq_unit: "kg",
        moq_label: o.moq,
        freshness: o.freshness,
        image: o.image,
        image_list: o.images ?? [],
        gallery: o.gallery ?? [],
        delivery_basis_options: o.deliveryBasisOptions ?? [],
        volume_breaks: o.volumeBreaks ?? [],
        related_articles: o.relatedArticles ?? [],
        specs: o.specs ?? {},
        commercial_terms: o.commercial ?? {},
        traceability: o.traceability ?? null,
        sample_available: !!o.sampleAvailable,
        inspection_available: !!o.inspectionAvailable,
        photo_source_label: o.photoSourceLabel,
        status: "published",
        published_at: new Date().toISOString(),
        payment_terms: o.commercial?.paymentTerms ?? null,
        incoterms: o.commercial?.incoterm ?? null,
      };
    });

    const { error: offerErr } = await admin.from("offers").insert(offersPayload);
    if (offerErr) throw offerErr;

    return new Response(
      JSON.stringify({
        ok: true,
        categories: CATEGORIES.length,
        suppliers: suppliersPayload.length,
        offers: offersPayload.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("seed-catalog error", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
