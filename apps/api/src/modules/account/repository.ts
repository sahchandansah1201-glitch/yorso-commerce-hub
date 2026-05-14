import type {
  AccountBranchesUpdate,
  AccountMetaRegionsUpdate,
  AccountNotificationsUpdate,
  AccountProductsUpdate,
  CompanyBranch,
  CompanyBranchCreate,
  CompanyBranchUpdate,
  CompanyProfile,
  CompanyProfileUpdate,
  CompanyProduct,
  CompanyProductCreate,
  CompanyProductUpdate,
  MetaRegion,
  MetaRegionCreate,
  MetaRegionUpdate,
  NotificationPreferenceCreate,
  NotificationPreferenceUpdate,
  NotificationPreference,
  UserProfile,
  UserProfileUpdate,
} from "../../../../../packages/contracts/dist/index.js";

export interface AccountRepository {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, update: UserProfileUpdate): Promise<UserProfile>;
  getCompanyProfile(userId: string): Promise<CompanyProfile | null>;
  updateCompanyProfile(userId: string, update: CompanyProfileUpdate): Promise<CompanyProfile>;
  getBranches(userId: string): Promise<CompanyBranch[]>;
  replaceBranches(userId: string, branches: AccountBranchesUpdate): Promise<CompanyBranch[]>;
  createBranch(userId: string, itemId: string, branch: CompanyBranchCreate): Promise<CompanyBranch>;
  updateBranch(userId: string, itemId: string, update: CompanyBranchUpdate): Promise<CompanyBranch>;
  deleteBranch(userId: string, itemId: string): Promise<CompanyBranch>;
  getProducts(userId: string): Promise<CompanyProduct[]>;
  replaceProducts(userId: string, products: AccountProductsUpdate): Promise<CompanyProduct[]>;
  createProduct(userId: string, itemId: string, product: CompanyProductCreate): Promise<CompanyProduct>;
  updateProduct(userId: string, itemId: string, update: CompanyProductUpdate): Promise<CompanyProduct>;
  deleteProduct(userId: string, itemId: string): Promise<CompanyProduct>;
  getMetaRegions(userId: string): Promise<MetaRegion[]>;
  replaceMetaRegions(userId: string, metaRegions: AccountMetaRegionsUpdate): Promise<MetaRegion[]>;
  createMetaRegion(userId: string, itemId: string, metaRegion: MetaRegionCreate): Promise<MetaRegion>;
  updateMetaRegion(userId: string, itemId: string, update: MetaRegionUpdate): Promise<MetaRegion>;
  deleteMetaRegion(userId: string, itemId: string): Promise<MetaRegion>;
  getNotifications(userId: string): Promise<NotificationPreference[]>;
  replaceNotifications(userId: string, notifications: AccountNotificationsUpdate): Promise<NotificationPreference[]>;
  createNotification(userId: string, itemId: string, notification: NotificationPreferenceCreate): Promise<NotificationPreference>;
  updateNotification(userId: string, itemId: string, update: NotificationPreferenceUpdate): Promise<NotificationPreference>;
  deleteNotification(userId: string, itemId: string): Promise<NotificationPreference>;
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

const demoBranches: CompanyBranch[] = [
  {
    id: "br_1",
    name: "HQ Vigo",
    type: "registered_address",
    country: "Spain",
    region: "Galicia",
    city: "Vigo",
    addressLine: "Rua do Areal 12",
    defaultIncoterms: "EXW",
    portOrPickupPoint: "Vigo HQ",
    notes: "Legal seat and finance team.",
  },
  {
    id: "br_2",
    name: "Cold Storage Algeciras",
    type: "warehouse",
    country: "Spain",
    region: "Andalucia",
    city: "Algeciras",
    addressLine: "Poligono Cortijo Real",
    defaultIncoterms: "FCA",
    portOrPickupPoint: "Port of Algeciras",
    notes: "-25C frozen storage, 4 200 pallet positions.",
  },
];

const demoProducts: CompanyProduct[] = [
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
    commercialName: "Vannamei Shrimp",
    latinName: "Litopenaeus vannamei",
    category: "Shrimp",
    state: "frozen",
    format: "HLSO, IQF",
    role: "both",
    monthlyVolume: "60 t",
    certificates: ["ASC", "BAP"],
    targetCountries: ["Ecuador", "India", "Vietnam", "Spain"],
  },
];

const demoMetaRegions: MetaRegion[] = [
  {
    id: "mr_1",
    name: "Iberia",
    countries: ["Spain", "Portugal"],
    logisticsReason: "same_sales_market",
    defaultCurrency: "EUR",
    notes: "Shared retail buyers and similar consumption profile.",
    usedFor: ["notifications", "campaigns", "supplier_matching"],
  },
];

const demoNotifications: NotificationPreference[] = [
  {
    id: "n_email",
    channel: "email",
    enabled: true,
    events: ["price_access_approved", "rfq_response", "country_news"],
    frequency: "instant",
  },
  {
    id: "n_in_app",
    channel: "in_app",
    enabled: true,
    events: ["price_access_approved", "new_matching_product", "document_readiness"],
    frequency: "instant",
  },
];

const cloneList = <T>(items: readonly T[]): T[] => items.map((item) => ({ ...item }));

function createWorkspaceItem<T extends { id: string }, C extends Omit<T, "id">>(
  items: T[],
  itemId: string,
  create: C,
): T {
  if (items.some((item) => item.id === itemId)) throw new Error("workspace_item_conflict");
  const item = { id: itemId, ...create } as unknown as T;
  items.push(item);
  return { ...item };
}

function updateWorkspaceItem<T extends { id: string }, U extends Partial<Omit<T, "id">>>(
  items: T[],
  itemId: string,
  update: U,
): T {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) throw new Error("workspace_item_not_found");
  const item = { ...items[index], ...update };
  items[index] = item;
  return { ...item };
}

function deleteWorkspaceItem<T extends { id: string }>(items: T[], itemId: string): T {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) throw new Error("workspace_item_not_found");
  const [item] = items.splice(index, 1);
  return { ...item };
}

export class MemoryAccountRepository implements AccountRepository {
  private readonly users = new Map<string, UserProfile>();
  private readonly companies = new Map<string, CompanyProfile>();
  private readonly branches = new Map<string, CompanyBranch[]>();
  private readonly products = new Map<string, CompanyProduct[]>();
  private readonly metaRegions = new Map<string, MetaRegion[]>();
  private readonly notifications = new Map<string, NotificationPreference[]>();

  constructor(seed: {
    user?: UserProfile;
    company?: CompanyProfile;
    branches?: CompanyBranch[];
    products?: CompanyProduct[];
    metaRegions?: MetaRegion[];
    notifications?: NotificationPreference[];
  } = {}) {
    const userId = seed.user?.id ?? demoUser.id;
    this.users.set(userId, seed.user ?? demoUser);
    this.companies.set(userId, seed.company ?? demoCompany);
    this.branches.set(userId, cloneList(seed.branches ?? demoBranches));
    this.products.set(userId, cloneList(seed.products ?? demoProducts));
    this.metaRegions.set(userId, cloneList(seed.metaRegions ?? demoMetaRegions));
    this.notifications.set(userId, cloneList(seed.notifications ?? demoNotifications));
  }

  async getUserProfile(userId: string) {
    return this.users.get(userId) ?? null;
  }

  async updateUserProfile(userId: string, update: UserProfileUpdate) {
    const current = this.users.get(userId);
    if (!current) throw new Error("user_not_found");

    const next: UserProfile = {
      ...current,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, next);
    return next;
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

  async getBranches(userId: string) {
    return cloneList(this.branches.get(userId) ?? []);
  }

  async replaceBranches(userId: string, branches: AccountBranchesUpdate) {
    this.branches.set(userId, cloneList(branches));
    return this.getBranches(userId);
  }

  async createBranch(userId: string, itemId: string, branch: CompanyBranchCreate) {
    const items = this.branches.get(userId) ?? [];
    const created = createWorkspaceItem(items, itemId, branch);
    this.branches.set(userId, items);
    return created;
  }

  async updateBranch(userId: string, itemId: string, update: CompanyBranchUpdate) {
    const items = this.branches.get(userId) ?? [];
    const updated = updateWorkspaceItem(items, itemId, update);
    this.branches.set(userId, items);
    return updated;
  }

  async deleteBranch(userId: string, itemId: string) {
    const items = this.branches.get(userId) ?? [];
    const deleted = deleteWorkspaceItem(items, itemId);
    this.branches.set(userId, items);
    return deleted;
  }

  async getProducts(userId: string) {
    return cloneList(this.products.get(userId) ?? []);
  }

  async replaceProducts(userId: string, products: AccountProductsUpdate) {
    this.products.set(userId, cloneList(products));
    return this.getProducts(userId);
  }

  async createProduct(userId: string, itemId: string, product: CompanyProductCreate) {
    const items = this.products.get(userId) ?? [];
    const created = createWorkspaceItem(items, itemId, product);
    this.products.set(userId, items);
    return created;
  }

  async updateProduct(userId: string, itemId: string, update: CompanyProductUpdate) {
    const items = this.products.get(userId) ?? [];
    const updated = updateWorkspaceItem(items, itemId, update);
    this.products.set(userId, items);
    return updated;
  }

  async deleteProduct(userId: string, itemId: string) {
    const items = this.products.get(userId) ?? [];
    const deleted = deleteWorkspaceItem(items, itemId);
    this.products.set(userId, items);
    return deleted;
  }

  async getMetaRegions(userId: string) {
    return cloneList(this.metaRegions.get(userId) ?? []);
  }

  async replaceMetaRegions(userId: string, metaRegions: AccountMetaRegionsUpdate) {
    this.metaRegions.set(userId, cloneList(metaRegions));
    return this.getMetaRegions(userId);
  }

  async createMetaRegion(userId: string, itemId: string, metaRegion: MetaRegionCreate) {
    const items = this.metaRegions.get(userId) ?? [];
    const created = createWorkspaceItem(items, itemId, metaRegion);
    this.metaRegions.set(userId, items);
    return created;
  }

  async updateMetaRegion(userId: string, itemId: string, update: MetaRegionUpdate) {
    const items = this.metaRegions.get(userId) ?? [];
    const updated = updateWorkspaceItem(items, itemId, update);
    this.metaRegions.set(userId, items);
    return updated;
  }

  async deleteMetaRegion(userId: string, itemId: string) {
    const items = this.metaRegions.get(userId) ?? [];
    const deleted = deleteWorkspaceItem(items, itemId);
    this.metaRegions.set(userId, items);
    return deleted;
  }

  async getNotifications(userId: string) {
    return cloneList(this.notifications.get(userId) ?? []);
  }

  async replaceNotifications(userId: string, notifications: AccountNotificationsUpdate) {
    this.notifications.set(userId, cloneList(notifications));
    return this.getNotifications(userId);
  }

  async createNotification(userId: string, itemId: string, notification: NotificationPreferenceCreate) {
    const items = this.notifications.get(userId) ?? [];
    const created = createWorkspaceItem(items, itemId, notification);
    this.notifications.set(userId, items);
    return created;
  }

  async updateNotification(userId: string, itemId: string, update: NotificationPreferenceUpdate) {
    const items = this.notifications.get(userId) ?? [];
    const updated = updateWorkspaceItem(items, itemId, update);
    this.notifications.set(userId, items);
    return updated;
  }

  async deleteNotification(userId: string, itemId: string) {
    const items = this.notifications.get(userId) ?? [];
    const deleted = deleteWorkspaceItem(items, itemId);
    this.notifications.set(userId, items);
    return deleted;
  }
}

export const defaultDemoUserId = demoUserId;
