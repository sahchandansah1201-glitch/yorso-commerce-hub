import { companyProfileSchema, companyProfileUpdateSchema, userProfileSchema } from "../../../../../packages/contracts/dist/index.js";
import type { AccountRepository } from "./repository.js";

export class AccountService {
  constructor(private readonly repository: AccountRepository) {}

  async getCurrentUserProfile(userId: string) {
    const profile = await this.repository.getUserProfile(userId);
    if (!profile) throw new Error("user_not_found");
    return userProfileSchema.parse(profile);
  }

  async getCompanyProfile(userId: string) {
    const profile = await this.repository.getCompanyProfile(userId);
    if (!profile) throw new Error("company_not_found");
    return companyProfileSchema.parse(profile);
  }

  async updateCompanyProfile(userId: string, payload: unknown) {
    const update = companyProfileUpdateSchema.parse(payload);
    const profile = await this.repository.updateCompanyProfile(userId, update);
    return companyProfileSchema.parse(profile);
  }
}
