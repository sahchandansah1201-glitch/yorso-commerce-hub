import type { ApiConfig } from "../../config.js";
import type { CompanyProfile, CompanyProfileUpdate, UserProfile } from "../../../../../packages/contracts/dist/index.js";
import type { AccountRepository } from "./repository.js";

export class PostgresAccountRepository implements AccountRepository {
  constructor(private readonly config: Pick<ApiConfig, "databaseUrl">) {
    if (!config.databaseUrl.startsWith("postgres")) {
      throw new Error("PostgresAccountRepository requires a PostgreSQL DATABASE_URL.");
    }
  }

  async getUserProfile(_userId: string): Promise<UserProfile | null> {
    throw new Error("PostgresAccountRepository.getUserProfile is not implemented until the PostgreSQL client is added.");
  }

  async getCompanyProfile(_userId: string): Promise<CompanyProfile | null> {
    throw new Error("PostgresAccountRepository.getCompanyProfile is not implemented until the PostgreSQL client is added.");
  }

  async updateCompanyProfile(_userId: string, _update: CompanyProfileUpdate): Promise<CompanyProfile> {
    throw new Error("PostgresAccountRepository.updateCompanyProfile is not implemented until the PostgreSQL client is added.");
  }
}
