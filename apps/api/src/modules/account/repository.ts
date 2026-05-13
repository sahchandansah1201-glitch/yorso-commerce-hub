import type { CompanyProfile, CompanyProfileUpdate, UserProfile } from "../../../../../packages/contracts/dist/index.js";

export interface AccountRepository {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  getCompanyProfile(userId: string): Promise<CompanyProfile | null>;
  updateCompanyProfile(userId: string, update: CompanyProfileUpdate): Promise<CompanyProfile>;
}

const demoUserId = "00000000-0000-4000-8000-000000000001";

const demoUser: UserProfile = {
  id: demoUserId,
  firstName: "Demo",
  lastName: "Buyer",
  email: "buyer@example.com",
  phone: "+1 555 0100",
  preferredLanguage: "en",
  timezone: "Europe/Moscow",
  updatedAt: "2026-05-13T08:00:00.000Z",
};

const demoCompany: CompanyProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  legalName: "Demo Seafood Trading LLC",
  tradeName: "Demo Seafood",
  accountRole: "both",
  countryCode: "NO",
  website: "https://example.com",
  yearFounded: 2014,
  contactEmail: "trade@example.com",
  contactPhone: "+47 11 22 33 44",
  messengerHandle: "+47 11 22 33 44",
  description: "Demo company profile used by the self-hosted API skeleton.",
  productFocus: ["Atlantic Salmon", "Cod"],
  certificates: ["ASC", "MSC"],
  paymentTerms: ["30/70", "LC"],
  publicationStatus: "draft",
  buyerQualificationStatus: "not_started",
  media: {
    logoObjectKey: "companies/demo/logo.webp",
    coverObjectKey: "companies/demo/cover.webp",
    logoAlt: "Demo Seafood logo",
    coverAlt: "Demo Seafood facility",
    logoFit: "contain",
    coverFocalX: 0.5,
    coverFocalY: 0.5,
  },
  updatedAt: "2026-05-13T08:00:00.000Z",
};

const mergeCompanyProfile = (current: CompanyProfile, update: CompanyProfileUpdate): CompanyProfile => ({
  ...current,
  ...update,
  media: update.media ? { ...current.media, ...update.media } : current.media,
  updatedAt: new Date().toISOString(),
});

export class MemoryAccountRepository implements AccountRepository {
  private readonly users = new Map<string, UserProfile>();
  private readonly companies = new Map<string, CompanyProfile>();

  constructor(seed: { user?: UserProfile; company?: CompanyProfile } = {}) {
    this.users.set(seed.user?.id ?? demoUser.id, seed.user ?? demoUser);
    this.companies.set(seed.user?.id ?? demoUser.id, seed.company ?? demoCompany);
  }

  async getUserProfile(userId: string) {
    return this.users.get(userId) ?? null;
  }

  async getCompanyProfile(userId: string) {
    return this.companies.get(userId) ?? null;
  }

  async updateCompanyProfile(userId: string, update: CompanyProfileUpdate) {
    const current = this.companies.get(userId);
    if (!current) throw new Error("company_not_found");

    const next = mergeCompanyProfile(current, update);
    this.companies.set(userId, next);
    return next;
  }
}

export function createDefaultAccountRepository() {
  return new MemoryAccountRepository();
}

export const defaultDemoUserId = demoUserId;
