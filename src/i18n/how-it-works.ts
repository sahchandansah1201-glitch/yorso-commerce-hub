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
  hero_ctaRequestAccess: string;
  hero_ctaSupplier: string;
  hero_ctaScroll: string;
  hero_workflow_eyebrow: string;
  hero_workflow_caption: string;
  hero_workflow_step: string;
  hero_workflow_steps: string[]; // 6

  // Buyer Decision Snapshot (3 cards)
  bds_eyebrow: string;
  bds_title: string;
  bds_subtitle: string;
  bds_question: string;
  bds_yorso: string;
  bds_proof: string;
  bds_supplierNote: string;
  bds_cards: { question: string; yorso: string; proof: string }[]; // 3

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

  hero_eyebrow: "Built for buyers",
  hero_titlePrefix: "Make and defend the right ",
  hero_titleHighlight: "seafood procurement decision",
  hero_titleSuffix: ".",
  hero_subtitle:
    "Yorso helps buyers find products, check suppliers, compare offers and build an internal record that holds up in front of finance, quality and leadership. Supplier evidence is the mechanism, not the message.",
  hero_ctaFind: "Find products and suppliers",
  hero_ctaRequestAccess: "Request access to a supplier",
  hero_ctaSupplier: "I am a supplier",
  hero_ctaScroll: "See how it works ↓",
  hero_workflow_eyebrow: "End-to-end buyer workflow",
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

  bds_eyebrow: "Buyer decision snapshot",
  bds_title: "Three questions every buyer has to answer.",
  bds_subtitle:
    "Before any seafood deal is signed, a procurement manager has to defend it internally. Yorso is built around the three questions that decide whether the answer is yes.",
  bds_question: "Buyer question",
  bds_yorso: "What Yorso provides",
  bds_proof: "Evidence the buyer gets",
  bds_supplierNote:
    "Supplier evidence is the mechanism that helps buyers trust the decision, not a separate marketing story.",
  bds_cards: [
    {
      question: "Can I trust this supplier?",
      yorso: "Structured supplier profiles with company registration, export licence, plant approval and certifications collected in one place.",
      proof: "Verification status per item, document readiness flag and trade history on the platform, shown as submitted, not as a quality guarantee.",
    },
    {
      question: "Is this price and offer reasonable?",
      yorso: "Price ranges, market signals and benchmark context tied to the species, origin and Incoterms in front of the buyer.",
      proof: "Price band (low / avg / high), offer comparison across shortlisted suppliers and a landed-cost view including freight and duties as estimates.",
    },
    {
      question: "Can I defend this decision internally?",
      yorso: "A Procurement Decision Proof file: shortlist, comparison, supplier evidence, risk summary, alternatives considered and an audit trail.",
      proof: "An exportable record the buyer can send to finance, quality and leadership without rebuilding it from email and spreadsheets.",
    },
  ],

  problem_eyebrow: "Problem map",
  problem_title: "The cost of a wrong seafood procurement decision is paid by the buyer.",
  problem_subtitle:
    "Suppliers can be replaced. A wrong order — wrong species, wrong supplier, wrong terms — stays on the buyer's P&L. Yorso is built around what makes that decision go wrong, and what has to be true about suppliers for the buyer to trust it.",
  problem_buyer_eyebrow: "Buyer pain",
  problem_buyer_title: "Where buyers lose money, time and internal credit.",
  problem_buyer_pains: [
    "Prices scattered across WhatsApp, email, PDFs and outdated price lists — no single view to compare.",
    "Supplier reliability is unclear before commitment: no easy way to check company, plant approval and history.",
    "Certificates, traceability, Incoterms, payment terms and documents are checked too late — usually after the order.",
    "Landed cost is unclear without freight, duties, lead time and cold-chain risk in one view.",
    "Internal approval is hard to defend: finance, quality and leadership want a record, not a forwarded chat.",
    "Repeat sourcing starts from zero each season — past shortlists, comparisons and decisions are lost.",
  ],
  problem_supplier_eyebrow: "Supplier-side mechanism",
  problem_supplier_title: "What must be true about suppliers for the buyer to trust the deal.",
  problem_supplier_pains: [
    "Company registration, export licence and plant approval number on file — checkable, not implied.",
    "Product specs are concrete: species, format, cut, packaging, origin, MOQ — no marketing claims.",
    "Certifications and traceability documents uploaded and current, not promised by email.",
    "Response quality is visible: average reply time, completeness of answers, document readiness.",
    "Trade history on the platform — past offers, requests handled, repeat buyers.",
    "Paid visibility (Featured / Sponsored) is shown separately from verification — promotion is not proof.",
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

  sj_eyebrow: "Supply trust mechanism",
  sj_title: "How Yorso turns suppliers into evidence-backed options for buyers.",
  sj_subtitle:
    "Suppliers do not buy trust on Yorso. They provide evidence. Yorso structures it so buyers can decide. Paid visibility is shown — and labelled — separately from verification.",
  sj_def_verified_label: "Verified",
  sj_def_verified_body: "Evidence on file — checkable, not a quality guarantee.",
  sj_def_featured_label: "Featured / Sponsored",
  sj_def_featured_body: "Paid visibility — does not change verification status.",
  sj_def_premium_label: "Premium",
  sj_def_premium_body: "Stronger presentation — never sold as proof.",
  sj_supplierDoes: "What supplier provides",
  sj_yorsoProvides: "What buyer sees",
  sj_outcome: "What buyer can do",
  sj_steps: [
    {
      title: "Supplier identity evidence",
      supplier: "Company registration, country of incorporation, plant approval number, export licence reference.",
      yorso: "Identity block on the supplier profile with status per item: on file, partial, or not provided yet.",
      outcome: "Pre-qualify the company before opening a conversation; request any missing item.",
      concept: "Verified",
    },
    {
      title: "Product and capacity clarity",
      supplier: "Species (Latin name), format, cut, size grade, packaging, glaze, MOQ and monthly capacity.",
      yorso: "Structured product fields — no free-form marketing claims, comparable across suppliers.",
      outcome: "Compare like-for-like in the offer comparison without rebuilding specs in a spreadsheet.",
      concept: "Verified",
    },
    {
      title: "Export and certificate readiness",
      supplier: "Health certificates, MSC/ASC where applicable, IUU compliance, lab analyses uploaded with validity dates.",
      yorso: "Document readiness flag per offer — uploaded, expiring, or missing — visible before the RFQ.",
      outcome: "Catch a missing or expiring certificate before the order, not after shipment.",
      concept: "Verified",
    },
    {
      title: "Price and term context",
      supplier: "Price (range or exact, depending on access), Incoterms, payment terms, lead time, validity window.",
      yorso: "Offer card with price band, market signals and benchmark context tied to species, origin and Incoterms.",
      outcome: "See whether the offer sits low / avg / high against the platform context for that lane.",
      concept: "Neutral",
    },
    {
      title: "Response quality",
      supplier: "Replies to RFQs in a structured format, on a measurable timeline, with complete answers.",
      yorso: "Average response time and answer-completeness shown on the supplier profile — submitted, not promised.",
      outcome: "Shortlist suppliers who actually respond, not the ones who only look good in the listing.",
      concept: "Neutral",
    },
    {
      title: "Paid visibility — clearly labelled",
      supplier: "May choose Featured / Sponsored placement or Premium presentation to improve discovery.",
      yorso: "Paid placements carry a visible label. Verification status is shown next to it, not replaced by it.",
      outcome: "Tell promotion apart from proof; promoted suppliers are more visible, not safer.",
      concept: "Promotion",
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

  vg_eyebrow: "What buyers get",
  vg_title: "Built for the buyer side of the trade.",
  vg_subtitle:
    "Buyers get the workspace and the evidence. Supplier-side mechanisms exist to make those buyer decisions safer — not to be sold separately. Verified, Sponsored and Premium are kept visually separate; paid placement is never sold as trust.",
  vg_buyer_eyebrow: "Buyer capabilities",
  vg_buyer_title: "Procurement-grade decisions, defended internally.",
  vg_buyer_count: "9 capabilities · evidence-led",
  vg_supplier_eyebrow: "Supply-side mechanism",
  vg_supplier_title: "What the supplier side does so the buyer can decide safely.",
  vg_supplier_count: "Verification ≠ paid placement",
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

  bo_eyebrow: "Outcomes",
  bo_title: "What the buyer should walk away with.",
  bo_subtitle:
    "Operational outcomes Yorso is designed to deliver across a procurement cycle — buyer first, supplier as the supporting mechanism. Not vanity metrics, not guarantees.",
  bo_buyer_eyebrow: "Buyer outcomes",
  bo_buyer_title: "Less risk per purchasing decision.",
  bo_supplier_eyebrow: "Supplier outcomes (supporting)",
  bo_supplier_title: "Why qualified suppliers stay engaged.",
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
  fc_title: "Start as a buyer. Suppliers can join from the side.",
  fc_subtitle: "Yorso is built around the buyer's procurement decision. Find products, send a request, build the file. Suppliers join to provide the evidence.",
  fc_buyer_eyebrow: "Primary path · for buyers",
  fc_buyer_title: "Source seafood with evidence, not guesswork.",
  fc_buyer_body: "Discover products and verified suppliers, request access to exact price and supplier identity, and build a defensible procurement file.",
  fc_buyer_bullets: [
    "Search by species, format, origin and certifications",
    "Compare offers and document readiness side-by-side",
    "Export a Procurement Decision Proof for internal approval",
  ],
  fc_buyer_cta1: "Find products and suppliers",
  fc_buyer_cta2: "Create procurement request",
  fc_supplier_eyebrow: "Secondary path · for suppliers",
  fc_supplier_title: "Become an evidence-backed option for buyers.",
  fc_supplier_body: "Build a verified profile and provide the evidence buyers use to decide. Paid visibility is available — and clearly labelled separately.",
  fc_supplier_bullets: [
    "Verified Supplier Trust Pack — evidence, not badges",
    "Qualified RFQ inbox with buyer intent signals",
    "Premium presentation — visibility, never proof",
  ],
  fc_supplier_cta1: "Become a verified supplier",
  fc_supplier_cta2: "See supplier details",
  fc_trustNote_label: "Trust note",
  fc_trustNote_body: "Verified evidence, paid visibility, and missing information are separate. Buyers see what is proven, what is promoted, and what still needs confirmation.",
  fc_trustNote_proven: "Verified · proven",
  fc_trustNote_promoted: "Promoted · paid visibility",
  fc_trustNote_unconfirmed: "Not provided yet · needs confirmation",
};

const ru: HowItWorksDict = {
  seo_title: "Как работает Yorso — B2B-закупки морепродуктов, проверенные поставщики, RFQ",
  seo_description:
    "Yorso — это рабочий процесс B2B-торговли морепродуктами: поиск оптовых поставщиков, проверка, RFQ и сравнение оферт, рыночный контекст цен и защищаемое решение по закупке.",

  hero_eyebrow: "Сделано для покупателей",
  hero_titlePrefix: "Принимайте и защищайте правильное ",
  hero_titleHighlight: "решение о закупке морепродуктов",
  hero_titleSuffix: ".",
  hero_subtitle:
    "Yorso помогает покупателю находить продукты, проверять поставщиков, сравнивать оферты и собирать внутреннее обоснование, которое выдержит вопросы финансов, качества и руководства. Доказательства поставщика — это механизм, а не маркетинговое сообщение.",
  hero_ctaFind: "Найти продукты и поставщиков",
  hero_ctaRequestAccess: "Запросить доступ к поставщику",
  hero_ctaSupplier: "Я поставщик",
  hero_ctaScroll: "Как это работает ↓",
  hero_workflow_eyebrow: "Сквозной процесс покупателя",
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

  bds_eyebrow: "Снимок решения покупателя",
  bds_title: "Три вопроса, на которые покупателю нужно ответить.",
  bds_subtitle:
    "До любой сделки по морепродуктам менеджеру по закупкам нужно защитить её внутри компании. Yorso построен вокруг трёх вопросов, от которых зависит, будет ли ответ «да».",
  bds_question: "Вопрос покупателя",
  bds_yorso: "Что даёт Yorso",
  bds_proof: "Какие доказательства получает покупатель",
  bds_supplierNote:
    "Доказательства поставщика — это механизм, который помогает покупателю доверять решению, а не отдельная маркетинговая история.",
  bds_cards: [
    {
      question: "Можно ли доверять этому поставщику?",
      yorso: "Структурированные профили: регистрация компании, экспортная лицензия, номер аттестации завода и сертификации собраны в одном месте.",
      proof: "Статус проверки по каждому пункту, флаг готовности документов и история работы на платформе — в формате «как заявлено», без обещаний качества.",
    },
    {
      question: "Адекватны ли цена и условия?",
      yorso: "Ценовые диапазоны, рыночные сигналы и контекст бенчмарка, привязанные к виду, происхождению и Incoterms конкретной оферты.",
      proof: "Полоса цены (низкая / средняя / высокая), сравнение шорт-листа поставщиков и расчёт landed cost с фрахтом и пошлинами как оценка.",
    },
    {
      question: "Смогу ли я защитить это решение внутри компании?",
      yorso: "Файл Procurement Decision Proof: шорт-лист, сравнение, доказательства поставщика, риски, рассмотренные альтернативы и журнал событий.",
      proof: "Экспортируемый отчёт, который можно отправить финансам, качеству и руководству, не собирая его заново из почты и таблиц.",
    },
  ],

  problem_eyebrow: "Карта проблем",
  problem_title: "Цена неверного решения о закупке морепродуктов всегда на стороне покупателя.",
  problem_subtitle:
    "Поставщика можно заменить. Неверный заказ — не тот вид, не тот поставщик, не те условия — остаётся в P&L покупателя. Yorso построен вокруг того, из-за чего это решение идёт не так, и что должно быть верно про поставщика, чтобы покупатель доверял сделке.",
  problem_buyer_eyebrow: "Боль покупателя",
  problem_buyer_title: "Где покупатель теряет деньги, время и внутреннее доверие.",
  problem_buyer_pains: [
    "Цены разбросаны по WhatsApp, email, PDF и устаревшим прайсам — нет одного экрана, чтобы сравнить.",
    "Надёжность поставщика непонятна до сделки: нет простого способа проверить компанию, аттестацию завода и историю.",
    "Сертификаты, прослеживаемость, Incoterms, условия оплаты и документы проверяют слишком поздно — обычно после заказа.",
    "Landed cost непонятен без фрахта, пошлин, сроков и риска холодовой цепи в одном виде.",
    "Внутреннее согласование сложно защитить: финансам, качеству и руководству нужен документ, а не пересланная переписка.",
    "Каждый сезон закупка начинается с нуля — прошлые шорт-листы, сравнения и решения теряются.",
  ],
  problem_supplier_eyebrow: "Механизм со стороны поставщика",
  problem_supplier_title: "Что должно быть верно про поставщика, чтобы покупатель доверял сделке.",
  problem_supplier_pains: [
    "Регистрация компании, экспортная лицензия и номер аттестации завода — на руках, проверяемо, а не «на словах».",
    "Спецификации продукта конкретны: вид, формат, разделка, упаковка, происхождение, MOQ — без маркетинговых заявлений.",
    "Сертификаты и документы прослеживаемости загружены и актуальны, а не «вышлем по почте».",
    "Видно качество ответа: среднее время реакции, полнота ответов, готовность документов.",
    "История работы на платформе — прошлые оферты, обработанные запросы, повторные покупатели.",
    "Платное продвижение (Featured / Sponsored) показано отдельно от верификации — продвижение не равно проверке.",
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

  sj_eyebrow: "Механизм доверия к поставщику",
  sj_title: "Как Yorso превращает поставщиков в подкреплённые доказательствами варианты для покупателя.",
  sj_subtitle:
    "Поставщики не покупают доверие на Yorso. Они предоставляют доказательства. Yorso структурирует их так, чтобы покупатель мог принять решение. Платная видимость показана и подписана отдельно от верификации.",
  sj_def_verified_label: "Verified",
  sj_def_verified_body: "Доказательства в досье — проверяемо, не гарантия качества.",
  sj_def_featured_label: "Featured / Sponsored",
  sj_def_featured_body: "Платная видимость — не меняет статус верификации.",
  sj_def_premium_label: "Premium",
  sj_def_premium_body: "Усиленная подача — никогда не продаётся как доказательство.",
  sj_supplierDoes: "Что предоставляет поставщик",
  sj_yorsoProvides: "Что видит покупатель",
  sj_outcome: "Что может сделать покупатель",
  sj_steps: [
    {
      title: "Доказательства идентичности поставщика",
      supplier: "Регистрация компании, страна регистрации, номер аттестации завода, ссылка на экспортную лицензию.",
      yorso: "Блок идентичности на профиле поставщика со статусом по каждому пункту: в досье, частично или ещё не предоставлено.",
      outcome: "Предварительно квалифицировать компанию до начала диалога; запросить недостающий пункт.",
      concept: "Verified",
    },
    {
      title: "Ясность по продукту и мощности",
      supplier: "Вид (латинское название), формат, разделка, размер, упаковка, глазурь, MOQ и месячная мощность.",
      yorso: "Структурированные поля продукта — без свободных маркетинговых заявлений, сравнимо между поставщиками.",
      outcome: "Сравнивать «как с как» в comparison, не пересобирая спеки в Excel.",
      concept: "Verified",
    },
    {
      title: "Готовность к экспорту и сертификаты",
      supplier: "Ветеринарные сертификаты, MSC/ASC где применимо, IUU-комплаенс, лабораторные анализы — загружены, со сроками действия.",
      yorso: "Флаг готовности документов по оферте — загружено, истекает, отсутствует — виден до RFQ.",
      outcome: "Заметить отсутствующий или истекающий сертификат до заказа, а не после отгрузки.",
      concept: "Verified",
    },
    {
      title: "Контекст цены и условий",
      supplier: "Цена (диапазон или точная — в зависимости от доступа), Incoterms, условия оплаты, срок, окно валидности.",
      yorso: "Карточка оферты с полосой цены, рыночными сигналами и бенчмарком, привязанными к виду, происхождению и Incoterms.",
      outcome: "Видеть, низкая / средняя / высокая ли оферта в контексте платформы по этому маршруту.",
      concept: "Neutral",
    },
    {
      title: "Качество ответа",
      supplier: "Отвечает на RFQ в структурированном формате, в измеримые сроки, полно по всем пунктам.",
      yorso: "Среднее время ответа и полнота ответов показаны на профиле — в формате «как заявлено», без обещаний.",
      outcome: "Шорт-листить тех, кто реально отвечает, а не тех, кто красиво выглядит в листинге.",
      concept: "Neutral",
    },
    {
      title: "Платная видимость — с явной подписью",
      supplier: "Может выбрать размещение Featured / Sponsored или подачу Premium для лучшего обнаружения.",
      yorso: "Платные размещения имеют видимую подпись. Статус верификации показан рядом, а не заменён ею.",
      outcome: "Отделять продвижение от доказательств; promoted-поставщики виднее, но не безопаснее.",
      concept: "Promotion",
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

  vg_eyebrow: "Что получает покупатель",
  vg_title: "Сделано для покупательской стороны сделки.",
  vg_subtitle:
    "Покупатель получает рабочее пространство и доказательства. Механизмы со стороны поставщика существуют, чтобы решения покупателя были безопаснее, — а не как отдельный продукт. Verified, Sponsored и Premium визуально разделены; платное размещение никогда не продаётся как доверие.",
  vg_buyer_eyebrow: "Возможности покупателя",
  vg_buyer_title: "Решения уровня закупки, защищаемые внутри компании.",
  vg_buyer_count: "9 возможностей · по доказательствам",
  vg_supplier_eyebrow: "Механизм со стороны поставщика",
  vg_supplier_title: "Что делает сторона поставщика, чтобы покупатель мог решать безопасно.",
  vg_supplier_count: "Верификация ≠ платное размещение",
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

  bo_eyebrow: "Результаты",
  bo_title: "С чем должен уйти покупатель.",
  bo_subtitle:
    "Операционные результаты, которые Yorso призван давать в цикле закупки — сначала покупатель, поставщик как поддерживающий механизм. Не «vanity»-метрики, не гарантии.",
  bo_buyer_eyebrow: "Результаты для покупателя",
  bo_buyer_title: "Меньше риска на каждое решение о закупке.",
  bo_supplier_eyebrow: "Результаты для поставщика (поддержка)",
  bo_supplier_title: "Почему квалифицированные поставщики остаются в работе.",
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
  fc_title: "Начните как покупатель. Поставщики подключаются сбоку.",
  fc_subtitle: "Yorso построен вокруг закупочного решения покупателя. Найти продукты, отправить запрос, собрать досье. Поставщики подключаются, чтобы предоставить доказательства.",
  fc_buyer_eyebrow: "Основной путь · для покупателей",
  fc_buyer_title: "Закупайте морепродукты по доказательствам, а не наугад.",
  fc_buyer_body: "Находите продукты и проверенных поставщиков, запрашивайте доступ к точной цене и личности поставщика и собирайте защищаемое закупочное досье.",
  fc_buyer_bullets: [
    "Поиск по виду, формату, происхождению и сертификатам",
    "Сравнение оферт и готовности документов бок о бок",
    "Экспорт Procurement Decision Proof для внутреннего согласования",
  ],
  fc_buyer_cta1: "Найти продукты и поставщиков",
  fc_buyer_cta2: "Создать закупочный запрос",
  fc_supplier_eyebrow: "Вторичный путь · для поставщиков",
  fc_supplier_title: "Стать подкреплённым доказательствами вариантом для покупателя.",
  fc_supplier_body: "Соберите верифицированный профиль и предоставьте доказательства, по которым покупатель принимает решение. Платная видимость доступна — и подписана отдельно.",
  fc_supplier_bullets: [
    "Verified Supplier Trust Pack — доказательства, а не бейджи",
    "Инбокс квалифицированных RFQ с сигналами намерений покупателей",
    "Premium-подача — видимость, никогда не доказательство",
  ],
  fc_supplier_cta1: "Стать проверенным поставщиком",
  fc_supplier_cta2: "Подробнее о поставщиках",
  fc_trustNote_label: "О доверии",
  fc_trustNote_body: "Верифицированные доказательства, платная видимость и отсутствующая информация — это разные вещи. Покупатели видят, что подтверждено, что продвигается и что ещё нуждается в подтверждении.",
  fc_trustNote_proven: "Verified · подтверждено",
  fc_trustNote_promoted: "Promoted · платная видимость",
  fc_trustNote_unconfirmed: "Ещё не предоставлено · нужно подтверждение",
};

const es: HowItWorksDict = {
  seo_title: "Cómo funciona Yorso — abastecimiento B2B de pescado y marisco, proveedores verificados, RFQ",
  seo_description:
    "Yorso es un flujo de trabajo de comercio B2B de pescado y marisco: abastecimiento mayorista, proveedores verificados, RFQ y comparación de compras, contexto de precios y mercado, y un informe defensible de decisión.",

  hero_eyebrow: "Hecho para compradores",
  hero_titlePrefix: "Tome y defienda la decisión correcta de ",
  hero_titleHighlight: "compra de pescado y marisco",
  hero_titleSuffix: ".",
  hero_subtitle:
    "Yorso ayuda al comprador a encontrar productos, comprobar proveedores, comparar ofertas y construir un expediente interno que se sostenga ante finanzas, calidad y dirección. La evidencia del proveedor es el mecanismo, no el mensaje.",
  hero_ctaFind: "Encontrar productos y proveedores",
  hero_ctaRequestAccess: "Solicitar acceso a un proveedor",
  hero_ctaSupplier: "Soy proveedor",
  hero_ctaScroll: "Vea cómo funciona ↓",
  hero_workflow_eyebrow: "Flujo integral del comprador",
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

  bds_eyebrow: "Resumen de decisión del comprador",
  bds_title: "Tres preguntas que todo comprador debe responder.",
  bds_subtitle:
    "Antes de firmar cualquier operación, el responsable de compras tiene que defenderla internamente. Yorso está construido alrededor de las tres preguntas que deciden si la respuesta es sí.",
  bds_question: "Pregunta del comprador",
  bds_yorso: "Lo que aporta Yorso",
  bds_proof: "Evidencia que recibe el comprador",
  bds_supplierNote:
    "La evidencia del proveedor es el mecanismo que ayuda al comprador a confiar en la decisión, no una historia de marketing aparte.",
  bds_cards: [
    {
      question: "¿Puedo confiar en este proveedor?",
      yorso: "Perfiles estructurados con registro mercantil, licencia de exportación, número de planta autorizada y certificaciones reunidos en un solo lugar.",
      proof: "Estado de verificación por elemento, indicador de preparación documental e historial en la plataforma, mostrados como aportados, no como garantía de calidad.",
    },
    {
      question: "¿Son razonables el precio y la oferta?",
      yorso: "Rangos de precio, señales de mercado y contexto de referencia ligados a la especie, el origen y los Incoterms de la oferta concreta.",
      proof: "Banda de precio (bajo / medio / alto), comparación de ofertas preseleccionadas y vista de coste en destino con flete y aranceles como estimaciones.",
    },
    {
      question: "¿Podré defender esta decisión internamente?",
      yorso: "Un expediente Procurement Decision Proof: preselección, comparación, evidencia del proveedor, riesgos, alternativas consideradas y registro de auditoría.",
      proof: "Un informe exportable que el comprador puede enviar a finanzas, calidad y dirección sin reconstruirlo a partir de correos y hojas de cálculo.",
    },
  ],

  problem_eyebrow: "Mapa de problemas",
  problem_title: "El coste de una decisión de compra equivocada lo paga el comprador.",
  problem_subtitle:
    "Al proveedor se le puede sustituir. Un pedido equivocado — especie equivocada, proveedor equivocado, condiciones equivocadas — se queda en la cuenta de resultados del comprador. Yorso se construye alrededor de qué hace que esa decisión salga mal y de qué tiene que ser cierto sobre el proveedor para que el comprador confíe en ella.",
  problem_buyer_eyebrow: "Dolor del comprador",
  problem_buyer_title: "Dónde el comprador pierde dinero, tiempo y crédito interno.",
  problem_buyer_pains: [
    "Precios dispersos entre WhatsApp, email, PDFs y listas desactualizadas — sin una vista única para comparar.",
    "La fiabilidad del proveedor no está clara antes del compromiso: sin forma fácil de comprobar empresa, planta autorizada e historial.",
    "Certificados, trazabilidad, Incoterms, condiciones de pago y documentos se revisan demasiado tarde — normalmente después del pedido.",
    "El coste en destino no está claro sin flete, aranceles, plazos y riesgo de cadena de frío en una sola vista.",
    "La aprobación interna es difícil de defender: finanzas, calidad y dirección quieren un expediente, no un chat reenviado.",
    "Cada temporada el sourcing empieza desde cero — preselecciones, comparaciones y decisiones anteriores se pierden.",
  ],
  problem_supplier_eyebrow: "Mecanismo del lado del proveedor",
  problem_supplier_title: "Qué tiene que ser cierto sobre el proveedor para que el comprador confíe en la operación.",
  problem_supplier_pains: [
    "Registro mercantil, licencia de exportación y número de planta autorizada en archivo — comprobables, no implícitos.",
    "Especificaciones de producto concretas: especie, formato, corte, embalaje, origen, MOQ — sin afirmaciones de marketing.",
    "Certificados y documentos de trazabilidad cargados y vigentes, no prometidos por correo.",
    "Calidad de respuesta visible: tiempo medio de respuesta, integridad de las respuestas, preparación documental.",
    "Historial comercial en la plataforma — ofertas anteriores, solicitudes atendidas, compradores recurrentes.",
    "Visibilidad pagada (Featured / Sponsored) se muestra separada de la verificación — la promoción no es prueba.",
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

  sj_eyebrow: "Mecanismo de confianza del proveedor",
  sj_title: "Cómo Yorso convierte a los proveedores en opciones respaldadas por evidencia para el comprador.",
  sj_subtitle:
    "Los proveedores no compran confianza en Yorso. Aportan evidencia. Yorso la estructura para que el comprador decida. La visibilidad pagada se muestra y se etiqueta de forma separada de la verificación.",
  sj_def_verified_label: "Verified",
  sj_def_verified_body: "Evidencia en archivo — comprobable, no garantía de calidad.",
  sj_def_featured_label: "Featured / Sponsored",
  sj_def_featured_body: "Visibilidad pagada — no cambia el estado de verificación.",
  sj_def_premium_label: "Premium",
  sj_def_premium_body: "Presentación reforzada — nunca se vende como prueba.",
  sj_supplierDoes: "Lo que aporta el proveedor",
  sj_yorsoProvides: "Lo que ve el comprador",
  sj_outcome: "Lo que puede hacer el comprador",
  sj_steps: [
    {
      title: "Evidencia de identidad del proveedor",
      supplier: "Registro mercantil, país de constitución, número de planta autorizada, referencia de licencia de exportación.",
      yorso: "Bloque de identidad en el perfil con estado por elemento: en archivo, parcial o aún no proporcionado.",
      outcome: "Precualificar a la empresa antes de iniciar conversación; solicitar el elemento que falte.",
      concept: "Verified",
    },
    {
      title: "Claridad de producto y capacidad",
      supplier: "Especie (nombre latino), formato, corte, calibre, embalaje, glaseado, MOQ y capacidad mensual.",
      yorso: "Campos de producto estructurados — sin afirmaciones de marketing libres, comparables entre proveedores.",
      outcome: "Comparar igual a igual en la comparativa, sin reconstruir las especificaciones en una hoja.",
      concept: "Verified",
    },
    {
      title: "Preparación para exportar y certificados",
      supplier: "Certificados sanitarios, MSC/ASC cuando aplique, cumplimiento IUU, análisis de laboratorio cargados con vigencia.",
      yorso: "Indicador de preparación documental por oferta — cargado, próximo a vencer o ausente — visible antes del RFQ.",
      outcome: "Detectar un certificado ausente o por vencer antes del pedido, no tras el envío.",
      concept: "Verified",
    },
    {
      title: "Contexto de precio y condiciones",
      supplier: "Precio (rango o exacto, según acceso), Incoterms, condiciones de pago, plazo, ventana de validez.",
      yorso: "Tarjeta de oferta con banda de precio, señales de mercado y referencia ligadas a especie, origen e Incoterms.",
      outcome: "Ver si la oferta queda baja / media / alta frente al contexto de la plataforma para esa ruta.",
      concept: "Neutral",
    },
    {
      title: "Calidad de respuesta",
      supplier: "Responde a las RFQ en formato estructurado, en plazos medibles y con respuestas completas.",
      yorso: "Tiempo medio de respuesta e integridad de respuestas en el perfil — aportado, no prometido.",
      outcome: "Preseleccionar a quienes realmente responden, no a quienes solo lucen bien en el listado.",
      concept: "Neutral",
    },
    {
      title: "Visibilidad pagada — claramente etiquetada",
      supplier: "Puede elegir colocación Featured / Sponsored o presentación Premium para mejorar el descubrimiento.",
      yorso: "Las colocaciones pagadas llevan etiqueta visible. El estado de verificación se muestra al lado, no se sustituye.",
      outcome: "Distinguir promoción de prueba; los proveedores promocionados son más visibles, no más seguros.",
      concept: "Promotion",
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

  vg_eyebrow: "Lo que recibe el comprador",
  vg_title: "Hecho para el lado comprador de la operación.",
  vg_subtitle:
    "El comprador obtiene el espacio de trabajo y la evidencia. Los mecanismos del lado del proveedor existen para que las decisiones del comprador sean más seguras — no se venden por separado. Verified, Sponsored y Premium se mantienen visualmente separados; la colocación pagada nunca se vende como confianza.",
  vg_buyer_eyebrow: "Capacidades del comprador",
  vg_buyer_title: "Decisiones de grado de compra, defendidas internamente.",
  vg_buyer_count: "9 capacidades · basadas en evidencia",
  vg_supplier_eyebrow: "Mecanismo del lado del proveedor",
  vg_supplier_title: "Lo que hace el lado del proveedor para que el comprador decida con seguridad.",
  vg_supplier_count: "Verificación ≠ colocación pagada",
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

  bo_eyebrow: "Resultados",
  bo_title: "Con qué debe quedarse el comprador.",
  bo_subtitle:
    "Resultados operativos que Yorso busca entregar a lo largo de un ciclo de compra — primero el comprador, el proveedor como mecanismo de soporte. Sin métricas de vanidad, sin garantías.",
  bo_buyer_eyebrow: "Resultados para el comprador",
  bo_buyer_title: "Menos riesgo por decisión de compra.",
  bo_supplier_eyebrow: "Resultados para el proveedor (soporte)",
  bo_supplier_title: "Por qué los proveedores cualificados se mantienen activos.",
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
  fc_title: "Empiece como comprador. Los proveedores entran por el lado.",
  fc_subtitle: "Yorso está construido alrededor de la decisión de compra del comprador. Encuentra productos, envía una solicitud, construye el expediente. Los proveedores se suman para aportar la evidencia.",
  fc_buyer_eyebrow: "Vía principal · para compradores",
  fc_buyer_title: "Abastezca con evidencia, no con suposiciones.",
  fc_buyer_body: "Descubra productos y proveedores verificados, solicite acceso al precio exacto y a la identidad del proveedor, y construya un expediente de compra defensible.",
  fc_buyer_bullets: [
    "Búsqueda por especie, formato, origen y certificaciones",
    "Comparación de ofertas y preparación documental lado a lado",
    "Exportar Procurement Decision Proof para aprobación interna",
  ],
  fc_buyer_cta1: "Encontrar productos y proveedores",
  fc_buyer_cta2: "Crear solicitud de compra",
  fc_supplier_eyebrow: "Vía secundaria · para proveedores",
  fc_supplier_title: "Conviértase en una opción respaldada por evidencia para el comprador.",
  fc_supplier_body: "Construya un perfil verificado y aporte la evidencia con la que el comprador decide. La visibilidad pagada está disponible — y se etiqueta por separado.",
  fc_supplier_bullets: [
    "Verified Supplier Trust Pack — evidencia, no insignias",
    "Bandeja de RFQ cualificadas con señales de intención",
    "Presentación Premium — visibilidad, nunca prueba",
  ],
  fc_supplier_cta1: "Convertirse en proveedor verificado",
  fc_supplier_cta2: "Ver detalles para proveedores",
  fc_trustNote_label: "Nota de confianza",
  fc_trustNote_body: "Evidencia verificada, visibilidad pagada e información ausente son cosas separadas. Los compradores ven qué está probado, qué está promocionado y qué aún necesita confirmación.",
  fc_trustNote_proven: "Verified · probado",
  fc_trustNote_promoted: "Promoted · visibilidad pagada",
  fc_trustNote_unconfirmed: "Aún no proporcionado · necesita confirmación",
};

const dictionaries: Record<Language, HowItWorksDict> = { en, ru, es };

export const useHowItWorks = (): HowItWorksDict => {
  const { lang } = useLanguage();
  return dictionaries[lang] ?? dictionaries.en;
};
