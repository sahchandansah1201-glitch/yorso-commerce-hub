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

class FakeAccountPgClient implements AccountQueryClient {
  readonly calls: QueryCall[] = [];
  readonly user: FakeUserRow = {
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

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(sql: string, params: readonly unknown[] = []) {
    this.calls.push({ sql, params });
    const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized.includes("from yorso_users")) {
      return { rows: params[0] === this.user.id ? ([this.user] as unknown as Row[]) : [] };
    }

    if (normalized.includes("from yorso_companies") && normalized.includes("left join yorso_company_media")) {
      return { rows: this.company && params[0] === this.company.owner_user_id ? ([this.company] as unknown as Row[]) : [] };
    }

    if (normalized.startsWith("update yorso_companies")) {
      if (!this.company) return { rows: [] };

      const companyId = params[params.length - 1];
      if (companyId !== this.company.id) return { rows: [] };

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

  it("postgres repository throws company_not_found when a user has no company row", async () => {
    const client = new FakeAccountPgClient();
    client.company = null;
    const { repository } = createPostgresRepository(client);

    await expect(repository.updateCompanyProfile(demoUserId, { tradeName: "Missing Company" })).rejects.toThrow(
      "company_not_found",
    );
  });
});
