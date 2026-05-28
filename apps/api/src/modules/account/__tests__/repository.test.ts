import { describe, expect, it } from "vitest";
import { loadApiConfig } from "../../../config.js";
import { createAccountRepository } from "../factory.js";
import { PostgresAccountRepository, type AccountQueryClient } from "../postgres-repository.js";
import { MemoryAccountRepository } from "../repository.js";

const demoUserId = "00000000-0000-4000-8000-000000000001";
const demoCompanyId = "11111111-1111-4111-8111-111111111111";

type QueryCall = {
  sql: string;
  params: readonly unknown[];
};

type FakeUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_language: "en" | "ru" | "es";
  timezone: string;
  updated_at: Date;
};

type FakeCompanyRow = {
  id: string;
  owner_user_id: string;
  legal_name: string;
  trade_name: string;
  account_role: "buyer" | "supplier" | "both";
  country_code: string;
  website: string | null;
  year_founded: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  messenger_handle: string | null;
  description: string | null;
  product_focus: string[];
  certificates: string[];
  payment_terms: string[];
  publication_status: "draft" | "review" | "published" | "blocked";
  buyer_qualification_status: "not_started" | "pending" | "qualified" | "rejected";
  logo_object_key: string | null;
  cover_object_key: string | null;
  logo_alt: string | null;
  cover_alt: string | null;
  logo_fit: "contain" | "cover";
  cover_focal_x: string;
  cover_focal_y: string;
  updated_at: Date;
};

type FakeBranchRow = {
  id: string;
  company_id: string;
  name: string;
  type: "registered_address" | "office" | "warehouse" | "processing_plant" | "sales_office" | "loading_point";
  country: string;
  region: string;
  city: string;
  address_line: string;
  default_incoterms: string;
  port_or_pickup_point: string;
  notes: string;
  position: number;
  updated_at: Date;
};

type FakeProductRow = {
  id: string;
  company_id: string;
  commercial_name: string;
  latin_name: string;
  category: string;
  state: "frozen" | "fresh" | "chilled" | "alive" | "cooked";
  format: string;
  role: "buying" | "selling" | "both";
  monthly_volume: string;
  certificates: string[];
  target_countries: string[];
  position: number;
  updated_at: Date;
};

type FakeMetaRegionRow = {
  id: string;
  company_id: string;
  name: string;
  countries: string[];
  logistics_reason: "similar_freight_cost" | "same_customs_zone" | "same_sales_market" | "same_warehouse_route" | "manual";
  default_currency: string;
  notes: string;
  used_for: Array<"notifications" | "price_access" | "campaigns" | "landed_cost" | "supplier_matching">;
  position: number;
  updated_at: Date;
};

type FakeNotificationRow = {
  id: string;
  user_id: string;
  channel: "email" | "messenger" | "in_app" | "agent";
  enabled: boolean;
  events: Array<
    | "price_access_approved"
    | "new_matching_product"
    | "rfq_response"
    | "price_movement"
    | "document_readiness"
    | "country_news"
    | "supplier_profile_review"
  >;
  frequency: "instant" | "daily" | "weekly";
  position: number;
  updated_at: Date;
};

class FakeAccountPgClient implements AccountQueryClient {
  readonly calls: QueryCall[] = [];
  user: FakeUserRow = {
    id: demoUserId,
    first_name: "Demo",
    last_name: "Buyer",
    email: "buyer@example.com",
    phone: "+1 555 0100",
    preferred_language: "en",
    timezone: "Europe/Moscow",
    updated_at: new Date("2026-05-13T08:00:00.000Z"),
  };
  company: FakeCompanyRow | null = {
    id: demoCompanyId,
    owner_user_id: demoUserId,
    legal_name: "Demo Seafood Trading LLC",
    trade_name: "Demo Seafood",
    account_role: "both",
    country_code: "NO",
    website: "https://example.com",
    year_founded: 2014,
    contact_email: "trade@example.com",
    contact_phone: "+47 11 22 33 44",
    messenger_handle: "+47 11 22 33 44",
    description: "Demo company profile used by the self-hosted API PostgreSQL repository.",
    product_focus: ["Atlantic Salmon", "Cod"],
    certificates: ["ASC", "MSC"],
    payment_terms: ["30/70", "LC"],
    publication_status: "draft",
    buyer_qualification_status: "not_started",
    logo_object_key: "companies/demo/logo.webp",
    cover_object_key: "companies/demo/cover.webp",
    logo_alt: "Demo Seafood logo",
    cover_alt: "Demo Seafood facility",
    logo_fit: "contain",
    cover_focal_x: "0.500",
    cover_focal_y: "0.500",
    updated_at: new Date("2026-05-13T08:00:00.000Z"),
  };
  branches: FakeBranchRow[] = [
    {
      id: "br_1",
      company_id: demoCompanyId,
      name: "HQ Vigo",
      type: "registered_address",
      country: "Spain",
      region: "Galicia",
      city: "Vigo",
      address_line: "Rua do Areal 12",
      default_incoterms: "EXW",
      port_or_pickup_point: "Vigo HQ",
      notes: "Legal seat.",
      position: 0,
      updated_at: new Date("2026-05-13T08:00:00.000Z"),
    },
  ];
  products: FakeProductRow[] = [
    {
      id: "p_1",
      company_id: demoCompanyId,
      commercial_name: "Atlantic Cod H&G",
      latin_name: "Gadus morhua",
      category: "Whitefish",
      state: "frozen",
      format: "H&G",
      role: "selling",
      monthly_volume: "120 t",
      certificates: ["MSC"],
      target_countries: ["Spain"],
      position: 0,
      updated_at: new Date("2026-05-13T08:00:00.000Z"),
    },
  ];
  metaRegions: FakeMetaRegionRow[] = [
    {
      id: "mr_1",
      company_id: demoCompanyId,
      name: "Iberia",
      countries: ["Spain", "Portugal"],
      logistics_reason: "same_sales_market",
      default_currency: "EUR",
      notes: "Shared buyers.",
      used_for: ["notifications"],
      position: 0,
      updated_at: new Date("2026-05-13T08:00:00.000Z"),
    },
  ];
  notifications: FakeNotificationRow[] = [
    {
      id: "n_email",
      user_id: demoUserId,
      channel: "email",
      enabled: true,
      events: ["price_access_approved"],
      frequency: "instant",
      position: 0,
      updated_at: new Date("2026-05-13T08:00:00.000Z"),
    },
  ];

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(sql: string, params: readonly unknown[] = []) {
    this.calls.push({ sql, params });
    const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized.startsWith("with account_company as")) {
      const allVersions = [
        this.user.updated_at,
        this.company?.updated_at,
        ...this.branches.map((branch) => branch.updated_at),
        ...this.products.map((product) => product.updated_at),
        ...this.metaRegions.map((metaRegion) => metaRegion.updated_at),
        ...this.notifications.map((notification) => notification.updated_at),
      ].filter(Boolean) as Date[];
      const accountVersion = new Date(Math.max(...allVersions.map((date) => date.getTime())));
      return { rows: [{ account_version: accountVersion } as unknown as Row] };
    }

    if (normalized.includes("from yorso_users")) {
      return { rows: params[0] === this.user.id ? ([this.user] as unknown as Row[]) : [] };
    }

    if (normalized.startsWith("update yorso_users")) {
      const userId = params[params.length - 1];
      if (userId !== this.user.id) return { rows: [] };

      if (normalized.includes("updated_at = now()")) {
        this.user = {
          ...this.user,
          updated_at: new Date("2026-05-13T09:00:00.000Z"),
        };
      }

      const assignments = [
        ["first_name", "first_name"],
        ["last_name", "last_name"],
        ["email", "email"],
        ["phone", "phone"],
        ["preferred_language", "preferred_language"],
        ["timezone", "timezone"],
      ] as const;

      let paramIndex = 0;
      for (const [column, key] of assignments) {
        if (!normalized.includes(`${column} = $`)) continue;
        this.user = {
          ...this.user,
          [key]: params[paramIndex],
          updated_at: new Date("2026-05-13T09:00:00.000Z"),
        };
        paramIndex += 1;
      }

      return { rows: [this.user] as unknown as Row[] };
    }

    if (normalized.includes("from yorso_companies") && normalized.includes("left join yorso_company_media")) {
      return { rows: this.company && params[0] === this.company.owner_user_id ? ([this.company] as unknown as Row[]) : [] };
    }

    if (normalized.startsWith("update yorso_companies")) {
      if (!this.company) return { rows: [] };

      const companyId = params[params.length - 1];
      if (companyId !== this.company.id) return { rows: [] };

      if (normalized.includes("updated_at = now()")) {
        this.company = {
          ...this.company,
          updated_at: new Date("2026-05-13T09:00:00.000Z"),
        };
      }

      const assignments = [
        ["legal_name", "legal_name"],
        ["trade_name", "trade_name"],
        ["account_role", "account_role"],
        ["country_code", "country_code"],
        ["website", "website"],
        ["year_founded", "year_founded"],
        ["contact_email", "contact_email"],
        ["contact_phone", "contact_phone"],
        ["messenger_handle", "messenger_handle"],
        ["description", "description"],
        ["product_focus", "product_focus"],
        ["certificates", "certificates"],
        ["payment_terms", "payment_terms"],
        ["publication_status", "publication_status"],
        ["buyer_qualification_status", "buyer_qualification_status"],
      ] as const;

      let paramIndex = 0;
      for (const [column, key] of assignments) {
        if (!normalized.includes(`${column} = $`)) continue;
        this.company = {
          ...this.company,
          [key]: params[paramIndex],
          updated_at: new Date("2026-05-13T09:00:00.000Z"),
        };
        paramIndex += 1;
      }

      return { rows: [] };
    }

    if (normalized.startsWith("insert into yorso_company_media")) {
      if (!this.company) return { rows: [] };

      const [
        companyId,
        logoObjectKey,
        coverObjectKey,
        logoAlt,
        coverAlt,
        logoFit,
        coverFocalX,
        coverFocalY,
      ] = params;
      if (companyId !== this.company.id) return { rows: [] };

      this.company = {
        ...this.company,
        logo_object_key: logoObjectKey as string | null,
        cover_object_key: coverObjectKey as string | null,
        logo_alt: logoAlt as string | null,
        cover_alt: coverAlt as string | null,
        logo_fit: logoFit as "contain" | "cover",
        cover_focal_x: String(coverFocalX),
        cover_focal_y: String(coverFocalY),
        updated_at: new Date("2026-05-13T09:00:00.000Z"),
      };
      return { rows: [] };
    }

    if (normalized.includes("from yorso_company_branches") && !normalized.startsWith("delete from")) {
      return {
        rows: this.company && params[0] === this.company.owner_user_id
          ? (this.branches as unknown as Row[])
          : [],
      };
    }

    if (normalized.startsWith("delete from yorso_company_branches")) {
      this.branches = this.branches.filter((branch) => branch.company_id !== params[0]);
      return { rows: [] };
    }

    if (normalized.startsWith("insert into yorso_company_branches")) {
      this.branches.push({
        id: params[0] as string,
        company_id: params[1] as string,
        name: params[2] as string,
        type: params[3] as FakeBranchRow["type"],
        country: params[4] as string,
        region: params[5] as string,
        city: params[6] as string,
        address_line: params[7] as string,
        default_incoterms: params[8] as string,
        port_or_pickup_point: params[9] as string,
        notes: params[10] as string,
        position: params[11] as number,
        updated_at: new Date("2026-05-13T09:00:00.000Z"),
      });
      return { rows: [] };
    }

    if (normalized.includes("from yorso_company_products") && !normalized.startsWith("delete from")) {
      return {
        rows: this.company && params[0] === this.company.owner_user_id
          ? (this.products as unknown as Row[])
          : [],
      };
    }

    if (normalized.startsWith("delete from yorso_company_products")) {
      this.products = this.products.filter((product) => product.company_id !== params[0]);
      return { rows: [] };
    }

    if (normalized.startsWith("insert into yorso_company_products")) {
      this.products.push({
        id: params[0] as string,
        company_id: params[1] as string,
        commercial_name: params[2] as string,
        latin_name: params[3] as string,
        category: params[4] as string,
        state: params[5] as FakeProductRow["state"],
        format: params[6] as string,
        role: params[7] as FakeProductRow["role"],
        monthly_volume: params[8] as string,
        certificates: params[9] as string[],
        target_countries: params[10] as string[],
        position: params[11] as number,
        updated_at: new Date("2026-05-13T09:00:00.000Z"),
      });
      return { rows: [] };
    }

    if (normalized.includes("from yorso_company_meta_regions") && !normalized.startsWith("delete from")) {
      return {
        rows: this.company && params[0] === this.company.owner_user_id
          ? (this.metaRegions as unknown as Row[])
          : [],
      };
    }

    if (normalized.startsWith("delete from yorso_company_meta_regions")) {
      this.metaRegions = this.metaRegions.filter((metaRegion) => metaRegion.company_id !== params[0]);
      return { rows: [] };
    }

    if (normalized.startsWith("insert into yorso_company_meta_regions")) {
      this.metaRegions.push({
        id: params[0] as string,
        company_id: params[1] as string,
        name: params[2] as string,
        countries: params[3] as string[],
        logistics_reason: params[4] as FakeMetaRegionRow["logistics_reason"],
        default_currency: params[5] as string,
        notes: params[6] as string,
        used_for: params[7] as FakeMetaRegionRow["used_for"],
        position: params[8] as number,
        updated_at: new Date("2026-05-13T09:00:00.000Z"),
      });
      return { rows: [] };
    }

    if (normalized.includes("from yorso_notification_preferences") && !normalized.startsWith("delete from")) {
      return {
        rows: params[0] === this.user.id ? (this.notifications as unknown as Row[]) : [],
      };
    }

    if (normalized.startsWith("delete from yorso_notification_preferences")) {
      this.notifications = this.notifications.filter((notification) => notification.user_id !== params[0]);
      return { rows: [] };
    }

    if (normalized.startsWith("insert into yorso_notification_preferences")) {
      this.notifications.push({
        id: params[0] as string,
        user_id: params[1] as string,
        channel: params[2] as FakeNotificationRow["channel"],
        enabled: params[3] as boolean,
        events: params[4] as FakeNotificationRow["events"],
        frequency: params[5] as FakeNotificationRow["frequency"],
        position: params[6] as number,
        updated_at: new Date("2026-05-13T09:00:00.000Z"),
      });
      return { rows: [] };
    }

    throw new Error(`Unhandled SQL in fake client: ${sql}`);
  }
}

const createPostgresRepository = (client = new FakeAccountPgClient()) => ({
  client,
  repository: new PostgresAccountRepository(
    {
      databaseUrl: "postgres://yorso_app:secret@localhost:6432/yorso",
    },
    { client },
  ),
});

describe("account repositories", () => {
  it("memory repository persists company updates inside one process", async () => {
    const repository = new MemoryAccountRepository();

    const before = await repository.getCompanyProfile(demoUserId);
    const after = await repository.updateCompanyProfile(demoUserId, {
      tradeName: "Memory Repo Seafood",
      countryCode: "IS",
    });
    const reread = await repository.getCompanyProfile(demoUserId);

    expect(before?.tradeName).toBe("Demo Seafood");
    expect(after.tradeName).toBe("Memory Repo Seafood");
    expect(after.countryCode).toBe("IS");
    expect(reread?.tradeName).toBe("Memory Repo Seafood");
  });

  it("memory repository persists user updates inside one process", async () => {
    const repository = new MemoryAccountRepository();

    const after = await repository.updateUserProfile(demoUserId, {
      firstName: "Memory",
      preferredLanguage: "ru",
    });
    const reread = await repository.getUserProfile(demoUserId);

    expect(after.firstName).toBe("Memory");
    expect(after.preferredLanguage).toBe("ru");
    expect(reread?.firstName).toBe("Memory");
  });

  it("memory repository persists workspace section replacements inside one process", async () => {
    const repository = new MemoryAccountRepository();

    await repository.replaceBranches(demoUserId, [
      {
        id: "br_memory",
        name: "Memory Branch",
        type: "loading_point",
        country: "Spain",
        region: "Galicia",
        city: "Vigo",
        addressLine: "Terminal 1",
        defaultIncoterms: "FCA",
        portOrPickupPoint: "Vigo",
        notes: "Memory branch.",
      },
    ]);
    await repository.replaceProducts(demoUserId, [
      {
        id: "p_memory",
        commercialName: "Memory Cod",
        latinName: "Gadus morhua",
        category: "Whitefish",
        state: "frozen",
        format: "H&G",
        role: "selling",
        monthlyVolume: "10 t",
        certificates: ["MSC"],
        targetCountries: ["Spain"],
      },
    ]);

    expect(await repository.getBranches(demoUserId)).toEqual([
      expect.objectContaining({ id: "br_memory" }),
    ]);
    expect(await repository.getProducts(demoUserId)).toEqual([
      expect.objectContaining({ id: "p_memory" }),
    ]);
  });

  it("memory repository supports row-level workspace CRUD", async () => {
    const repository = new MemoryAccountRepository();

    const createdBranch = await repository.createBranch(demoUserId, "br_row", {
      name: "Row Branch",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Terminal 33",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund",
      notes: "Row branch.",
    });
    expect(createdBranch).toMatchObject({ id: "br_row", city: "Alesund" });
    await expect(repository.createBranch(demoUserId, "br_row", {
      name: "Duplicate Branch",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Terminal 33",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund",
      notes: "Duplicate row branch.",
    })).rejects.toThrow("workspace_item_conflict");

    const updatedProduct = await repository.updateProduct(demoUserId, "p_1", {
      monthlyVolume: "180 t",
      targetCountries: ["Spain", "France"],
    });
    expect(updatedProduct).toMatchObject({ id: "p_1", monthlyVolume: "180 t" });

    const deletedMetaRegion = await repository.deleteMetaRegion(demoUserId, "mr_1");
    expect(deletedMetaRegion).toMatchObject({ id: "mr_1" });
    await expect(repository.deleteMetaRegion(demoUserId, "mr_1")).rejects.toThrow("workspace_item_not_found");
  });

  it("memory repository bumps the account version after workspace mutations", async () => {
    const repository = new MemoryAccountRepository();

    const before = await repository.getAccountVersion(demoUserId);
    await repository.updateUserProfile(demoUserId, { firstName: "Versioned" });
    const afterUserUpdate = await repository.getAccountVersion(demoUserId);
    await repository.deleteBranch(demoUserId, "br_1");
    const afterBranchDelete = await repository.getAccountVersion(demoUserId);

    expect(afterUserUpdate).not.toBe(before);
    expect(afterBranchDelete).not.toBe(afterUserUpdate);
  });

  it("factory selects memory repository by default", () => {
    const config = loadApiConfig({ NODE_ENV: "test" }, { allowLocalDefaults: true });
    const repository = createAccountRepository(config);

    expect(repository).toBeInstanceOf(MemoryAccountRepository);
  });

  it("factory selects postgres repository when ACCOUNT_REPOSITORY=postgres", () => {
    const config = loadApiConfig(
      {
        NODE_ENV: "test",
        ACCOUNT_REPOSITORY: "postgres",
        DATABASE_URL: "postgres://yorso_app:secret@localhost:6432/yorso",
      },
      { allowLocalDefaults: true },
    );
    const repository = createAccountRepository(config);

    expect(repository).toBeInstanceOf(PostgresAccountRepository);
  });

  it("postgres repository rejects non-postgres URLs", () => {
    expect(
      () =>
        new PostgresAccountRepository({
          databaseUrl: "mysql://yorso_app:secret@localhost:3306/yorso",
        }),
    ).toThrow(/requires a PostgreSQL DATABASE_URL/);
  });

  it("postgres repository maps user rows to the account contract", async () => {
    const { client, repository } = createPostgresRepository();

    const user = await repository.getUserProfile(demoUserId);

    expect(user).toMatchObject({
      id: demoUserId,
      firstName: "Demo",
      lastName: "Buyer",
      email: "buyer@example.com",
      preferredLanguage: "en",
      timezone: "Europe/Moscow",
      updatedAt: "2026-05-13T08:00:00.000Z",
    });
    expect(client.calls.at(-1)?.sql).toContain("from yorso_users");
  });

  it("postgres repository updates user fields and returns the saved profile", async () => {
    const { client, repository } = createPostgresRepository();

    const updated = await repository.updateUserProfile(demoUserId, {
      firstName: "Postgres",
      lastName: "Buyer",
      email: "postgres.buyer@example.com",
      phone: null,
      preferredLanguage: "ru",
      timezone: "Europe/Moscow",
    });

    expect(updated).toMatchObject({
      firstName: "Postgres",
      email: "postgres.buyer@example.com",
      phone: null,
      preferredLanguage: "ru",
    });
    expect(client.calls.some((call) => call.sql.includes("update yorso_users"))).toBe(true);
  });

  it("postgres repository computes a single account version across profile and workspace tables", async () => {
    const { client, repository } = createPostgresRepository();

    const before = await repository.getAccountVersion(demoUserId);
    await repository.updateUserProfile(demoUserId, { firstName: "Versioned" });
    const afterUserUpdate = await repository.getAccountVersion(demoUserId);

    expect(before).toBe("2026-05-13T08:00:00.000Z");
    expect(afterUserUpdate).toBe("2026-05-13T09:00:00.000Z");
    expect(client.calls.some((call) => call.sql.includes("with account_company as"))).toBe(true);
  });

  it("postgres repository maps company and media rows to the account contract", async () => {
    const { repository } = createPostgresRepository();

    const company = await repository.getCompanyProfile(demoUserId);

    expect(company).toMatchObject({
      id: demoCompanyId,
      legalName: "Demo Seafood Trading LLC",
      tradeName: "Demo Seafood",
      accountRole: "both",
      countryCode: "NO",
      productFocus: ["Atlantic Salmon", "Cod"],
      certificates: ["ASC", "MSC"],
      media: {
        logoObjectKey: "companies/demo/logo.webp",
        coverObjectKey: "companies/demo/cover.webp",
        logoFit: "contain",
        coverFocalX: 0.5,
        coverFocalY: 0.5,
      },
    });
  });

  it("postgres repository updates scalar company fields and rereads the saved profile", async () => {
    const { client, repository } = createPostgresRepository();

    const updated = await repository.updateCompanyProfile(demoUserId, {
      tradeName: "Postgres Buyer Export",
      accountRole: "supplier",
      countryCode: "IS",
      productFocus: ["Mackerel", "Cod"],
      paymentTerms: ["LC"],
      publicationStatus: "review",
    });

    expect(updated).toMatchObject({
      tradeName: "Postgres Buyer Export",
      accountRole: "supplier",
      countryCode: "IS",
      productFocus: ["Mackerel", "Cod"],
      paymentTerms: ["LC"],
      publicationStatus: "review",
      media: {
        logoObjectKey: "companies/demo/logo.webp",
      },
    });
    expect(client.calls.some((call) => call.sql.includes("update yorso_companies"))).toBe(true);
  });

  it("postgres repository upserts company media without replacing untouched profile fields", async () => {
    const { client, repository } = createPostgresRepository();

    const updated = await repository.updateCompanyProfile(demoUserId, {
      media: {
        logoObjectKey: "companies/demo/new-logo.webp",
        coverObjectKey: null,
        logoAlt: "New logo alt",
        coverAlt: null,
        logoFit: "cover",
        coverFocalX: 0.25,
        coverFocalY: 0.75,
      },
    });

    expect(updated).toMatchObject({
      tradeName: "Demo Seafood",
      media: {
        logoObjectKey: "companies/demo/new-logo.webp",
        coverObjectKey: null,
        logoAlt: "New logo alt",
        coverAlt: null,
        logoFit: "cover",
        coverFocalX: 0.25,
        coverFocalY: 0.75,
      },
    });
    expect(client.calls.some((call) => call.sql.includes("insert into yorso_company_media"))).toBe(true);
  });

  it("postgres repository replaces workspace sections and rereads them", async () => {
    const { client, repository } = createPostgresRepository();

    const branches = await repository.replaceBranches(demoUserId, [
      {
        id: "br_pg",
        name: "Postgres Branch",
        type: "warehouse",
        country: "Spain",
        region: "Galicia",
        city: "Vigo",
        addressLine: "Warehouse 1",
        defaultIncoterms: "FCA",
        portOrPickupPoint: "Vigo",
        notes: "Postgres branch.",
      },
    ]);
    const products = await repository.replaceProducts(demoUserId, [
      {
        id: "p_pg",
        commercialName: "Postgres Mackerel",
        latinName: "Scomber scombrus",
        category: "Pelagic",
        state: "frozen",
        format: "WR",
        role: "selling",
        monthlyVolume: "200 t",
        certificates: ["MSC"],
        targetCountries: ["Nigeria"],
      },
    ]);
    const metaRegions = await repository.replaceMetaRegions(demoUserId, [
      {
        id: "mr_pg",
        name: "Postgres Iberia",
        countries: ["Spain", "Portugal"],
        logisticsReason: "same_sales_market",
        defaultCurrency: "EUR",
        notes: "Postgres region.",
        usedFor: ["notifications"],
      },
    ]);
    const notifications = await repository.replaceNotifications(demoUserId, [
      {
        id: "n_pg",
        channel: "email",
        enabled: true,
        events: ["price_access_approved"],
        frequency: "weekly",
      },
    ]);

    expect(branches).toEqual([expect.objectContaining({ id: "br_pg", defaultIncoterms: "FCA" })]);
    expect(products).toEqual([expect.objectContaining({ id: "p_pg", role: "selling" })]);
    expect(metaRegions).toEqual([expect.objectContaining({ id: "mr_pg", defaultCurrency: "EUR" })]);
    expect(notifications).toEqual([expect.objectContaining({ id: "n_pg", frequency: "weekly" })]);
    expect(client.calls.some((call) => call.sql.includes("delete from yorso_company_products"))).toBe(true);
    expect(client.calls.some((call) => call.sql.includes("insert into yorso_notification_preferences"))).toBe(true);
  });

  it("postgres repository supports row-level workspace CRUD through owner-scoped lists", async () => {
    const { client, repository } = createPostgresRepository();

    const createdBranch = await repository.createBranch(demoUserId, "br_row", {
      name: "Row Branch",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Terminal 33",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund",
      notes: "Row branch.",
    });
    expect(createdBranch).toMatchObject({ id: "br_row", defaultIncoterms: "FOB" });
    expect(await repository.getBranches(demoUserId)).toEqual(expect.arrayContaining([expect.objectContaining({ id: "br_row" })]));

    const updatedProduct = await repository.updateProduct(demoUserId, "p_1", {
      monthlyVolume: "180 t",
      targetCountries: ["Spain", "France"],
    });
    expect(updatedProduct).toMatchObject({ id: "p_1", monthlyVolume: "180 t" });

    const createdNotification = await repository.createNotification(demoUserId, "n_row", {
      channel: "agent",
      enabled: false,
      events: [],
      frequency: "weekly",
    });
    expect(createdNotification).toMatchObject({ id: "n_row", channel: "agent" });

    const deletedBranch = await repository.deleteBranch(demoUserId, "br_row");
    expect(deletedBranch).toMatchObject({ id: "br_row" });
    await expect(repository.deleteBranch(demoUserId, "br_row")).rejects.toThrow("workspace_item_not_found");
    expect(client.calls.some((call) => call.sql.includes("delete from yorso_company_branches"))).toBe(true);
    expect(client.calls.some((call) => call.sql.includes("insert into yorso_notification_preferences"))).toBe(true);
  });

  it("postgres repository throws company_not_found when a user has no company row", async () => {
    const client = new FakeAccountPgClient();
    client.company = null;
    const { repository } = createPostgresRepository(client);

    await expect(repository.updateCompanyProfile(demoUserId, { tradeName: "Missing Company" })).rejects.toThrow(
      "company_not_found",
    );
  });
});
