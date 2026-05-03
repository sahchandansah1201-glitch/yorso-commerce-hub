/**
 * Mock account data model for YORSO Company Operating Profile.
 *
 * Frontend-only. Используется как контракт для последующих форм
 * (личные данные, компания, филиалы, продукты, мета-регионы, уведомления).
 * Никаких реальных персональных данных, паролей или токенов.
 */

export type AccountRole = "buyer" | "supplier" | "both";

export type SupplierPublicationStatus = "draft" | "ready_for_review" | "published";
export type BuyerQualificationStatus = "incomplete" | "ready" | "qualified";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: "en" | "ru" | "es";
  roleInCompany: string;
  timezone: string;
}

export interface CompanyProfile {
  id: string;
  accountRole: AccountRole;
  legalName: string;
  tradeName: string;
  country: string;
  website: string;
  yearFounded: number;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  description: string;
  productFocus: string[];
  certificates: string[];
  paymentTerms: string[];
  supplierPublicationStatus: SupplierPublicationStatus;
  buyerQualificationStatus: BuyerQualificationStatus;
  logoImageUrl: string;
  logoAlt: string;
  logoFit: "contain" | "cover";
  coverImageUrl: string;
  coverAlt: string;
  coverFocalPoint: "center" | "top" | "bottom";
}

export type BranchType =
  | "registered_address"
  | "office"
  | "warehouse"
  | "processing_plant"
  | "sales_office"
  | "loading_point";

export interface CompanyBranch {
  id: string;
  name: string;
  type: BranchType;
  country: string;
  region: string;
  city: string;
  addressLine: string;
  defaultIncoterms: string;
  portOrPickupPoint: string;
  notes: string;
}

export type ProductState = "frozen" | "fresh" | "chilled" | "alive" | "cooked";
export type ProductRole = "buying" | "selling" | "both";

export interface CompanyProduct {
  id: string;
  commercialName: string;
  latinName: string;
  category: string;
  state: ProductState;
  format: string;
  role: ProductRole;
  monthlyVolume: string;
  certificates: string[];
  targetCountries: string[];
}

export type MetaRegionLogisticsReason =
  | "similar_freight_cost"
  | "same_customs_zone"
  | "same_sales_market"
  | "same_warehouse_route"
  | "manual";

export type MetaRegionUsedFor =
  | "notifications"
  | "price_access"
  | "campaigns"
  | "landed_cost"
  | "supplier_matching";

export interface MetaRegion {
  id: string;
  name: string;
  countries: string[];
  logisticsReason: MetaRegionLogisticsReason;
  defaultCurrency: string;
  notes: string;
  usedFor: MetaRegionUsedFor[];
}

export type NotificationChannel = "email" | "messenger" | "in_app" | "agent";

export type NotificationEvent =
  | "price_access_approved"
  | "new_matching_product"
  | "rfq_response"
  | "price_movement"
  | "document_readiness"
  | "country_news"
  | "supplier_profile_review";

export type NotificationFrequency = "instant" | "daily" | "weekly";

export interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
  events: NotificationEvent[];
  frequency: NotificationFrequency;
}

export interface AccountProfile {
  user: UserProfile;
  company: CompanyProfile;
  branches: CompanyBranch[];
  products: CompanyProduct[];
  metaRegions: MetaRegion[];
  notifications: NotificationPreference[];
}

export interface AccountCompletionItem {
  id: string;
  group:
    | "user_profile"
    | "company_profile"
    | "supplier_readiness"
    | "buyer_matching"
    | "notifications";
  labelKey: string;
  done: boolean;
}

// ─── MOCK DATA ─────────────────────────────────────────────────────

export const mockUser: UserProfile = {
  id: "usr_demo_1",
  firstName: "Anna",
  lastName: "Petrova",
  email: "anna.demo@example.com",
  phone: "+34 600 000 000",
  language: "en",
  roleInCompany: "Procurement Lead",
  timezone: "Europe/Madrid",
};

export const mockCompany: CompanyProfile = {
  id: "co_demo_1",
  accountRole: "both",
  legalName: "Atlantic Bridge Seafoods S.L.",
  tradeName: "Atlantic Bridge",
  country: "Spain",
  website: "https://example-atlanticbridge.com",
  yearFounded: 2014,
  contactEmail: "trade@example-atlanticbridge.com",
  contactPhone: "+34 910 000 000",
  whatsapp: "+34 600 111 222",
  description:
    "Demo company for prototype. Trades whitefish, pelagic and frozen shrimp across EU and LATAM corridors.",
  productFocus: ["Cod", "Pollock", "Mackerel", "Vannamei shrimp"],
  certificates: ["MSC", "ASC", "IFS Food", "EU Approval Number"],
  paymentTerms: ["T/T 30% advance", "Letter of Credit at sight", "CAD"],
  supplierPublicationStatus: "ready_for_review",
  buyerQualificationStatus: "ready",
};

export const mockBranches: CompanyBranch[] = [
  {
    id: "br_1",
    name: "HQ Vigo",
    type: "registered_address",
    country: "Spain",
    region: "Galicia",
    city: "Vigo",
    addressLine: "Rúa do Areal 12",
    defaultIncoterms: "EXW",
    portOrPickupPoint: "Vigo HQ",
    notes: "Legal seat and finance team.",
  },
  {
    id: "br_2",
    name: "Cold Storage Algeciras",
    type: "warehouse",
    country: "Spain",
    region: "Andalucía",
    city: "Algeciras",
    addressLine: "Polígono Cortijo Real",
    defaultIncoterms: "FCA",
    portOrPickupPoint: "Port of Algeciras",
    notes: "−25°C frozen storage, 4 200 pallet positions.",
  },
  {
    id: "br_3",
    name: "Klaipeda Processing",
    type: "processing_plant",
    country: "Lithuania",
    region: "Klaipėda County",
    city: "Klaipėda",
    addressLine: "Minijos g. 180",
    defaultIncoterms: "FOB",
    portOrPickupPoint: "Port of Klaipėda",
    notes: "Whitefish reprocessing line, EU approval LT-12.",
  },
  {
    id: "br_4",
    name: "Sales Office Hamburg",
    type: "sales_office",
    country: "Germany",
    region: "Hamburg",
    city: "Hamburg",
    addressLine: "Speicherstadt 4",
    defaultIncoterms: "DAP",
    portOrPickupPoint: "Hamburg buyers",
    notes: "Account managers for DACH retail.",
  },
];

export const mockProducts: CompanyProduct[] = [
  {
    id: "p_1",
    commercialName: "Atlantic Cod H&G",
    latinName: "Gadus morhua",
    category: "Whitefish",
    state: "frozen",
    format: "H&G, IQF, 1-2 / 2-4 kg",
    role: "selling",
    monthlyVolume: "120 t",
    certificates: ["MSC"],
    targetCountries: ["Spain", "Portugal", "France", "Italy"],
  },
  {
    id: "p_2",
    commercialName: "Alaska Pollock Fillet",
    latinName: "Gadus chalcogrammus",
    category: "Whitefish",
    state: "frozen",
    format: "PBI, IQF, interleaved",
    role: "buying",
    monthlyVolume: "80 t",
    certificates: ["MSC"],
    targetCountries: ["Russia", "China", "USA"],
  },
  {
    id: "p_3",
    commercialName: "Vannamei Shrimp",
    latinName: "Litopenaeus vannamei",
    category: "Shrimp",
    state: "frozen",
    format: "HLSO, 16/20, 21/25, IQF",
    role: "both",
    monthlyVolume: "60 t",
    certificates: ["ASC", "BAP"],
    targetCountries: ["Ecuador", "India", "Vietnam", "Spain"],
  },
  {
    id: "p_4",
    commercialName: "Mackerel WR",
    latinName: "Scomber scombrus",
    category: "Pelagic",
    state: "frozen",
    format: "Whole round, 300-500 g",
    role: "selling",
    monthlyVolume: "200 t",
    certificates: ["MSC"],
    targetCountries: ["Nigeria", "Egypt", "Vietnam"],
  },
  {
    id: "p_5",
    commercialName: "Atlantic Salmon Fillet",
    latinName: "Salmo salar",
    category: "Salmonids",
    state: "fresh",
    format: "Trim D, 1-2 / 2-3 kg",
    role: "buying",
    monthlyVolume: "25 t",
    certificates: ["ASC"],
    targetCountries: ["Norway", "Faroe Islands", "Scotland"],
  },
  {
    id: "p_6",
    commercialName: "Live Mussels",
    latinName: "Mytilus galloprovincialis",
    category: "Bivalves",
    state: "alive",
    format: "Net bag 10 kg",
    role: "both",
    monthlyVolume: "40 t",
    certificates: ["EU Health Mark"],
    targetCountries: ["Spain", "Italy", "France"],
  },
];

export const mockMetaRegions: MetaRegion[] = [
  {
    id: "mr_1",
    name: "Iberia",
    countries: ["Spain", "Portugal"],
    logisticsReason: "same_sales_market",
    defaultCurrency: "EUR",
    notes: "Shared retail buyers and similar consumption profile.",
    usedFor: ["notifications", "campaigns", "supplier_matching"],
  },
  {
    id: "mr_2",
    name: "North Atlantic Catch",
    countries: ["Norway", "Iceland", "Faroe Islands", "United Kingdom"],
    logisticsReason: "similar_freight_cost",
    defaultCurrency: "EUR",
    notes: "Source region for cod, haddock and salmon.",
    usedFor: ["price_access", "landed_cost", "supplier_matching"],
  },
  {
    id: "mr_3",
    name: "LATAM Shrimp",
    countries: ["Ecuador", "Peru", "Honduras"],
    logisticsReason: "same_warehouse_route",
    defaultCurrency: "USD",
    notes: "Reefer route via Algeciras / Rotterdam.",
    usedFor: ["landed_cost", "supplier_matching", "notifications"],
  },
  {
    id: "mr_4",
    name: "Asia Pelagic Demand",
    countries: ["Vietnam", "China", "Thailand"],
    logisticsReason: "same_sales_market",
    defaultCurrency: "USD",
    notes: "Demand zone for mackerel and frozen pollock.",
    usedFor: ["campaigns", "notifications"],
  },
];

export const mockNotifications: NotificationPreference[] = [
  {
    id: "n_email",
    channel: "email",
    enabled: true,
    events: ["price_access_approved", "rfq_response", "country_news"],
    frequency: "instant",
  },
  {
    id: "n_messenger",
    channel: "messenger",
    enabled: true,
    events: ["new_matching_product", "price_movement"],
    frequency: "daily",
  },
  {
    id: "n_in_app",
    channel: "in_app",
    enabled: true,
    events: [
      "price_access_approved",
      "new_matching_product",
      "rfq_response",
      "document_readiness",
      "supplier_profile_review",
    ],
    frequency: "instant",
  },
  {
    id: "n_agent",
    channel: "agent",
    enabled: false,
    events: ["price_movement", "country_news"],
    frequency: "weekly",
  },
];

export const mockAccountProfile: AccountProfile = {
  user: mockUser,
  company: mockCompany,
  branches: mockBranches,
  products: mockProducts,
  metaRegions: mockMetaRegions,
  notifications: mockNotifications,
};
