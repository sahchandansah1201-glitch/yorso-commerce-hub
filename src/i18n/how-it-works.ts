import { useLanguage } from "./LanguageContext";
import type { Language } from "./translations";

/**
 * Локализация страницы /how-it-works.
 * Вынесено в отдельный модуль, чтобы не раздувать общий translations.ts.
 * Все массивы (steps, capabilities, items, и т.д.) должны иметь одинаковую длину
 * во всех языках — порядок элементов задаёт визуальный порядок на странице.
 */

export interface HowItWorksDict {
  // SEO
  seo_title: string;
  seo_description: string;

  // Hero
  hero_eyebrow: string;
  hero_titlePrefix: string;
  hero_titleHighlight: string;
  hero_titleSuffix: string;
  hero_subtitle: string;
  hero_ctaFind: string;
  hero_ctaSupplier: string;
  hero_ctaScroll: string;
  hero_workflow_eyebrow: string;
  hero_workflow_caption: string;
  hero_workflow_step: string;
  hero_workflow_steps: string[]; // 6

  // Problem map
  problem_eyebrow: string;
  problem_title: string;
  problem_subtitle: string;
  problem_buyer_eyebrow: string;
  problem_buyer_title: string;
  problem_buyer_pains: string[]; // 6
  problem_supplier_eyebrow: string;
  problem_supplier_title: string;
  problem_supplier_pains: string[]; // 6

  // System map
  system_eyebrow: string;
  system_title: string;
  system_subtitle: string;
  system_layer: string;
  system_blocks: { title: string; body: string }[]; // 6
  system_chain: string[]; // 6

  // Buyer Journey
  bj_eyebrow: string;
  bj_title: string;
  bj_subtitle: string;
  bj_step: string;
  bj_buyerDoes: string;
  bj_yorsoProvides: string;
  bj_riskReduced: string;
  bj_example: string;
  bj_steps: { title: string; buyer: string; yorso: string; risk: string; example: string }[]; // 7

  // Procurement Decision Proof
  pdp_eyebrow: string;
  pdp_title: string;
  pdp_subtitle: string;
  pdp_fileEyebrow: string;
  pdp_fileTitle: string;
  pdp_decisionRecorded: string;
  pdp_exportable: string;
  pdp_priceBenchmark: string;
  pdp_belowAvg: string;
  pdp_low: string;
  pdp_avg: string;
  pdp_high: string;
  pdp_supplierEvidence: string;
  pdp_evidence: { label: string }[]; // 5
  pdp_evidenceFootnote: string;
  pdp_riskSummary: string;
  pdp_risks: { label: string; note: string }[]; // 4
  pdp_risk_stable: string;
  pdp_risk_low: string;
  pdp_risk_medium: string;
  pdp_state_verified: string;
  pdp_state_partial: string;
  pdp_offerComparison: string;
  pdp_th: { supplier: string; country: string; price: string; moq: string; lead: string; payment: string; incoterms: string };
  pdp_offers: { supplier: string; country: string; payment: string; incoterms: string }[]; // 3
  pdp_landedCost: string;
  pdp_landedCostRows: { label: string }[]; // 5
  pdp_landedFootnote: string;
  pdp_alternatives: string;
  pdp_alternativeItems: { label: string; reason: string }[]; // 3
  pdp_auditTrail: string;
  pdp_auditItems: { date: string; event: string }[]; // 6
  pdp_footerNote: string;
  pdp_exportPdf: string;

  // Supplier Journey
  sj_eyebrow: string;
  sj_title: string;
  sj_subtitle: string;
  sj_def_verified_label: string;
  sj_def_verified_body: string;
  sj_def_featured_label: string;
  sj_def_featured_body: string;
  sj_def_premium_label: string;
  sj_def_premium_body: string;
  sj_supplierDoes: string;
  sj_yorsoProvides: string;
  sj_outcome: string;
  sj_steps: { title: string; supplier: string; yorso: string; outcome: string; concept?: string }[]; // 7

  // Trust Stack
  ts_eyebrow: string;
  ts_title: string;
  ts_subtitle: string;
  ts_layer: string;
  ts_layers: { title: string; body: string; evidence: string }[]; // 8
  ts_state_verified: string;
  ts_state_missing: string;
  ts_state_promoted: string;
  ts_state_neutral: string;
  ts_legend_verified: string;
  ts_legend_missing: string;
  ts_legend_promoted: string;

  // Value Grids
  vg_eyebrow: string;
  vg_title: string;
  vg_subtitle: string;
  vg_buyer_eyebrow: string;
  vg_buyer_title: string;
  vg_buyer_count: string;
  vg_supplier_eyebrow: string;
  vg_supplier_title: string;
  vg_supplier_count: string;
  vg_buyer_items: { title: string; body: string }[]; // 9
  vg_supplier_items: { title: string; body: string; tagLabel?: string }[]; // 9
  vg_legend_verified: string;
  vg_legend_sponsored: string;
  vg_legend_premium: string;

  // Access Levels
  al_eyebrow: string;
  al_title: string;
  al_subtitle: string;
  al_reasons: { title: string; body: string }[]; // 5
  al_card_anonymous: { badge: string; title: string; body: string; bullets: string[] };
  al_card_registered: { badge: string; title: string; body: string; bullets: string[] };
  al_card_qualified: { badge: string; title: string; body: string; bullets: string[] };
  al_matrix_eyebrow: string;
  al_matrix_title: string;
  al_th_capability: string;
  al_th_anonymous: string;
  al_th_registered: string;
  al_th_qualified: string;
  al_capabilities: { label: string }[]; // 14
  al_legend_available: string;
  al_legend_request: string;
  al_legend_unavailable: string;
  al_cell_onRequest: string;

  // Business Outcomes
  bo_eyebrow: string;
  bo_title: string;
  bo_subtitle: string;
  bo_buyer_eyebrow: string;
  bo_buyer_title: string;
  bo_supplier_eyebrow: string;
  bo_supplier_title: string;
  bo_buyer_items: { title: string; body: string }[]; // 5
  bo_supplier_items: { title: string; body: string }[]; // 5
  bo_goals_eyebrow: string;
  bo_goals_title: string;
  bo_goals_subtitle: string;
  bo_goals: { label: string; body: string }[]; // 4

  // Final CTA
  fc_eyebrow: string;
  fc_title: string;
  fc_subtitle: string;
  fc_buyer_eyebrow: string;
  fc_buyer_title: string;
  fc_buyer_body: string;
  fc_buyer_bullets: string[]; // 3
  fc_buyer_cta1: string;
  fc_buyer_cta2: string;
  fc_supplier_eyebrow: string;
  fc_supplier_title: string;
  fc_supplier_body: string;
  fc_supplier_bullets: string[]; // 3
  fc_supplier_cta1: string;
  fc_supplier_cta2: string;
  fc_trustNote_label: string;
  fc_trustNote_body: string;
  fc_trustNote_proven: string;
  fc_trustNote_promoted: string;
  fc_trustNote_unconfirmed: string;
}

const en: HowItWorksDict = {
  seo_title: "How Yorso works — B2B seafood sourcing, verified suppliers, RFQ workflow",
  seo_description:
    "Yorso is a B2B seafood trade workflow: wholesale seafood sourcing, verified suppliers, RFQ and procurement comparison, price and market context, and a defensible procurement decision report.",

  hero_eyebrow: "How Yorso works",
  hero_titlePrefix: "Yorso turns seafood sourcing into a controlled ",
  hero_titleHighlight: "B2B trade workflow",
  hero_titleSuffix: ".",
  hero_subtitle:
    "Find seafood products and suppliers, request access, compare offers, verify evidence, and move from inquiry to a defensible procurement decision — inside one operating system built for B2B seafood trade.",
  hero_ctaFind: "Find seafood suppliers",
  hero_ctaSupplier: "Become a verified supplier",
  hero_ctaScroll: "See how it works ↓",
  hero_workflow_eyebrow: "End-to-end trade workflow",
  hero_workflow_caption: "Repeatable, evidence-based, documented",
  hero_workflow_step: "Step",
  hero_workflow_steps: [
    "Search",
    "Access request",
    "Supplier evidence",
    "RFQ / negotiation",
    "Order / documents",
    "Repeat trade",
  ],

  problem_eyebrow: "Problem map",
  problem_title: "Seafood trade fails in two predictable ways.",
  problem_subtitle:
    "Yorso is built around the two structural risks that decide every B2B seafood deal — a wrong purchasing decision on the buyer side, and invisible value on the supplier side.",
  problem_buyer_eyebrow: "Buyer side",
  problem_buyer_title: "For buyers, the risk is a wrong purchasing decision.",
  problem_buyer_pains: [
    "Prices scattered across WhatsApp, email, PDFs and outdated price lists.",
    "Supplier reliability is hard to verify before committing to a deal.",
    "Certificates, traceability, Incoterms, payment terms and documents are checked too late.",
    "Communication is fragmented across email, messengers, calls and spreadsheets.",
    "Landed cost is unclear without logistics, duties, delays and cold-chain risk.",
    "Procurement managers must justify supplier choice to owners, finance, logistics and quality teams.",
  ],
  problem_supplier_eyebrow: "Supplier side",
  problem_supplier_title: "For suppliers, the risk is invisible value and low-quality demand.",
  problem_supplier_pains: [
    "Qualified buyer demand is inconsistent and seasonal.",
    "Trade shows and cold outreach do not create year-round pipeline.",
    "Buyers do not trust claims without documents and verifiable evidence.",
    "Product content, certificates and supplier profiles become outdated quickly.",
    "Strong suppliers get lost in generic, undifferentiated listings.",
    "Sales teams do not know which products, countries and formats buyers are actively searching for.",
  ],

  system_eyebrow: "Yorso system map",
  system_title: "One connected operating system, not six disconnected tools.",
  system_subtitle:
    "Each block feeds the next. Catalog and demand drive matching; identity and pricing drive trust; orders and CRM turn a single deal into a repeatable trade relationship.",
  system_layer: "Layer",
  system_blocks: [
    { title: "Catalog & Supply Graph", body: "Products, species, origin, specs, availability and structured supplier profiles in one normalized graph." },
    { title: "Demand & Matching", body: "Buyer requests, RFQs, shortlists, substitutes and matching against live supplier capacity." },
    { title: "Identity & Trust", body: "Verification, documents, certificates and supplier evidence assembled into procurement-ready profiles." },
    { title: "Pricing & Market Signals", body: "Price history, country news, trend direction and benchmark context tied to the offer in front of you." },
    { title: "Orders & Logistics", body: "Order status, shipment risk and document/logistics support from confirmation to delivery." },
    { title: "CRM & Communication", body: "Structured communication, follow-up history and repeat-order workflows for ongoing trade." },
  ],
  system_chain: ["Catalog", "Matching", "Trust", "Pricing", "Orders", "CRM"],

  bj_eyebrow: "Buyer journey",
  bj_title: "From a sourcing question to a defensible procurement decision.",
  bj_subtitle:
    "Buyers do not just get a list of suppliers. They get enough information to make and defend a purchasing decision — internally, in front of finance, quality and leadership.",
  bj_step: "Step",
  bj_buyerDoes: "Buyer does",
  bj_yorsoProvides: "Yorso provides",
  bj_riskReduced: "Risk reduced",
  bj_example: "Example",
  bj_steps: [
    {
      title: "Search a product or post a request",
      buyer: "Looks for a specific species, format and origin — or posts a structured procurement request.",
      yorso: "Catalog with species, cut, origin, format, packaging and supplier filters. Optional buyer request to surface matching offers.",
      risk: "Supplier search no longer takes weeks of WhatsApp and email.",
      example: "Mackerel HGT 300–500 g, frozen, origin Norway/Faroe, CFR EU port.",
    },
    {
      title: "See available offers and market context",
      buyer: "Scans live offers with format, MOQ, lead time, supplier country, certifications and Incoterms.",
      yorso: "Offer rows with price range, market signals, news and benchmark context tied to the species and origin.",
      risk: "Exact market price stops being a black box.",
      example: "Salmon bellies, frozen, MOQ 5 t, FOB Chile vs CFR Rotterdam.",
    },
    {
      title: "Request access to exact price or supplier",
      buyer: "Creates a buyer account or requests price/supplier access without paying for catalog entry.",
      yorso: "Three-state access model: anonymous → registered → qualified. Supplier identity unlocks together with price.",
      risk: "No hard paywall — buyers qualify by intent, not by card on file.",
      example: "Squid loligo 100–300 g, IQF — request exact USD/kg and supplier identity.",
    },
    {
      title: "Compare suppliers, terms, documents and risk",
      buyer: "Selects 2–4 offers and compares price, MOQ, payment terms, lead time, documents and supplier evidence.",
      yorso: "Side-by-side comparison surface with document readiness, certification status and supplier country signals.",
      risk: "Reliability is evaluated before negotiation, not after.",
      example: "Yellowfin tuna loins vs saku — compare 3 suppliers across CFR/CIF.",
    },
    {
      title: "Send a structured RFQ or contact the supplier",
      buyer: "Sends an RFQ with quantity, packaging, delivery window and Incoterms, or opens direct communication.",
      yorso: "Structured RFQ form, message thread tied to the offer, follow-up history per supplier.",
      risk: "Communication stays attached to the deal, not lost across mailboxes.",
      example: "Vannamei shrimp 26/30, IQF, 24 t, CIF Algeciras, payment 30% advance.",
    },
    {
      title: "Build a decision-proof record for internal approval",
      buyer: "Assembles the procurement file: shortlist, comparison, supplier evidence, landed cost logic and rejected alternatives.",
      yorso: "Procurement Decision Proof: a structured, exportable record that travels with the deal.",
      risk: "Procurement managers can defend the choice to finance, quality and leadership.",
      example: "Pollock fillets PBO — defended choice across 4 shortlisted suppliers.",
    },
    {
      title: "Move into order, documents, logistics and repeat trade",
      buyer: "Confirms the order, tracks documents and shipment status, then repeats the trade in the next season.",
      yorso: "Order status, document/logistics support and CRM history that turns one deal into a recurring relationship.",
      risk: "Repeat purchasing stops starting from zero each season.",
      example: "King crab clusters — second season order with the same qualified supplier.",
    },
  ],

  pdp_eyebrow: "Procurement Decision Proof",
  pdp_title: "Enough evidence to defend the deal — internally.",
  pdp_subtitle:
    "Yorso assembles a structured record around every shortlisted offer: price benchmark, supplier evidence, comparison, landed cost logic, risk summary, alternatives considered and an audit trail. Illustrative example below.",
  pdp_fileEyebrow: "Procurement file · illustrative example",
  pdp_fileTitle: "Mackerel HGT, frozen, 300–500 g · Norway · CFR Rotterdam",
  pdp_decisionRecorded: "Decision recorded",
  pdp_exportable: "Exportable report",
  pdp_priceBenchmark: "Price benchmark",
  pdp_belowAvg: "below market average",
  pdp_low: "low",
  pdp_avg: "avg",
  pdp_high: "high",
  pdp_supplierEvidence: "Supplier evidence",
  pdp_evidence: [
    { label: "Company registration" },
    { label: "Export licence on file" },
    { label: "Plant approval number" },
    { label: "Certifications uploaded" },
    { label: "Trade history with platform" },
  ],
  pdp_evidenceFootnote: "Status reflects what the supplier has submitted — not a quality guarantee.",
  pdp_riskSummary: "Risk summary",
  pdp_risks: [
    { label: "Origin country signal", note: "No active trade alerts." },
    { label: "Cold-chain risk", note: "Direct reefer route, 14 d transit." },
    { label: "Payment terms", note: "30% advance — buyer exposure on prepayment." },
    { label: "Document readiness", note: "Health cert + CoO confirmed pre-shipment." },
  ],
  pdp_risk_stable: "stable",
  pdp_risk_low: "low",
  pdp_risk_medium: "medium",
  pdp_state_verified: "verified",
  pdp_state_partial: "partial",
  pdp_offerComparison: "Offer comparison",
  pdp_th: {
    supplier: "Supplier",
    country: "Country",
    price: "Price USD/kg",
    moq: "MOQ",
    lead: "Lead",
    payment: "Payment",
    incoterms: "Incoterms",
  },
  pdp_offers: [
    { supplier: "Supplier A", country: "Norway", payment: "30% adv / 70% CAD", incoterms: "CFR Rotterdam" },
    { supplier: "Supplier B", country: "Faroe Islands", payment: "Letter of credit", incoterms: "CFR Rotterdam" },
    { supplier: "Supplier C", country: "Iceland", payment: "30% adv / 70% CAD", incoterms: "CIF Rotterdam" },
  ],
  pdp_landedCost: "Landed cost logic",
  pdp_landedCostRows: [
    { label: "FOB / origin price" },
    { label: "Sea freight (est.)" },
    { label: "Insurance (est.)" },
    { label: "Duties & clearance (est.)" },
    { label: "Estimated landed cost" },
  ],
  pdp_landedFootnote: "Estimates only — confirmed against actual freight quote before order.",
  pdp_alternatives: "Alternatives considered",
  pdp_alternativeItems: [
    { label: "Supplier B (Faroe)", reason: "Longer lead time conflicts with promotional window." },
    { label: "Supplier C (Iceland)", reason: "Above benchmark price, lower MOQ not required this cycle." },
    { label: "Substitute: Atlantic herring", reason: "Different end-customer spec — kept on watchlist only." },
  ],
  pdp_auditTrail: "Audit trail",
  pdp_auditItems: [
    { date: "12 Mar", event: "Buyer request created — mackerel HGT 300–500 g, 24 t, CFR." },
    { date: "13 Mar", event: "5 offers received, 3 shortlisted." },
    { date: "14 Mar", event: "Access to exact price + supplier identity granted." },
    { date: "15 Mar", event: "Documents requested from 3 suppliers." },
    { date: "17 Mar", event: "Comparison + landed cost confirmed." },
    { date: "18 Mar", event: "Decision recorded — Supplier A selected." },
  ],
  pdp_footerNote: "Decision proof is buyer-controlled. Yorso structures the record — it does not approve the deal for you.",
  pdp_exportPdf: "Export as PDF for internal approval",

  sj_eyebrow: "Supplier journey",
  sj_title: "From a listed supplier to a year-round demand pipeline.",
  sj_subtitle:
    "Suppliers do not buy trust on Yorso. They build it through evidence, structured product content and consistent response quality. Premium visibility is presentation — not a verification shortcut.",
  sj_def_verified_label: "Verified",
  sj_def_verified_body: "Evidence-backed.",
  sj_def_featured_label: "Featured / Sponsored",
  sj_def_featured_body: "Paid visibility.",
  sj_def_premium_label: "Premium",
  sj_def_premium_body: "Stronger presentation & conversion support.",
  sj_supplierDoes: "Supplier does",
  sj_yorsoProvides: "Yorso provides",
  sj_outcome: "Outcome",
  sj_steps: [
    {
      title: "Create supplier profile and product listings",
      supplier: "Sets up the company profile and lists products with species, format, packaging, origin and capacity.",
      yorso: "Product Content Workspace with structured fields, draft state and reusable specifications across SKUs.",
      outcome: "Listings are searchable in the right categories from day one.",
      concept: "Product Content Workspace",
    },
    {
      title: "Add verification evidence and export readiness",
      supplier: "Uploads company registration, plant approval, export licence, certificates and reference documents.",
      yorso: "Verified Supplier Trust Pack — a structured evidence block. Verified means evidence-backed, not a quality guarantee.",
      outcome: "Buyers can pre-qualify the supplier before opening a conversation.",
      concept: "Verified Supplier Trust Pack",
    },
    {
      title: "Get visibility in relevant product and category searches",
      supplier: "Publishes the profile and exposes products to buyer search, filters and category pages.",
      yorso: "SEO Supplier Profile with structured product, origin and certification metadata for organic discovery.",
      outcome: "Inbound discovery instead of outbound cold outreach.",
      concept: "SEO Supplier Profile",
    },
    {
      title: "Receive qualified RFQs and buyer intent signals",
      supplier: "Reviews incoming requests filtered by category, country, volume and Incoterms relevance.",
      yorso: "Qualified RFQ inbox + Buyer Intent signals — what buyers are searching, requesting and shortlisting.",
      outcome: "Sales time spent on real demand, not on noise.",
      concept: "Qualified RFQ / Buyer Intent",
    },
    {
      title: "Respond with structured offer details",
      supplier: "Replies with price, MOQ, lead time, payment terms, Incoterms and document readiness in a standard format.",
      yorso: "Structured response template attached to the RFQ thread, comparable side-by-side by the buyer.",
      outcome: "Higher response-to-shortlist rate; fewer back-and-forth emails.",
    },
    {
      title: "Improve conversion with better trust and storytelling",
      supplier: "Strengthens product storytelling: origin story, plant photos, packaging detail, capacity narrative.",
      yorso: "Product storytelling fields and merchandising blocks. Optional Premium presentation upgrades layout and discovery emphasis.",
      outcome: "Better inquiry-to-shortlist conversion, especially for new buyers.",
      concept: "Premium Visibility · paid presentation, separate from verification",
    },
    {
      title: "Build repeat demand through CRM and analytics",
      supplier: "Follows up on past inquiries, tracks repeat buyers and reads which formats and countries are pulling demand.",
      yorso: "CRM thread per buyer, follow-up history and Buyer Intent Analytics on category, country and format demand.",
      outcome: "Year-round pipeline instead of season-only spikes.",
      concept: "Buyer Intent Analytics",
    },
  ],

  ts_eyebrow: "Trust stack",
  ts_title: "Trust on Yorso is a stack of evidence, not a badge.",
  ts_subtitle:
    "Each layer is shown honestly. Verified means evidence is on file. Missing items are labelled not provided yet. Paid placements are labelled promoted. Promoted suppliers are not safer — they are more visible.",
  ts_layer: "Layer",
  ts_layers: [
    { title: "Company identity", body: "Legal entity, registration country, plant approval number, export licence reference.", evidence: "Verified — registration document and plant approval on file." },
    { title: "Product specification", body: "Species (Latin name), format/cut, size grade, packaging, glaze, shelf life.", evidence: "Verified — supplier-declared spec with structured fields." },
    { title: "Origin & supplier country", body: "Catch / farm origin and the country the supplier ships from.", evidence: "Verified — origin declared per SKU; supplier country from registration." },
    { title: "Certificates & documents", body: "Health certificates, MSC/ASC where applicable, IUU compliance, lab tests.", evidence: "Not provided yet for this supplier — buyer can request before RFQ." },
    { title: "Incoterms, MOQ, payment, lead time", body: "Commercial terms attached to the offer, not buried in chat.", evidence: "Verified — declared per offer, comparable across suppliers." },
    { title: "Price history & market signals", body: "Indicative price range, trend direction, origin-country news context.", evidence: "Neutral — directional context, not a market data feed." },
    { title: "Supplier readiness & response quality", body: "Document readiness, average response time, RFQ completion rate.", evidence: "Verified — measured from on-platform behaviour over time." },
    { title: "Communication & order trail", body: "Structured RFQ thread, follow-up history, document exchange log.", evidence: "Verified — recorded inside the deal, exportable with the procurement file." },
  ],
  ts_state_verified: "Verified",
  ts_state_missing: "Not provided yet",
  ts_state_promoted: "Promoted",
  ts_state_neutral: "Context",
  ts_legend_verified: "Verified = evidence on file. Not a quality guarantee.",
  ts_legend_missing: "Not provided yet = missing item. Buyers can request it before RFQ.",
  ts_legend_promoted: "Promoted = paid visibility, separate from verification.",

  vg_eyebrow: "What Yorso provides",
  vg_title: "Balanced value for buyers and suppliers.",
  vg_subtitle:
    "Buyers get decision-grade evidence. Suppliers get qualified demand and a place to prove it. Verified, Sponsored and Premium are kept visually separate — paid placement is never sold as trust.",
  vg_buyer_eyebrow: "For buyers",
  vg_buyer_title: "Procurement-grade decisions, defended internally.",
  vg_buyer_count: "9 capabilities · evidence-led",
  vg_supplier_eyebrow: "For suppliers",
  vg_supplier_title: "Qualified demand, structured evidence, repeat trade.",
  vg_supplier_count: "9 capabilities · verification ≠ paid placement",
  vg_buyer_items: [
    { title: "Seafood product discovery", body: "Search by species, format, origin, certifications and supplier country." },
    { title: "Verified supplier evidence", body: "Registration, plant approval and certifications presented in a structured trust pack." },
    { title: "RFQ / request workflow", body: "Send a structured RFQ with quantity, packaging, Incoterms and delivery window." },
    { title: "Offer comparison", body: "Side-by-side comparison of price, MOQ, lead time, payment terms and documents." },
    { title: "Price and market context", body: "Indicative price range, trend direction and origin-country news tied to the offer." },
    { title: "Document readiness", body: "Visibility into which certificates and shipping documents are already on file." },
    { title: "Landed cost and logistics context", body: "Estimated freight, duties and cold-chain risk surfaced before commitment." },
    { title: "Team decision support", body: "Shared shortlist, comparison and notes for procurement, finance and quality teams." },
    { title: "Procurement decision report", body: "Exportable record of price benchmark, evidence, alternatives and audit trail." },
  ],
  vg_supplier_items: [
    { title: "Product and company profile", body: "Structured product content with species, format, packaging, capacity and origin." },
    { title: "Supplier verification & evidence blocks", body: "Registration, plant approval, export licence and certificates in a standard trust pack.", tagLabel: "Verified · evidence-backed" },
    { title: "SEO / profile visibility", body: "Indexed supplier profile and product pages tuned for organic B2B seafood search." },
    { title: "Qualified buyer requests", body: "RFQ inbox filtered by category, country, volume and Incoterms relevance." },
    { title: "Buyer intent signals", body: "What buyers are searching, requesting and shortlisting in your categories and origins." },
    { title: "Product storytelling & merchandising", body: "Origin story, plant photos and capacity narrative attached to listings." },
    { title: "Inquiry conversion support", body: "Structured offer responses, comparable to other shortlisted suppliers." },
    { title: "CRM, follow-up and repeat demand", body: "Per-buyer thread, follow-up history and repeat-order workflow." },
    { title: "Premium trust & visibility upgrade path", body: "Stronger presentation, merchandising emphasis and discovery placement. Visibility — not verification.", tagLabel: "Premium · paid presentation" },
  ],
  vg_legend_verified: "Verified — evidence on file. Not a quality guarantee.",
  vg_legend_sponsored: "Sponsored / Featured — paid visibility. Does not affect verification status.",
  vg_legend_premium: "Premium — stronger presentation and conversion support. Visibility, not trust.",

  al_eyebrow: "Access levels",
  al_title: "Access is gated for a reason — and value is visible before signup.",
  al_subtitle:
    "Yorso uses three honest access states. Anyone can see active marketplace proof and product context. Exact price and full supplier identity unlock together — never one without the other.",
  al_reasons: [
    { title: "Protect supplier-sensitive data", body: "Pricing and supplier identity are commercial assets — not free traffic." },
    { title: "Reduce low-intent price scraping", body: "Gating filters out automated extraction and tyre-kicking." },
    { title: "Improve buyer quality", body: "Real procurement intent is rewarded with deeper access and richer workflow." },
    { title: "Preserve marketplace trust", body: "Suppliers list more openly when they know who is looking and why." },
    { title: "Unlock more useful workflow", body: "Comparison, RFQ history, follow-up and decision proof grow with access level." },
  ],
  al_card_anonymous: {
    badge: "Anonymous",
    title: "See the marketplace before committing.",
    body: "Browse without an account. Real proof, no hard paywall.",
    bullets: [
      "Active marketplace proof",
      "Product & category examples",
      "Price ranges (exact price locked)",
      "Supplier stubs without full identity",
      "Request entry points",
    ],
  },
  al_card_registered: {
    badge: "Registered",
    title: "Save, compare, watch, request.",
    body: "Free buyer account unlocks the workspace, but exact price and supplier identity stay protected until access is requested.",
    bullets: [
      "Save, watchlist, follow suppliers",
      "Compare offers side-by-side",
      "Request access to exact price / supplier details",
      "Send structured RFQs",
      "Build a shortlist with your team",
    ],
  },
  al_card_qualified: {
    badge: "Qualified",
    title: "Full deal context, supplier identity included.",
    body: "Once price access is granted, supplier identity unlocks together with it — never separately.",
    bullets: [
      "Exact price visible",
      "Full supplier identity",
      "Richer supplier trust data",
      "Deeper intelligence & communication actions",
      "Export Procurement Decision Proof",
    ],
  },
  al_matrix_eyebrow: "Capability matrix",
  al_matrix_title: "What is available at each access level",
  al_th_capability: "Capability",
  al_th_anonymous: "Anonymous",
  al_th_registered: "Registered",
  al_th_qualified: "Qualified",
  al_capabilities: [
    { label: "Active marketplace proof" },
    { label: "Product & category examples" },
    { label: "Price ranges (locked exact price)" },
    { label: "Supplier stubs (no full identity)" },
    { label: "Request entry points" },
    { label: "Save, watchlist, follow suppliers" },
    { label: "Compare offers side-by-side" },
    { label: "Request price / supplier details" },
    { label: "Send structured RFQ" },
    { label: "Exact price visible" },
    { label: "Full supplier identity" },
    { label: "Richer supplier trust data" },
    { label: "Deeper intelligence & communication actions" },
    { label: "Procurement Decision Proof export" },
  ],
  al_legend_available: "available",
  al_legend_request: "on request — supplier identity unlocks with price",
  al_legend_unavailable: "not available",
  al_cell_onRequest: "on request",

  bo_eyebrow: "Business outcomes",
  bo_title: "Outcomes the workflow is built to produce.",
  bo_subtitle:
    "These are the operational outcomes Yorso is designed to deliver across a procurement cycle — not vanity metrics, not fabricated results, not guarantees.",
  bo_buyer_eyebrow: "For buyers",
  bo_buyer_title: "Less risk per purchasing decision.",
  bo_supplier_eyebrow: "For suppliers",
  bo_supplier_title: "More qualified demand, less noise.",
  bo_buyer_items: [
    { title: "Less time wasted on supplier search", body: "Inbound discovery and structured filters replace days of WhatsApp and PDF chasing." },
    { title: "Fewer unreliable supplier conversations", body: "Evidence-led shortlisting filters out suppliers who cannot back up their claims." },
    { title: "Better internal approval evidence", body: "A defensible procurement file: price benchmark, alternatives, audit trail." },
    { title: "Clearer price and landed cost context", body: "Indicative ranges, market signals and landed-cost logic — not a single quoted number." },
    { title: "Reduced document and logistics risk", body: "Document readiness, Incoterms and lead-time visibility before commitment." },
  ],
  bo_supplier_items: [
    { title: "More qualified inquiries", body: "RFQs filtered by category, country, volume and Incoterms relevance." },
    { title: "Stronger buyer confidence", body: "Verified evidence blocks help buyers pre-qualify before opening a conversation." },
    { title: "Better product presentation", body: "Structured product content, storytelling and merchandising in one workspace." },
    { title: "More useful visibility", body: "SEO supplier profile and category surfacing — visible to buyers actively searching." },
    { title: "Repeatable sales workflow", body: "CRM, follow-up history and intent analytics turn one deal into a recurring relationship." },
  ],
  bo_goals_eyebrow: "Design intents",
  bo_goals_title: "What this workflow is built to support",
  bo_goals_subtitle: "These are product goals — directional intents that guide design decisions, not published performance claims.",
  bo_goals: [
    { label: "Supports traffic growth", body: "Structured product, supplier and category content for organic B2B seafood search." },
    { label: "Supports registration conversion", body: "Value visible before signup; account unlocks workspace, not basic context." },
    { label: "Supports retention", body: "Workspace, CRM and decision proof reward repeat procurement cycles." },
    { label: "Supports trust growth", body: "Evidence-led trust stack with strict separation from paid placement." },
  ],

  fc_eyebrow: "Get started",
  fc_title: "Two clear paths into the workflow.",
  fc_subtitle: "Whether you are sourcing seafood or selling it, Yorso is the same operating system — entered from different sides.",
  fc_buyer_eyebrow: "For buyers",
  fc_buyer_title: "Source seafood with evidence, not guesswork.",
  fc_buyer_body: "Discover products and verified suppliers, request access to exact price and supplier identity, and build a defensible procurement file.",
  fc_buyer_bullets: [
    "Search by species, format, origin and certifications",
    "Compare offers and document readiness side-by-side",
    "Export a Procurement Decision Proof for internal approval",
  ],
  fc_buyer_cta1: "Find products and suppliers",
  fc_buyer_cta2: "Create a request",
  fc_supplier_eyebrow: "For suppliers",
  fc_supplier_title: "Reach qualified buyers with structured evidence.",
  fc_supplier_body: "Build a verified profile, expose products to organic B2B seafood search, and convert qualified RFQs with structured offer responses.",
  fc_supplier_bullets: [
    "Verified Supplier Trust Pack — evidence, not badges",
    "Qualified RFQ inbox with buyer intent signals",
    "Premium presentation upgrade path — visibility, not trust",
  ],
  fc_supplier_cta1: "Become a verified supplier",
  fc_supplier_cta2: "Show your products to qualified buyers",
  fc_trustNote_label: "Trust note",
  fc_trustNote_body: "Yorso separates verified evidence from paid visibility. Buyers see what is proven, what is promoted, and what still needs confirmation.",
  fc_trustNote_proven: "Verified · proven",
  fc_trustNote_promoted: "Promoted · paid visibility",
  fc_trustNote_unconfirmed: "Not provided yet · needs confirmation",
};

const ru: HowItWorksDict = {
  seo_title: "Как работает Yorso — B2B-закупки морепродуктов, проверенные поставщики, RFQ",
  seo_description:
    "Yorso — это рабочий процесс B2B-торговли морепродуктами: поиск оптовых поставщиков, проверка, RFQ и сравнение оферт, рыночный контекст цен и защищаемое решение по закупке.",

  hero_eyebrow: "Как работает Yorso",
  hero_titlePrefix: "Yorso превращает закупку морепродуктов в управляемый ",
  hero_titleHighlight: "B2B-процесс торговли",
  hero_titleSuffix: ".",
  hero_subtitle:
    "Находите продукты и поставщиков, запрашивайте доступ, сравнивайте оферты, проверяйте доказательства и переходите от запроса к защищаемому решению о закупке — внутри одной операционной системы для B2B-торговли морепродуктами.",
  hero_ctaFind: "Найти поставщиков морепродуктов",
  hero_ctaSupplier: "Стать проверенным поставщиком",
  hero_ctaScroll: "Как это работает ↓",
  hero_workflow_eyebrow: "Сквозной торговый процесс",
  hero_workflow_caption: "Повторяемый, доказательный, документированный",
  hero_workflow_step: "Шаг",
  hero_workflow_steps: [
    "Поиск",
    "Запрос доступа",
    "Доказательства поставщика",
    "RFQ / переговоры",
    "Заказ / документы",
    "Повторная сделка",
  ],

  problem_eyebrow: "Карта проблем",
  problem_title: "Торговля морепродуктами рушится двумя предсказуемыми способами.",
  problem_subtitle:
    "Yorso построен вокруг двух структурных рисков, которые определяют каждую B2B-сделку — неверное решение о закупке у покупателя и невидимая ценность у поставщика.",
  problem_buyer_eyebrow: "Сторона покупателя",
  problem_buyer_title: "Для покупателя риск — это неверное решение о закупке.",
  problem_buyer_pains: [
    "Цены разбросаны по WhatsApp, email, PDF и устаревшим прайс-листам.",
    "Надёжность поставщика трудно проверить до сделки.",
    "Сертификаты, прослеживаемость, Инкотермс, условия оплаты и документы проверяют слишком поздно.",
    "Коммуникация фрагментирована: почта, мессенджеры, звонки, таблицы.",
    "Полная стоимость доставки неясна без логистики, пошлин, задержек и риска холодовой цепи.",
    "Менеджеру по закупкам нужно обосновать выбор поставщика владельцам, финансам, логистике и качеству.",
  ],
  problem_supplier_eyebrow: "Сторона поставщика",
  problem_supplier_title: "Для поставщика риск — невидимая ценность и низкокачественный спрос.",
  problem_supplier_pains: [
    "Квалифицированный спрос покупателей нестабилен и сезонный.",
    "Выставки и холодные обзвоны не создают круглогодичный поток.",
    "Покупатели не доверяют заявлениям без документов и подтверждаемых доказательств.",
    "Контент по продуктам, сертификаты и профили поставщика быстро устаревают.",
    "Сильные поставщики теряются в обезличенных листингах.",
    "Отделы продаж не знают, какие продукты, страны и форматы покупатели реально ищут.",
  ],

  system_eyebrow: "Карта системы Yorso",
  system_title: "Одна связная операционная система, а не шесть разрозненных инструментов.",
  system_subtitle:
    "Каждый блок питает следующий. Каталог и спрос дают мэтчинг; идентичность и цены дают доверие; заказы и CRM превращают одну сделку в повторяющиеся отношения.",
  system_layer: "Слой",
  system_blocks: [
    { title: "Каталог и граф предложения", body: "Продукты, виды, происхождение, спецификации, доступность и структурированные профили поставщиков в едином графе." },
    { title: "Спрос и мэтчинг", body: "Запросы покупателей, RFQ, шорт-листы, замены и сопоставление с реальной мощностью поставщиков." },
    { title: "Идентичность и доверие", body: "Верификация, документы, сертификаты и доказательства поставщика, собранные в готовые к закупке профили." },
    { title: "Цены и рыночные сигналы", body: "История цен, новости стран, направление тренда и контекст бенчмарка, привязанные к конкретной оферте." },
    { title: "Заказы и логистика", body: "Статус заказа, риски доставки и поддержка по документам/логистике от подтверждения до поставки." },
    { title: "CRM и коммуникация", body: "Структурированная переписка, история фоллоу-апов и сценарии повторных заказов." },
  ],
  system_chain: ["Каталог", "Мэтчинг", "Доверие", "Цены", "Заказы", "CRM"],

  bj_eyebrow: "Путь покупателя",
  bj_title: "От вопроса о закупке до защищаемого решения о покупке.",
  bj_subtitle:
    "Покупатель получает не просто список поставщиков. Он получает достаточно информации, чтобы принять и защитить решение о закупке внутри компании — перед финансами, качеством и руководством.",
  bj_step: "Шаг",
  bj_buyerDoes: "Покупатель делает",
  bj_yorsoProvides: "Yorso даёт",
  bj_riskReduced: "Снижаемый риск",
  bj_example: "Пример",
  bj_steps: [
    {
      title: "Найти продукт или опубликовать запрос",
      buyer: "Ищет конкретный вид, формат и происхождение — или публикует структурированный запрос на закупку.",
      yorso: "Каталог с фильтрами по виду, разделке, происхождению, формату, упаковке и поставщику. Опционально — запрос покупателя для сбора подходящих оферт.",
      risk: "Поиск поставщика больше не занимает недели в WhatsApp и почте.",
      example: "Скумбрия HGT 300–500 г, заморозка, происхождение Норвегия/Фареры, CFR порт ЕС.",
    },
    {
      title: "Увидеть доступные оферты и рыночный контекст",
      buyer: "Просматривает живые оферты с форматом, MOQ, сроком поставки, страной поставщика, сертификациями и Инкотермс.",
      yorso: "Карточки оферт с диапазоном цен, рыночными сигналами, новостями и контекстом бенчмарка по виду и происхождению.",
      risk: "Реальная рыночная цена перестаёт быть «чёрным ящиком».",
      example: "Брюшки лосося, заморозка, MOQ 5 т, FOB Чили против CFR Роттердам.",
    },
    {
      title: "Запросить доступ к точной цене или поставщику",
      buyer: "Создаёт аккаунт покупателя или запрашивает доступ к цене/поставщику без оплаты входа в каталог.",
      yorso: "Трёхуровневая модель доступа: анонимный → зарегистрированный → квалифицированный. Личность поставщика открывается вместе с ценой.",
      risk: "Без жёсткого пэйволла — покупатели подтверждаются интенсивностью запроса, а не картой.",
      example: "Кальмар лолиго 100–300 г, IQF — запрос точной USD/кг и личности поставщика.",
    },
    {
      title: "Сравнить поставщиков, условия, документы и риски",
      buyer: "Выбирает 2–4 оферты и сравнивает цену, MOQ, условия оплаты, сроки, документы и доказательства поставщика.",
      yorso: "Сравнение бок о бок с готовностью документов, статусом сертификации и сигналами по стране поставщика.",
      risk: "Надёжность оценивается до переговоров, а не после.",
      example: "Лоины желтопёрого тунца против саку — сравнение 3 поставщиков по CFR/CIF.",
    },
    {
      title: "Отправить структурированный RFQ или связаться с поставщиком",
      buyer: "Отправляет RFQ с количеством, упаковкой, окном поставки и Инкотермс или открывает прямую коммуникацию.",
      yorso: "Структурированная форма RFQ, тред сообщений, привязанный к оферте, история фоллоу-апов по поставщику.",
      risk: "Коммуникация остаётся внутри сделки, а не теряется в почтовых ящиках.",
      example: "Креветка ваннамей 26/30, IQF, 24 т, CIF Альхесирас, оплата 30% аванс.",
    },
    {
      title: "Собрать доказательное досье для внутреннего согласования",
      buyer: "Собирает закупочное досье: шорт-лист, сравнение, доказательства поставщика, расчёт landed cost и отклонённые альтернативы.",
      yorso: "Procurement Decision Proof: структурированная экспортируемая запись, идущая со сделкой.",
      risk: "Закупщик может защитить выбор перед финансами, качеством и руководством.",
      example: "Филе минтая PBO — обоснованный выбор среди 4 шорт-листованных поставщиков.",
    },
    {
      title: "Перейти к заказу, документам, логистике и повторной сделке",
      buyer: "Подтверждает заказ, отслеживает документы и статус отгрузки, в следующем сезоне повторяет сделку.",
      yorso: "Статус заказа, поддержка по документам/логистике и история CRM, превращающая одну сделку в постоянные отношения.",
      risk: "Повторные закупки больше не начинаются с нуля каждый сезон.",
      example: "Клешни королевского краба — заказ во втором сезоне с тем же квалифицированным поставщиком.",
    },
  ],

  pdp_eyebrow: "Procurement Decision Proof",
  pdp_title: "Достаточно доказательств, чтобы защитить сделку — внутри компании.",
  pdp_subtitle:
    "Yorso собирает структурированную запись по каждой шорт-листованной оферте: бенчмарк цены, доказательства поставщика, сравнение, логика landed cost, сводка рисков, рассмотренные альтернативы и журнал событий. Ниже — иллюстративный пример.",
  pdp_fileEyebrow: "Закупочное досье · иллюстративный пример",
  pdp_fileTitle: "Скумбрия HGT, заморозка, 300–500 г · Норвегия · CFR Роттердам",
  pdp_decisionRecorded: "Решение зафиксировано",
  pdp_exportable: "Экспортируемый отчёт",
  pdp_priceBenchmark: "Бенчмарк цены",
  pdp_belowAvg: "ниже среднего по рынку",
  pdp_low: "мин",
  pdp_avg: "сред",
  pdp_high: "макс",
  pdp_supplierEvidence: "Доказательства поставщика",
  pdp_evidence: [
    { label: "Регистрация компании" },
    { label: "Экспортная лицензия в досье" },
    { label: "Номер одобрения предприятия" },
    { label: "Загруженные сертификаты" },
    { label: "История сделок на платформе" },
  ],
  pdp_evidenceFootnote: "Статус отражает то, что подал поставщик — это не гарантия качества.",
  pdp_riskSummary: "Сводка рисков",
  pdp_risks: [
    { label: "Сигнал по стране происхождения", note: "Активных торговых алертов нет." },
    { label: "Риск холодовой цепи", note: "Прямой рефрижераторный маршрут, 14 дней транзита." },
    { label: "Условия оплаты", note: "30% аванс — экспозиция покупателя на предоплате." },
    { label: "Готовность документов", note: "Health cert + CoO подтверждены до отгрузки." },
  ],
  pdp_risk_stable: "стабильно",
  pdp_risk_low: "низкий",
  pdp_risk_medium: "средний",
  pdp_state_verified: "подтверждено",
  pdp_state_partial: "частично",
  pdp_offerComparison: "Сравнение оферт",
  pdp_th: {
    supplier: "Поставщик",
    country: "Страна",
    price: "Цена USD/кг",
    moq: "MOQ",
    lead: "Срок",
    payment: "Оплата",
    incoterms: "Инкотермс",
  },
  pdp_offers: [
    { supplier: "Поставщик A", country: "Норвегия", payment: "30% ав. / 70% CAD", incoterms: "CFR Роттердам" },
    { supplier: "Поставщик B", country: "Фарерские о-ва", payment: "Аккредитив", incoterms: "CFR Роттердам" },
    { supplier: "Поставщик C", country: "Исландия", payment: "30% ав. / 70% CAD", incoterms: "CIF Роттердам" },
  ],
  pdp_landedCost: "Логика landed cost",
  pdp_landedCostRows: [
    { label: "FOB / цена в порту отгрузки" },
    { label: "Морской фрахт (оценка)" },
    { label: "Страховка (оценка)" },
    { label: "Пошлины и таможня (оценка)" },
    { label: "Расчётный landed cost" },
  ],
  pdp_landedFootnote: "Только оценки — подтверждаются реальной фрахтовой котировкой до заказа.",
  pdp_alternatives: "Рассмотренные альтернативы",
  pdp_alternativeItems: [
    { label: "Поставщик B (Фареры)", reason: "Более длинный срок поставки конфликтует с промо-окном." },
    { label: "Поставщик C (Исландия)", reason: "Цена выше бенчмарка, меньший MOQ в этом цикле не нужен." },
    { label: "Замена: атлантическая сельдь", reason: "Иная спецификация конечного клиента — оставлено в watchlist." },
  ],
  pdp_auditTrail: "Журнал событий",
  pdp_auditItems: [
    { date: "12 мар", event: "Создан запрос покупателя — скумбрия HGT 300–500 г, 24 т, CFR." },
    { date: "13 мар", event: "Получено 5 оферт, 3 в шорт-листе." },
    { date: "14 мар", event: "Предоставлен доступ к точной цене и личности поставщика." },
    { date: "15 мар", event: "Запрошены документы у 3 поставщиков." },
    { date: "17 мар", event: "Сравнение и landed cost подтверждены." },
    { date: "18 мар", event: "Решение зафиксировано — выбран Поставщик A." },
  ],
  pdp_footerNote: "Доказательное досье управляется покупателем. Yorso структурирует запись — он не одобряет сделку за вас.",
  pdp_exportPdf: "Экспортировать PDF для внутреннего согласования",

  sj_eyebrow: "Путь поставщика",
  sj_title: "От опубликованного поставщика к круглогодичному потоку спроса.",
  sj_subtitle:
    "На Yorso поставщики не покупают доверие. Они выстраивают его доказательствами, структурированным контентом и стабильным качеством ответов. Premium-видимость — это подача, а не короткий путь к верификации.",
  sj_def_verified_label: "Verified",
  sj_def_verified_body: "Подкреплено доказательствами.",
  sj_def_featured_label: "Featured / Sponsored",
  sj_def_featured_body: "Платная видимость.",
  sj_def_premium_label: "Premium",
  sj_def_premium_body: "Усиленная подача и поддержка конверсии.",
  sj_supplierDoes: "Поставщик делает",
  sj_yorsoProvides: "Yorso даёт",
  sj_outcome: "Результат",
  sj_steps: [
    {
      title: "Создать профиль поставщика и листинги продуктов",
      supplier: "Заполняет профиль компании и публикует продукты с видом, форматом, упаковкой, происхождением и мощностью.",
      yorso: "Product Content Workspace со структурированными полями, статусом черновика и переиспользуемыми спецификациями по SKU.",
      outcome: "Листинги ищутся в нужных категориях с первого дня.",
      concept: "Product Content Workspace",
    },
    {
      title: "Добавить доказательства верификации и экспортную готовность",
      supplier: "Загружает регистрацию компании, одобрение предприятия, экспортную лицензию, сертификаты и референс-документы.",
      yorso: "Verified Supplier Trust Pack — структурированный блок доказательств. Verified означает «подкреплено доказательствами», а не гарантия качества.",
      outcome: "Покупатели могут предварительно квалифицировать поставщика до начала диалога.",
      concept: "Verified Supplier Trust Pack",
    },
    {
      title: "Получить видимость в релевантных продуктовых и категорийных поисках",
      supplier: "Публикует профиль и выводит продукты в поиск, фильтры и категорийные страницы.",
      yorso: "SEO-профиль поставщика со структурированной мета-информацией о продукте, происхождении и сертификатах для органического поиска.",
      outcome: "Входящий поиск вместо холодного аутрича.",
      concept: "SEO Supplier Profile",
    },
    {
      title: "Получать квалифицированные RFQ и сигналы намерений покупателей",
      supplier: "Просматривает входящие запросы, отфильтрованные по категории, стране, объёму и Инкотермс.",
      yorso: "Инбокс квалифицированных RFQ + сигналы Buyer Intent — что покупатели ищут, запрашивают и шорт-листуют.",
      outcome: "Время продаж тратится на реальный спрос, а не на шум.",
      concept: "Qualified RFQ / Buyer Intent",
    },
    {
      title: "Отвечать структурированными деталями оферты",
      supplier: "Отвечает с ценой, MOQ, сроком, условиями оплаты, Инкотермс и готовностью документов в стандартном формате.",
      yorso: "Шаблон структурированного ответа в треде RFQ, сравнимый бок о бок покупателем.",
      outcome: "Выше доля «ответ → шорт-лист»; меньше переписки.",
    },
    {
      title: "Повышать конверсию через доверие и сторителлинг",
      supplier: "Усиливает сторителлинг продукта: история происхождения, фото предприятия, детали упаковки, нарратив о мощности.",
      yorso: "Поля сторителлинга и мерчандайзинговые блоки. Опциональный Premium усиливает раскладку и приоритет в выдаче.",
      outcome: "Выше конверсия «запрос → шорт-лист», особенно у новых покупателей.",
      concept: "Premium Visibility · платная подача, отдельно от верификации",
    },
    {
      title: "Выстраивать повторный спрос через CRM и аналитику",
      supplier: "Делает фоллоу-апы по прошлым запросам, отслеживает повторных покупателей и читает, какие форматы и страны тянут спрос.",
      yorso: "CRM-тред по покупателю, история фоллоу-апов и Buyer Intent Analytics по категории, стране и формату.",
      outcome: "Круглогодичный поток вместо сезонных всплесков.",
      concept: "Buyer Intent Analytics",
    },
  ],

  ts_eyebrow: "Стек доверия",
  ts_title: "Доверие на Yorso — это стек доказательств, а не бейдж.",
  ts_subtitle:
    "Каждый слой показан честно. Verified означает, что доказательства в досье. Отсутствующие пункты помечены «ещё не предоставлено». Платные размещения помечены «promoted». Promoted-поставщики не безопаснее — они виднее.",
  ts_layer: "Слой",
  ts_layers: [
    { title: "Идентичность компании", body: "Юр. лицо, страна регистрации, номер одобрения предприятия, ссылка на экспортную лицензию.", evidence: "Verified — регистрационный документ и одобрение предприятия в досье." },
    { title: "Спецификация продукта", body: "Вид (латинское название), формат/разделка, размер, упаковка, глазурь, срок годности.", evidence: "Verified — спецификация заявлена поставщиком в структурированных полях." },
    { title: "Происхождение и страна поставщика", body: "Происхождение вылова/фермы и страна отгрузки.", evidence: "Verified — происхождение указано по SKU; страна поставщика из регистрации." },
    { title: "Сертификаты и документы", body: "Health-сертификаты, MSC/ASC при применимости, IUU compliance, лабораторные анализы.", evidence: "Ещё не предоставлено для этого поставщика — покупатель может запросить до RFQ." },
    { title: "Инкотермс, MOQ, оплата, срок", body: "Коммерческие условия привязаны к оферте, а не закопаны в чате.", evidence: "Verified — заявлено по оферте, сравнимо между поставщиками." },
    { title: "История цен и рыночные сигналы", body: "Индикативный диапазон цен, направление тренда, новостной контекст по стране происхождения.", evidence: "Нейтральный — направленный контекст, не маркет-фид." },
    { title: "Готовность поставщика и качество ответов", body: "Готовность документов, среднее время ответа, доля закрытых RFQ.", evidence: "Verified — измерено по поведению на платформе во времени." },
    { title: "Коммуникация и след сделки", body: "Структурированный тред RFQ, история фоллоу-апов, лог обмена документами.", evidence: "Verified — записано внутри сделки, экспортируется вместе с закупочным досье." },
  ],
  ts_state_verified: "Verified",
  ts_state_missing: "Ещё не предоставлено",
  ts_state_promoted: "Promoted",
  ts_state_neutral: "Контекст",
  ts_legend_verified: "Verified = доказательства в досье. Не гарантия качества.",
  ts_legend_missing: "Ещё не предоставлено = пункт отсутствует. Покупатель может запросить до RFQ.",
  ts_legend_promoted: "Promoted = платная видимость, отдельно от верификации.",

  vg_eyebrow: "Что даёт Yorso",
  vg_title: "Сбалансированная ценность для покупателей и поставщиков.",
  vg_subtitle:
    "Покупатели получают доказательства уровня закупки. Поставщики получают квалифицированный спрос и место, где это доказать. Verified, Sponsored и Premium визуально разделены — платное размещение никогда не продаётся как доверие.",
  vg_buyer_eyebrow: "Для покупателей",
  vg_buyer_title: "Решения уровня закупки, защищаемые внутри компании.",
  vg_buyer_count: "9 возможностей · по доказательствам",
  vg_supplier_eyebrow: "Для поставщиков",
  vg_supplier_title: "Квалифицированный спрос, структурированные доказательства, повторные сделки.",
  vg_supplier_count: "9 возможностей · верификация ≠ платное размещение",
  vg_buyer_items: [
    { title: "Поиск продуктов морепродуктов", body: "Поиск по виду, формату, происхождению, сертификатам и стране поставщика." },
    { title: "Доказательства проверенного поставщика", body: "Регистрация, одобрение предприятия и сертификаты в структурированном Trust Pack." },
    { title: "Поток RFQ / запросов", body: "Отправка структурированного RFQ с количеством, упаковкой, Инкотермс и окном поставки." },
    { title: "Сравнение оферт", body: "Сравнение бок о бок: цена, MOQ, срок, условия оплаты и документы." },
    { title: "Цены и рыночный контекст", body: "Индикативный диапазон цен, направление тренда и новости по стране, привязанные к оферте." },
    { title: "Готовность документов", body: "Видимость, какие сертификаты и отгрузочные документы уже в досье." },
    { title: "Landed cost и логистика", body: "Оценка фрахта, пошлин и риска холодовой цепи до коммитмента." },
    { title: "Поддержка решения команды", body: "Общий шорт-лист, сравнение и заметки для закупки, финансов и качества." },
    { title: "Отчёт о решении по закупке", body: "Экспортируемая запись бенчмарка цены, доказательств, альтернатив и журнала." },
  ],
  vg_supplier_items: [
    { title: "Профиль продукта и компании", body: "Структурированный контент с видом, форматом, упаковкой, мощностью и происхождением." },
    { title: "Верификация и блоки доказательств поставщика", body: "Регистрация, одобрение предприятия, экспортная лицензия и сертификаты в стандартном Trust Pack.", tagLabel: "Verified · по доказательствам" },
    { title: "SEO / видимость профиля", body: "Индексируемый профиль поставщика и страницы продуктов под органический B2B-поиск." },
    { title: "Квалифицированные запросы покупателей", body: "Инбокс RFQ, отфильтрованный по категории, стране, объёму и Инкотермс." },
    { title: "Сигналы намерений покупателей", body: "Что покупатели ищут, запрашивают и шорт-листуют в ваших категориях и происхождениях." },
    { title: "Сторителлинг продукта и мерчандайзинг", body: "История происхождения, фото предприятия и нарратив о мощности, привязанные к листингам." },
    { title: "Поддержка конверсии запросов", body: "Структурированные ответы на оферты, сравнимые с другими шорт-листованными поставщиками." },
    { title: "CRM, фоллоу-ап и повторный спрос", body: "Тред по покупателю, история фоллоу-апов и сценарий повторного заказа." },
    { title: "Premium — путь усиления доверия и видимости", body: "Усиленная подача, мерчандайзинг и приоритет в выдаче. Видимость — не верификация.", tagLabel: "Premium · платная подача" },
  ],
  vg_legend_verified: "Verified — доказательства в досье. Не гарантия качества.",
  vg_legend_sponsored: "Sponsored / Featured — платная видимость. Не влияет на статус верификации.",
  vg_legend_premium: "Premium — усиленная подача и поддержка конверсии. Видимость, не доверие.",

  al_eyebrow: "Уровни доступа",
  al_title: "Доступ ограничен по причине — а ценность видна до регистрации.",
  al_subtitle:
    "Yorso использует три честных состояния доступа. Любой видит подтверждение активности маркетплейса и продуктовый контекст. Точная цена и полная личность поставщика открываются вместе — никогда одно без другого.",
  al_reasons: [
    { title: "Защита чувствительных данных поставщика", body: "Цены и личность поставщика — коммерческий актив, а не бесплатный трафик." },
    { title: "Снижение скрейпа цен низкоинтентной аудиторией", body: "Гейтинг отсекает автоматический парсинг и «прицельный туризм»." },
    { title: "Повышение качества покупателей", body: "Реальное намерение закупки вознаграждается более глубоким доступом и рабочим процессом." },
    { title: "Сохранение доверия маркетплейса", body: "Поставщики раскрываются охотнее, когда понимают, кто и зачем смотрит." },
    { title: "Раскрытие более полезного workflow", body: "Сравнение, история RFQ, фоллоу-апы и доказательства решения растут с уровнем доступа." },
  ],
  al_card_anonymous: {
    badge: "Анонимный",
    title: "Увидеть маркетплейс до коммитмента.",
    body: "Просмотр без аккаунта. Реальные доказательства, без жёсткого пэйволла.",
    bullets: [
      "Активное подтверждение маркетплейса",
      "Примеры продуктов и категорий",
      "Диапазоны цен (точная цена скрыта)",
      "Заглушки поставщиков без полной личности",
      "Точки входа в запрос",
    ],
  },
  al_card_registered: {
    badge: "Зарегистрированный",
    title: "Сохранять, сравнивать, отслеживать, запрашивать.",
    body: "Бесплатный аккаунт покупателя открывает рабочее пространство, но точная цена и личность поставщика остаются защищёнными до запроса доступа.",
    bullets: [
      "Сохранение, watchlist, подписка на поставщиков",
      "Сравнение оферт бок о бок",
      "Запрос доступа к точной цене / поставщику",
      "Отправка структурированных RFQ",
      "Шорт-лист с командой",
    ],
  },
  al_card_qualified: {
    badge: "Квалифицированный",
    title: "Полный контекст сделки, включая личность поставщика.",
    body: "Когда доступ к цене предоставлен, личность поставщика открывается вместе с ним — никогда отдельно.",
    bullets: [
      "Точная цена видна",
      "Полная личность поставщика",
      "Расширенные данные о доверии",
      "Глубокая аналитика и действия коммуникации",
      "Экспорт Procurement Decision Proof",
    ],
  },
  al_matrix_eyebrow: "Матрица возможностей",
  al_matrix_title: "Что доступно на каждом уровне доступа",
  al_th_capability: "Возможность",
  al_th_anonymous: "Анонимный",
  al_th_registered: "Зарегистрированный",
  al_th_qualified: "Квалифицированный",
  al_capabilities: [
    { label: "Активное подтверждение маркетплейса" },
    { label: "Примеры продуктов и категорий" },
    { label: "Диапазоны цен (точная цена скрыта)" },
    { label: "Заглушки поставщиков (без полной личности)" },
    { label: "Точки входа в запрос" },
    { label: "Сохранение, watchlist, подписка на поставщиков" },
    { label: "Сравнение оферт бок о бок" },
    { label: "Запрос цены / данных поставщика" },
    { label: "Отправка структурированного RFQ" },
    { label: "Точная цена видна" },
    { label: "Полная личность поставщика" },
    { label: "Расширенные данные о доверии" },
    { label: "Глубокая аналитика и действия коммуникации" },
    { label: "Экспорт Procurement Decision Proof" },
  ],
  al_legend_available: "доступно",
  al_legend_request: "по запросу — личность поставщика открывается вместе с ценой",
  al_legend_unavailable: "недоступно",
  al_cell_onRequest: "по запросу",

  bo_eyebrow: "Бизнес-результаты",
  bo_title: "Результаты, которые рабочий процесс должен давать.",
  bo_subtitle:
    "Это операционные результаты, которые Yorso спроектирован обеспечивать в рамках цикла закупки — не «vanity»-метрики, не выдуманные результаты, не гарантии.",
  bo_buyer_eyebrow: "Для покупателей",
  bo_buyer_title: "Меньше риска на каждое решение о закупке.",
  bo_supplier_eyebrow: "Для поставщиков",
  bo_supplier_title: "Больше квалифицированного спроса, меньше шума.",
  bo_buyer_items: [
    { title: "Меньше времени на поиск поставщиков", body: "Входящий поиск и структурированные фильтры заменяют дни в WhatsApp и PDF." },
    { title: "Меньше ненадёжных диалогов с поставщиками", body: "Шорт-лист по доказательствам отсекает тех, кто не может их подтвердить." },
    { title: "Лучше доказательства для внутреннего согласования", body: "Защищаемое закупочное досье: бенчмарк цены, альтернативы, журнал." },
    { title: "Яснее цена и landed cost", body: "Индикативные диапазоны, рыночные сигналы и логика landed cost — а не одно число." },
    { title: "Меньше документного и логистического риска", body: "Видимость готовности документов, Инкотермс и сроков до коммитмента." },
  ],
  bo_supplier_items: [
    { title: "Больше квалифицированных запросов", body: "RFQ отфильтрованы по категории, стране, объёму и Инкотермс." },
    { title: "Сильнее доверие покупателей", body: "Блоки верифицированных доказательств помогают покупателю предварительно квалифицировать до диалога." },
    { title: "Лучше подача продукта", body: "Структурированный контент, сторителлинг и мерчандайзинг в одном пространстве." },
    { title: "Полезнее видимость", body: "SEO-профиль и категорийная выдача — видимы покупателям, которые активно ищут." },
    { title: "Повторяемый процесс продаж", body: "CRM, история фоллоу-апов и аналитика намерений превращают сделку в постоянные отношения." },
  ],
  bo_goals_eyebrow: "Дизайн-намерения",
  bo_goals_title: "Что этот workflow призван поддерживать",
  bo_goals_subtitle: "Это продуктовые цели — направленные намерения, ведущие дизайн-решения, а не публикуемые показатели.",
  bo_goals: [
    { label: "Поддерживает рост трафика", body: "Структурированный контент по продуктам, поставщикам и категориям под органический B2B-поиск." },
    { label: "Поддерживает конверсию регистрации", body: "Ценность видна до регистрации; аккаунт открывает рабочее пространство, а не базовый контекст." },
    { label: "Поддерживает удержание", body: "Рабочее пространство, CRM и доказательства решения вознаграждают повторные циклы закупки." },
    { label: "Поддерживает рост доверия", body: "Стек доверия по доказательствам со строгим разделением от платного размещения." },
  ],

  fc_eyebrow: "Начать работу",
  fc_title: "Два понятных пути в рабочий процесс.",
  fc_subtitle: "Закупаете ли вы морепродукты или продаёте — Yorso это одна и та же операционная система, входы только разные.",
  fc_buyer_eyebrow: "Для покупателей",
  fc_buyer_title: "Закупайте морепродукты по доказательствам, а не наугад.",
  fc_buyer_body: "Находите продукты и проверенных поставщиков, запрашивайте доступ к точной цене и личности поставщика и собирайте защищаемое закупочное досье.",
  fc_buyer_bullets: [
    "Поиск по виду, формату, происхождению и сертификатам",
    "Сравнение оферт и готовности документов бок о бок",
    "Экспорт Procurement Decision Proof для внутреннего согласования",
  ],
  fc_buyer_cta1: "Найти продукты и поставщиков",
  fc_buyer_cta2: "Создать запрос",
  fc_supplier_eyebrow: "Для поставщиков",
  fc_supplier_title: "Доходите до квалифицированных покупателей со структурированными доказательствами.",
  fc_supplier_body: "Соберите верифицированный профиль, выводите продукты в органический B2B-поиск и конвертируйте квалифицированные RFQ структурированными ответами.",
  fc_supplier_bullets: [
    "Verified Supplier Trust Pack — доказательства, а не бейджи",
    "Инбокс квалифицированных RFQ с сигналами намерений покупателей",
    "Premium — путь усиления подачи, видимость, не доверие",
  ],
  fc_supplier_cta1: "Стать проверенным поставщиком",
  fc_supplier_cta2: "Показать продукты квалифицированным покупателям",
  fc_trustNote_label: "О доверии",
  fc_trustNote_body: "Yorso разделяет верифицированные доказательства и платную видимость. Покупатели видят, что подтверждено, что продвигается и что ещё нуждается в подтверждении.",
  fc_trustNote_proven: "Verified · подтверждено",
  fc_trustNote_promoted: "Promoted · платная видимость",
  fc_trustNote_unconfirmed: "Ещё не предоставлено · нужно подтверждение",
};

const es: HowItWorksDict = {
  seo_title: "Cómo funciona Yorso — abastecimiento B2B de pescado y marisco, proveedores verificados, RFQ",
  seo_description:
    "Yorso es un flujo de trabajo de comercio B2B de pescado y marisco: abastecimiento mayorista, proveedores verificados, RFQ y comparación de compras, contexto de precios y mercado, y un informe defensible de decisión.",

  hero_eyebrow: "Cómo funciona Yorso",
  hero_titlePrefix: "Yorso convierte el abastecimiento de pescado y marisco en un ",
  hero_titleHighlight: "flujo controlado de comercio B2B",
  hero_titleSuffix: ".",
  hero_subtitle:
    "Encuentre productos y proveedores, solicite acceso, compare ofertas, verifique evidencia y pase de la consulta a una decisión de compra defensible — dentro de un solo sistema operativo para el comercio B2B de pescado y marisco.",
  hero_ctaFind: "Encontrar proveedores",
  hero_ctaSupplier: "Convertirse en proveedor verificado",
  hero_ctaScroll: "Vea cómo funciona ↓",
  hero_workflow_eyebrow: "Flujo de comercio integral",
  hero_workflow_caption: "Repetible, basado en evidencia, documentado",
  hero_workflow_step: "Paso",
  hero_workflow_steps: [
    "Búsqueda",
    "Solicitud de acceso",
    "Evidencia del proveedor",
    "RFQ / negociación",
    "Pedido / documentos",
    "Comercio recurrente",
  ],

  problem_eyebrow: "Mapa de problemas",
  problem_title: "El comercio de pescado y marisco falla de dos maneras predecibles.",
  problem_subtitle:
    "Yorso se construye en torno a los dos riesgos estructurales que deciden cada operación B2B — una decisión de compra equivocada en el lado del comprador y un valor invisible en el lado del proveedor.",
  problem_buyer_eyebrow: "Lado del comprador",
  problem_buyer_title: "Para los compradores, el riesgo es una decisión de compra equivocada.",
  problem_buyer_pains: [
    "Precios dispersos entre WhatsApp, email, PDFs y listas desactualizadas.",
    "Difícil verificar la fiabilidad del proveedor antes de cerrar un trato.",
    "Certificados, trazabilidad, Incoterms, condiciones de pago y documentos se revisan demasiado tarde.",
    "Comunicación fragmentada entre email, mensajería, llamadas y hojas de cálculo.",
    "El coste de entrega final no está claro sin logística, aranceles, retrasos y riesgo de cadena de frío.",
    "Los responsables de compras deben justificar la elección del proveedor ante propietarios, finanzas, logística y calidad.",
  ],
  problem_supplier_eyebrow: "Lado del proveedor",
  problem_supplier_title: "Para los proveedores, el riesgo es valor invisible y demanda de baja calidad.",
  problem_supplier_pains: [
    "La demanda cualificada del comprador es inconsistente y estacional.",
    "Ferias y outreach en frío no generan flujo durante todo el año.",
    "Los compradores no confían en afirmaciones sin documentos y evidencia verificable.",
    "El contenido de producto, certificados y perfiles del proveedor se desactualizan rápido.",
    "Los proveedores fuertes se pierden en listados genéricos.",
    "Los equipos de ventas no saben qué productos, países y formatos buscan los compradores.",
  ],

  system_eyebrow: "Mapa del sistema Yorso",
  system_title: "Un sistema operativo conectado, no seis herramientas dispersas.",
  system_subtitle:
    "Cada bloque alimenta al siguiente. Catálogo y demanda impulsan el matching; identidad y precios impulsan la confianza; pedidos y CRM convierten una operación en una relación recurrente.",
  system_layer: "Capa",
  system_blocks: [
    { title: "Catálogo y grafo de oferta", body: "Productos, especies, origen, especificaciones, disponibilidad y perfiles estructurados de proveedores en un grafo único." },
    { title: "Demanda y matching", body: "Solicitudes del comprador, RFQ, shortlists, sustitutos y emparejamiento con la capacidad real del proveedor." },
    { title: "Identidad y confianza", body: "Verificación, documentos, certificados y evidencia del proveedor en perfiles listos para compra." },
    { title: "Precios y señales de mercado", body: "Histórico de precios, noticias por país, dirección de tendencia y contexto de benchmark vinculado a la oferta." },
    { title: "Pedidos y logística", body: "Estado del pedido, riesgo de envío y soporte documental/logístico desde la confirmación hasta la entrega." },
    { title: "CRM y comunicación", body: "Comunicación estructurada, historial de seguimiento y flujos de pedidos recurrentes." },
  ],
  system_chain: ["Catálogo", "Matching", "Confianza", "Precios", "Pedidos", "CRM"],

  bj_eyebrow: "Recorrido del comprador",
  bj_title: "De una pregunta de abastecimiento a una decisión de compra defensible.",
  bj_subtitle:
    "Los compradores no obtienen sólo una lista de proveedores. Obtienen información suficiente para tomar y defender una decisión de compra — internamente, ante finanzas, calidad y dirección.",
  bj_step: "Paso",
  bj_buyerDoes: "El comprador hace",
  bj_yorsoProvides: "Yorso aporta",
  bj_riskReduced: "Riesgo reducido",
  bj_example: "Ejemplo",
  bj_steps: [
    {
      title: "Buscar un producto o publicar una solicitud",
      buyer: "Busca una especie, formato y origen específicos — o publica una solicitud estructurada de compra.",
      yorso: "Catálogo con filtros por especie, corte, origen, formato, embalaje y proveedor. Solicitud opcional para hacer aflorar ofertas coincidentes.",
      risk: "La búsqueda de proveedor deja de tomar semanas en WhatsApp y email.",
      example: "Caballa HGT 300–500 g, congelada, origen Noruega/Feroe, CFR puerto UE.",
    },
    {
      title: "Ver ofertas disponibles y contexto de mercado",
      buyer: "Examina ofertas en vivo con formato, MOQ, plazo, país del proveedor, certificaciones e Incoterms.",
      yorso: "Filas de ofertas con rango de precio, señales de mercado, noticias y contexto de benchmark vinculado a la especie y origen.",
      risk: "El precio real de mercado deja de ser una caja negra.",
      example: "Vientres de salmón, congelados, MOQ 5 t, FOB Chile vs CFR Rotterdam.",
    },
    {
      title: "Solicitar acceso al precio exacto o al proveedor",
      buyer: "Crea una cuenta de comprador o solicita acceso a precio/proveedor sin pagar por entrar al catálogo.",
      yorso: "Modelo de acceso de tres estados: anónimo → registrado → cualificado. La identidad del proveedor se desbloquea junto con el precio.",
      risk: "Sin paywall duro — los compradores se cualifican por intención, no por tarjeta.",
      example: "Calamar loligo 100–300 g, IQF — solicitar USD/kg exacto e identidad del proveedor.",
    },
    {
      title: "Comparar proveedores, condiciones, documentos y riesgo",
      buyer: "Selecciona 2–4 ofertas y compara precio, MOQ, condiciones de pago, plazo, documentos y evidencia del proveedor.",
      yorso: "Superficie de comparación lado a lado con preparación documental, estado de certificación y señales del país del proveedor.",
      risk: "La fiabilidad se evalúa antes de la negociación, no después.",
      example: "Lomos de atún yellowfin vs saku — comparación de 3 proveedores en CFR/CIF.",
    },
    {
      title: "Enviar un RFQ estructurado o contactar al proveedor",
      buyer: "Envía un RFQ con cantidad, embalaje, ventana de entrega e Incoterms, o abre comunicación directa.",
      yorso: "Formulario RFQ estructurado, hilo de mensajes vinculado a la oferta, historial de seguimiento por proveedor.",
      risk: "La comunicación queda dentro del trato, no se pierde entre buzones.",
      example: "Camarón vannamei 26/30, IQF, 24 t, CIF Algeciras, pago 30% adelantado.",
    },
    {
      title: "Construir un expediente de decisión para aprobación interna",
      buyer: "Reúne el expediente de compra: shortlist, comparación, evidencia del proveedor, lógica de landed cost y alternativas descartadas.",
      yorso: "Procurement Decision Proof: registro estructurado y exportable que acompaña al trato.",
      risk: "Compras puede defender la elección ante finanzas, calidad y dirección.",
      example: "Filetes de abadejo PBO — elección defendida frente a 4 proveedores preseleccionados.",
    },
    {
      title: "Pasar al pedido, documentos, logística y comercio recurrente",
      buyer: "Confirma el pedido, sigue documentos y estado del envío y repite la operación en la próxima temporada.",
      yorso: "Estado de pedido, soporte documental/logístico e historial CRM que convierten un trato en una relación recurrente.",
      risk: "Las compras recurrentes dejan de empezar de cero cada temporada.",
      example: "Patas de cangrejo real — pedido de segunda temporada con el mismo proveedor cualificado.",
    },
  ],

  pdp_eyebrow: "Procurement Decision Proof",
  pdp_title: "Suficiente evidencia para defender el trato — internamente.",
  pdp_subtitle:
    "Yorso ensambla un registro estructurado en torno a cada oferta preseleccionada: benchmark de precio, evidencia del proveedor, comparación, lógica de landed cost, resumen de riesgos, alternativas y registro de auditoría. Ejemplo ilustrativo.",
  pdp_fileEyebrow: "Expediente de compra · ejemplo ilustrativo",
  pdp_fileTitle: "Caballa HGT, congelada, 300–500 g · Noruega · CFR Rotterdam",
  pdp_decisionRecorded: "Decisión registrada",
  pdp_exportable: "Informe exportable",
  pdp_priceBenchmark: "Benchmark de precio",
  pdp_belowAvg: "por debajo del promedio del mercado",
  pdp_low: "mín",
  pdp_avg: "med",
  pdp_high: "máx",
  pdp_supplierEvidence: "Evidencia del proveedor",
  pdp_evidence: [
    { label: "Registro de la empresa" },
    { label: "Licencia de exportación en archivo" },
    { label: "Número de aprobación de planta" },
    { label: "Certificaciones cargadas" },
    { label: "Historial comercial en la plataforma" },
  ],
  pdp_evidenceFootnote: "El estado refleja lo que el proveedor ha presentado — no es una garantía de calidad.",
  pdp_riskSummary: "Resumen de riesgos",
  pdp_risks: [
    { label: "Señal del país de origen", note: "Sin alertas comerciales activas." },
    { label: "Riesgo de cadena de frío", note: "Ruta refrigerada directa, 14 d de tránsito." },
    { label: "Condiciones de pago", note: "30% adelantado — exposición del comprador en prepago." },
    { label: "Preparación documental", note: "Health cert + CoO confirmados antes del envío." },
  ],
  pdp_risk_stable: "estable",
  pdp_risk_low: "bajo",
  pdp_risk_medium: "medio",
  pdp_state_verified: "verificado",
  pdp_state_partial: "parcial",
  pdp_offerComparison: "Comparación de ofertas",
  pdp_th: {
    supplier: "Proveedor",
    country: "País",
    price: "Precio USD/kg",
    moq: "MOQ",
    lead: "Plazo",
    payment: "Pago",
    incoterms: "Incoterms",
  },
  pdp_offers: [
    { supplier: "Proveedor A", country: "Noruega", payment: "30% ad. / 70% CAD", incoterms: "CFR Rotterdam" },
    { supplier: "Proveedor B", country: "Islas Feroe", payment: "Carta de crédito", incoterms: "CFR Rotterdam" },
    { supplier: "Proveedor C", country: "Islandia", payment: "30% ad. / 70% CAD", incoterms: "CIF Rotterdam" },
  ],
  pdp_landedCost: "Lógica de landed cost",
  pdp_landedCostRows: [
    { label: "FOB / precio en origen" },
    { label: "Flete marítimo (est.)" },
    { label: "Seguro (est.)" },
    { label: "Aranceles y despacho (est.)" },
    { label: "Landed cost estimado" },
  ],
  pdp_landedFootnote: "Solo estimaciones — confirmadas con la cotización real de flete antes del pedido.",
  pdp_alternatives: "Alternativas consideradas",
  pdp_alternativeItems: [
    { label: "Proveedor B (Feroe)", reason: "Plazo más largo entra en conflicto con la ventana promocional." },
    { label: "Proveedor C (Islandia)", reason: "Precio sobre benchmark, MOQ menor no necesario en este ciclo." },
    { label: "Sustituto: arenque atlántico", reason: "Especificación distinta del cliente final — sólo en watchlist." },
  ],
  pdp_auditTrail: "Registro de auditoría",
  pdp_auditItems: [
    { date: "12 mar", event: "Solicitud de comprador creada — caballa HGT 300–500 g, 24 t, CFR." },
    { date: "13 mar", event: "5 ofertas recibidas, 3 preseleccionadas." },
    { date: "14 mar", event: "Acceso a precio exacto e identidad del proveedor concedido." },
    { date: "15 mar", event: "Documentos solicitados a 3 proveedores." },
    { date: "17 mar", event: "Comparación y landed cost confirmados." },
    { date: "18 mar", event: "Decisión registrada — Proveedor A seleccionado." },
  ],
  pdp_footerNote: "El expediente de decisión lo controla el comprador. Yorso estructura el registro — no aprueba el trato por usted.",
  pdp_exportPdf: "Exportar a PDF para aprobación interna",

  sj_eyebrow: "Recorrido del proveedor",
  sj_title: "De proveedor listado a un flujo de demanda durante todo el año.",
  sj_subtitle:
    "Los proveedores no compran confianza en Yorso. La construyen con evidencia, contenido estructurado y calidad de respuesta consistente. La visibilidad Premium es presentación — no un atajo de verificación.",
  sj_def_verified_label: "Verified",
  sj_def_verified_body: "Respaldado por evidencia.",
  sj_def_featured_label: "Featured / Sponsored",
  sj_def_featured_body: "Visibilidad pagada.",
  sj_def_premium_label: "Premium",
  sj_def_premium_body: "Presentación reforzada y soporte de conversión.",
  sj_supplierDoes: "El proveedor hace",
  sj_yorsoProvides: "Yorso aporta",
  sj_outcome: "Resultado",
  sj_steps: [
    {
      title: "Crear perfil de proveedor y listados de productos",
      supplier: "Configura el perfil de empresa y lista productos con especie, formato, embalaje, origen y capacidad.",
      yorso: "Product Content Workspace con campos estructurados, estado borrador y especificaciones reutilizables entre SKUs.",
      outcome: "Los listados son buscables en las categorías correctas desde el primer día.",
      concept: "Product Content Workspace",
    },
    {
      title: "Añadir evidencia de verificación y preparación para exportar",
      supplier: "Sube registro de empresa, aprobación de planta, licencia de exportación, certificados y documentos de referencia.",
      yorso: "Verified Supplier Trust Pack — bloque estructurado de evidencia. Verified significa respaldado por evidencia, no garantía de calidad.",
      outcome: "Los compradores pueden precualificar al proveedor antes de iniciar conversación.",
      concept: "Verified Supplier Trust Pack",
    },
    {
      title: "Obtener visibilidad en búsquedas de productos y categorías relevantes",
      supplier: "Publica el perfil y expone productos a la búsqueda, filtros y páginas de categoría del comprador.",
      yorso: "SEO Supplier Profile con metadatos estructurados de producto, origen y certificación para descubrimiento orgánico.",
      outcome: "Descubrimiento entrante en lugar de outreach en frío.",
      concept: "SEO Supplier Profile",
    },
    {
      title: "Recibir RFQ cualificadas y señales de intención del comprador",
      supplier: "Revisa solicitudes filtradas por categoría, país, volumen y relevancia de Incoterms.",
      yorso: "Bandeja de RFQ cualificadas + señales de Buyer Intent — qué buscan, solicitan y preseleccionan los compradores.",
      outcome: "Tiempo comercial enfocado en demanda real, no en ruido.",
      concept: "Qualified RFQ / Buyer Intent",
    },
    {
      title: "Responder con detalles de oferta estructurados",
      supplier: "Responde con precio, MOQ, plazo, condiciones de pago, Incoterms y preparación documental en formato estándar.",
      yorso: "Plantilla de respuesta estructurada en el hilo del RFQ, comparable lado a lado por el comprador.",
      outcome: "Mayor tasa de paso a shortlist; menos ida y vuelta por email.",
    },
    {
      title: "Mejorar la conversión con confianza y storytelling",
      supplier: "Refuerza el storytelling: historia de origen, fotos de planta, detalle de embalaje, narrativa de capacidad.",
      yorso: "Campos de storytelling y bloques de merchandising. Premium opcional refuerza presentación y prioridad de descubrimiento.",
      outcome: "Mejor conversión consulta → shortlist, especialmente con compradores nuevos.",
      concept: "Premium Visibility · presentación pagada, separada de la verificación",
    },
    {
      title: "Construir demanda recurrente con CRM y analítica",
      supplier: "Hace seguimiento, rastrea compradores recurrentes y lee qué formatos y países tiran de la demanda.",
      yorso: "Hilo CRM por comprador, historial de seguimiento y Buyer Intent Analytics por categoría, país y formato.",
      outcome: "Pipeline durante todo el año en lugar de picos estacionales.",
      concept: "Buyer Intent Analytics",
    },
  ],

  ts_eyebrow: "Stack de confianza",
  ts_title: "La confianza en Yorso es un stack de evidencia, no una insignia.",
  ts_subtitle:
    "Cada capa se muestra honestamente. Verified significa que la evidencia está en archivo. Los elementos faltantes se etiquetan «aún no proporcionado». Las colocaciones pagadas se etiquetan «promoted». Los proveedores promoted no son más seguros — son más visibles.",
  ts_layer: "Capa",
  ts_layers: [
    { title: "Identidad de la empresa", body: "Entidad legal, país de registro, número de aprobación de planta, referencia de licencia de exportación.", evidence: "Verified — documento de registro y aprobación de planta en archivo." },
    { title: "Especificación de producto", body: "Especie (nombre latino), formato/corte, calibre, embalaje, glaseado, vida útil.", evidence: "Verified — especificación declarada por el proveedor en campos estructurados." },
    { title: "Origen y país del proveedor", body: "Origen de pesca/granja y país desde el que envía el proveedor.", evidence: "Verified — origen declarado por SKU; país del proveedor desde el registro." },
    { title: "Certificados y documentos", body: "Certificados sanitarios, MSC/ASC cuando aplique, cumplimiento IUU, análisis de laboratorio.", evidence: "Aún no proporcionado para este proveedor — el comprador puede solicitarlo antes del RFQ." },
    { title: "Incoterms, MOQ, pago, plazo", body: "Condiciones comerciales adjuntas a la oferta, no enterradas en chat.", evidence: "Verified — declaradas por oferta, comparables entre proveedores." },
    { title: "Histórico de precios y señales de mercado", body: "Rango indicativo de precio, dirección de tendencia, contexto de noticias por país.", evidence: "Neutral — contexto direccional, no un feed de mercado." },
    { title: "Preparación del proveedor y calidad de respuesta", body: "Preparación documental, tiempo medio de respuesta, tasa de cierre de RFQ.", evidence: "Verified — medido por el comportamiento en plataforma a lo largo del tiempo." },
    { title: "Comunicación y rastro del pedido", body: "Hilo RFQ estructurado, historial de seguimiento, registro de intercambio documental.", evidence: "Verified — registrado dentro del trato, exportable con el expediente de compra." },
  ],
  ts_state_verified: "Verified",
  ts_state_missing: "Aún no proporcionado",
  ts_state_promoted: "Promoted",
  ts_state_neutral: "Contexto",
  ts_legend_verified: "Verified = evidencia en archivo. No es garantía de calidad.",
  ts_legend_missing: "Aún no proporcionado = elemento faltante. El comprador puede solicitarlo antes del RFQ.",
  ts_legend_promoted: "Promoted = visibilidad pagada, separada de la verificación.",

  vg_eyebrow: "Qué aporta Yorso",
  vg_title: "Valor equilibrado para compradores y proveedores.",
  vg_subtitle:
    "Los compradores obtienen evidencia de grado de decisión. Los proveedores obtienen demanda cualificada y un lugar para demostrarlo. Verified, Sponsored y Premium se mantienen visualmente separados — la colocación pagada nunca se vende como confianza.",
  vg_buyer_eyebrow: "Para compradores",
  vg_buyer_title: "Decisiones de grado de compra, defendidas internamente.",
  vg_buyer_count: "9 capacidades · basadas en evidencia",
  vg_supplier_eyebrow: "Para proveedores",
  vg_supplier_title: "Demanda cualificada, evidencia estructurada, comercio recurrente.",
  vg_supplier_count: "9 capacidades · verificación ≠ colocación pagada",
  vg_buyer_items: [
    { title: "Descubrimiento de productos", body: "Búsqueda por especie, formato, origen, certificaciones y país del proveedor." },
    { title: "Evidencia de proveedor verificado", body: "Registro, aprobación de planta y certificaciones presentados en un trust pack estructurado." },
    { title: "Flujo RFQ / solicitud", body: "Envío de un RFQ estructurado con cantidad, embalaje, Incoterms y ventana de entrega." },
    { title: "Comparación de ofertas", body: "Comparación lado a lado de precio, MOQ, plazo, condiciones de pago y documentos." },
    { title: "Precio y contexto de mercado", body: "Rango indicativo, dirección de tendencia y noticias del país de origen vinculadas a la oferta." },
    { title: "Preparación documental", body: "Visibilidad de qué certificados y documentos de envío ya están en archivo." },
    { title: "Landed cost y contexto logístico", body: "Flete, aranceles y riesgo de cadena de frío estimados antes del compromiso." },
    { title: "Soporte de decisión en equipo", body: "Shortlist, comparación y notas compartidas para compras, finanzas y calidad." },
    { title: "Informe de decisión de compra", body: "Registro exportable de benchmark de precio, evidencia, alternativas y auditoría." },
  ],
  vg_supplier_items: [
    { title: "Perfil de producto y empresa", body: "Contenido estructurado con especie, formato, embalaje, capacidad y origen." },
    { title: "Verificación y bloques de evidencia del proveedor", body: "Registro, aprobación de planta, licencia de exportación y certificados en un trust pack estándar.", tagLabel: "Verified · respaldado por evidencia" },
    { title: "SEO / visibilidad de perfil", body: "Perfil de proveedor y páginas de producto indexadas para búsqueda B2B orgánica." },
    { title: "Solicitudes cualificadas de compradores", body: "Bandeja de RFQ filtrada por categoría, país, volumen e Incoterms." },
    { title: "Señales de intención del comprador", body: "Qué buscan, solicitan y preseleccionan los compradores en sus categorías y orígenes." },
    { title: "Storytelling y merchandising de producto", body: "Historia de origen, fotos de planta y narrativa de capacidad adjuntas a los listados." },
    { title: "Soporte de conversión de consultas", body: "Respuestas estructuradas, comparables con otros proveedores preseleccionados." },
    { title: "CRM, seguimiento y demanda recurrente", body: "Hilo por comprador, historial de seguimiento y flujo de pedido recurrente." },
    { title: "Camino Premium de confianza y visibilidad", body: "Presentación reforzada, énfasis en merchandising y colocación de descubrimiento. Visibilidad — no verificación.", tagLabel: "Premium · presentación pagada" },
  ],
  vg_legend_verified: "Verified — evidencia en archivo. No es garantía de calidad.",
  vg_legend_sponsored: "Sponsored / Featured — visibilidad pagada. No afecta el estado de verificación.",
  vg_legend_premium: "Premium — presentación reforzada y soporte de conversión. Visibilidad, no confianza.",

  al_eyebrow: "Niveles de acceso",
  al_title: "El acceso está restringido por una razón — y el valor se ve antes del registro.",
  al_subtitle:
    "Yorso usa tres estados honestos de acceso. Cualquiera puede ver la prueba activa del marketplace y el contexto de producto. El precio exacto y la identidad completa del proveedor se desbloquean juntos — nunca uno sin el otro.",
  al_reasons: [
    { title: "Proteger datos sensibles del proveedor", body: "Los precios y la identidad son activos comerciales — no tráfico gratuito." },
    { title: "Reducir scraping de baja intención", body: "El gating filtra extracción automatizada y curiosos sin intención." },
    { title: "Mejorar la calidad del comprador", body: "La intención real de compra se recompensa con más acceso y workflow más rico." },
    { title: "Preservar la confianza del marketplace", body: "Los proveedores listan más abiertamente cuando saben quién y por qué mira." },
    { title: "Desbloquear workflow más útil", body: "Comparación, historial de RFQ, seguimiento y prueba de decisión crecen con el nivel." },
  ],
  al_card_anonymous: {
    badge: "Anónimo",
    title: "Ver el marketplace antes de comprometerse.",
    body: "Navegue sin cuenta. Pruebas reales, sin paywall duro.",
    bullets: [
      "Prueba activa del marketplace",
      "Ejemplos de producto y categoría",
      "Rangos de precio (precio exacto bloqueado)",
      "Stubs de proveedor sin identidad completa",
      "Puntos de entrada de solicitud",
    ],
  },
  al_card_registered: {
    badge: "Registrado",
    title: "Guardar, comparar, vigilar, solicitar.",
    body: "La cuenta gratuita de comprador desbloquea el workspace, pero el precio exacto y la identidad del proveedor permanecen protegidos hasta solicitar acceso.",
    bullets: [
      "Guardar, watchlist, seguir proveedores",
      "Comparar ofertas lado a lado",
      "Solicitar acceso a precio / proveedor",
      "Enviar RFQ estructurados",
      "Construir shortlist con su equipo",
    ],
  },
  al_card_qualified: {
    badge: "Cualificado",
    title: "Contexto completo del trato, identidad del proveedor incluida.",
    body: "Una vez concedido el acceso al precio, la identidad del proveedor se desbloquea con él — nunca por separado.",
    bullets: [
      "Precio exacto visible",
      "Identidad completa del proveedor",
      "Datos de confianza más ricos",
      "Inteligencia y acciones de comunicación más profundas",
      "Exportar Procurement Decision Proof",
    ],
  },
  al_matrix_eyebrow: "Matriz de capacidades",
  al_matrix_title: "Qué está disponible en cada nivel de acceso",
  al_th_capability: "Capacidad",
  al_th_anonymous: "Anónimo",
  al_th_registered: "Registrado",
  al_th_qualified: "Cualificado",
  al_capabilities: [
    { label: "Prueba activa del marketplace" },
    { label: "Ejemplos de producto y categoría" },
    { label: "Rangos de precio (precio exacto bloqueado)" },
    { label: "Stubs de proveedor (sin identidad completa)" },
    { label: "Puntos de entrada de solicitud" },
    { label: "Guardar, watchlist, seguir proveedores" },
    { label: "Comparar ofertas lado a lado" },
    { label: "Solicitar precio / datos del proveedor" },
    { label: "Enviar RFQ estructurado" },
    { label: "Precio exacto visible" },
    { label: "Identidad completa del proveedor" },
    { label: "Datos de confianza más ricos" },
    { label: "Inteligencia y acciones de comunicación más profundas" },
    { label: "Exportar Procurement Decision Proof" },
  ],
  al_legend_available: "disponible",
  al_legend_request: "bajo solicitud — la identidad del proveedor se desbloquea con el precio",
  al_legend_unavailable: "no disponible",
  al_cell_onRequest: "bajo solicitud",

  bo_eyebrow: "Resultados de negocio",
  bo_title: "Resultados que el flujo está diseñado para producir.",
  bo_subtitle:
    "Estos son los resultados operativos que Yorso está diseñado para entregar a lo largo de un ciclo de compra — no métricas de vanidad, no resultados fabricados, no garantías.",
  bo_buyer_eyebrow: "Para compradores",
  bo_buyer_title: "Menos riesgo por decisión de compra.",
  bo_supplier_eyebrow: "Para proveedores",
  bo_supplier_title: "Más demanda cualificada, menos ruido.",
  bo_buyer_items: [
    { title: "Menos tiempo perdido buscando proveedores", body: "Descubrimiento entrante y filtros estructurados sustituyen días de WhatsApp y PDF." },
    { title: "Menos conversaciones con proveedores poco fiables", body: "Shortlist por evidencia descarta a quien no puede respaldar sus afirmaciones." },
    { title: "Mejor evidencia para aprobación interna", body: "Expediente defendible: benchmark de precio, alternativas, registro de auditoría." },
    { title: "Más claridad en precio y landed cost", body: "Rangos indicativos, señales de mercado y lógica de landed cost — no un único número." },
    { title: "Menor riesgo documental y logístico", body: "Visibilidad de preparación documental, Incoterms y plazos antes del compromiso." },
  ],
  bo_supplier_items: [
    { title: "Más consultas cualificadas", body: "RFQ filtrados por categoría, país, volumen e Incoterms." },
    { title: "Mayor confianza del comprador", body: "Bloques de evidencia verificada ayudan a precualificar antes del diálogo." },
    { title: "Mejor presentación de producto", body: "Contenido estructurado, storytelling y merchandising en un solo workspace." },
    { title: "Visibilidad más útil", body: "Perfil SEO y aparición en categorías — visible para compradores que buscan activamente." },
    { title: "Flujo de ventas repetible", body: "CRM, historial de seguimiento e intent analytics convierten un trato en una relación recurrente." },
  ],
  bo_goals_eyebrow: "Intenciones de diseño",
  bo_goals_title: "Qué pretende soportar este workflow",
  bo_goals_subtitle: "Son objetivos de producto — intenciones direccionales que guían decisiones de diseño, no afirmaciones de rendimiento publicadas.",
  bo_goals: [
    { label: "Soporta el crecimiento de tráfico", body: "Contenido estructurado de producto, proveedor y categoría para búsqueda B2B orgánica." },
    { label: "Soporta la conversión de registro", body: "Valor visible antes del registro; la cuenta desbloquea el workspace, no el contexto básico." },
    { label: "Soporta la retención", body: "Workspace, CRM y prueba de decisión recompensan ciclos repetidos de compra." },
    { label: "Soporta el crecimiento de confianza", body: "Stack de confianza por evidencia, con separación estricta del placement pagado." },
  ],

  fc_eyebrow: "Comenzar",
  fc_title: "Dos caminos claros hacia el flujo.",
  fc_subtitle: "Tanto si abastece como si vende pescado y marisco, Yorso es el mismo sistema operativo — entrado por lados distintos.",
  fc_buyer_eyebrow: "Para compradores",
  fc_buyer_title: "Abastezca con evidencia, no con suposiciones.",
  fc_buyer_body: "Descubra productos y proveedores verificados, solicite acceso al precio exacto y a la identidad del proveedor, y construya un expediente de compra defensible.",
  fc_buyer_bullets: [
    "Búsqueda por especie, formato, origen y certificaciones",
    "Comparación de ofertas y preparación documental lado a lado",
    "Exportar Procurement Decision Proof para aprobación interna",
  ],
  fc_buyer_cta1: "Encontrar productos y proveedores",
  fc_buyer_cta2: "Crear una solicitud",
  fc_supplier_eyebrow: "Para proveedores",
  fc_supplier_title: "Llegue a compradores cualificados con evidencia estructurada.",
  fc_supplier_body: "Construya un perfil verificado, exponga productos a la búsqueda B2B orgánica y convierta RFQ cualificadas con respuestas estructuradas.",
  fc_supplier_bullets: [
    "Verified Supplier Trust Pack — evidencia, no insignias",
    "Bandeja de RFQ cualificadas con señales de intención",
    "Premium — camino de presentación reforzada, visibilidad, no confianza",
  ],
  fc_supplier_cta1: "Convertirse en proveedor verificado",
  fc_supplier_cta2: "Mostrar productos a compradores cualificados",
  fc_trustNote_label: "Nota de confianza",
  fc_trustNote_body: "Yorso separa la evidencia verificada de la visibilidad pagada. Los compradores ven qué está probado, qué está promocionado y qué aún necesita confirmación.",
  fc_trustNote_proven: "Verified · probado",
  fc_trustNote_promoted: "Promoted · visibilidad pagada",
  fc_trustNote_unconfirmed: "Aún no proporcionado · necesita confirmación",
};

const dictionaries: Record<Language, HowItWorksDict> = { en, ru, es };

export const useHowItWorks = (): HowItWorksDict => {
  const { lang } = useLanguage();
  return dictionaries[lang] ?? dictionaries.en;
};
