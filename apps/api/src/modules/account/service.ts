import {
  accountBranchesSchema,
  accountMetaRegionsSchema,
  accountNotificationsSchema,
  accountProductsSchema,
  companyProfileSchema,
  companyProfileUpdateSchema,
  userProfileSchema,
  userProfileUpdateSchema,
} from "../../../../../packages/contracts/dist/index.js";
import type { AccountRepository } from "./repository.js";

export class AccountService {
  constructor(private readonly repository: AccountRepository) {}

  async getCurrentUserProfile(userId: string) {
    const profile = await this.repository.getUserProfile(userId);
    if (!profile) throw new Error("user_not_found");
    return userProfileSchema.parse(profile);
  }

  async updateCurrentUserProfile(userId: string, payload: unknown) {
    const update = userProfileUpdateSchema.parse(payload);
    const profile = await this.repository.updateUserProfile(userId, update);
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

  async getBranches(userId: string) {
    return accountBranchesSchema.parse(await this.repository.getBranches(userId));
  }

  async replaceBranches(userId: string, payload: unknown) {
    const update = accountBranchesSchema.parse(payload);
    return accountBranchesSchema.parse(await this.repository.replaceBranches(userId, update));
  }

  async getProducts(userId: string) {
    return accountProductsSchema.parse(await this.repository.getProducts(userId));
  }

  async replaceProducts(userId: string, payload: unknown) {
    const update = accountProductsSchema.parse(payload);
    return accountProductsSchema.parse(await this.repository.replaceProducts(userId, update));
  }

  async getMetaRegions(userId: string) {
    return accountMetaRegionsSchema.parse(await this.repository.getMetaRegions(userId));
  }

  async replaceMetaRegions(userId: string, payload: unknown) {
    const update = accountMetaRegionsSchema.parse(payload);
    return accountMetaRegionsSchema.parse(await this.repository.replaceMetaRegions(userId, update));
  }

  async getNotifications(userId: string) {
    return accountNotificationsSchema.parse(await this.repository.getNotifications(userId));
  }

  async replaceNotifications(userId: string, payload: unknown) {
    const update = accountNotificationsSchema.parse(payload);
    return accountNotificationsSchema.parse(await this.repository.replaceNotifications(userId, update));
  }
}
