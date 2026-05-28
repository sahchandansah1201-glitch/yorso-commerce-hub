import {
  accountBranchesSchema,
  accountWorkspaceItemIdSchema,
  accountMetaRegionsSchema,
  accountNotificationsSchema,
  accountProductsSchema,
  companyBranchCreateSchema,
  companyBranchSchema,
  companyBranchUpdateSchema,
  companyProfileSchema,
  companyProfileUpdateSchema,
  companyProductCreateSchema,
  companyProductSchema,
  companyProductUpdateSchema,
  metaRegionCreateSchema,
  metaRegionSchema,
  metaRegionUpdateSchema,
  notificationPreferenceCreateSchema,
  notificationPreferenceSchema,
  notificationPreferenceUpdateSchema,
  userProfileSchema,
  userProfileUpdateSchema,
} from "../../../../../packages/contracts/dist/index.js";
import type { AccountRepository } from "./repository.js";

export class AccountService {
  constructor(private readonly repository: AccountRepository) {}

  async getAccountVersion(userId: string) {
    return this.repository.getAccountVersion(userId);
  }

  async touchAccountVersion(userId: string) {
    await this.repository.touchAccountVersion(userId);
  }

  async assertAccountVersion(userId: string, expectedVersion?: string) {
    const expected = expectedVersion?.trim();
    if (!expected) return;

    const current = await this.repository.getAccountVersion(userId);
    if (current !== expected) throw new Error("account_snapshot_conflict");
  }

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

  async createBranch(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const create = companyBranchCreateSchema.parse(payload);
    return companyBranchSchema.parse(await this.repository.createBranch(userId, id, create));
  }

  async updateBranch(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const update = companyBranchUpdateSchema.parse(payload);
    const item = await this.repository.updateBranch(userId, id, update);
    return companyBranchSchema.parse(item);
  }

  async deleteBranch(userId: string, itemId: string) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    return companyBranchSchema.parse(await this.repository.deleteBranch(userId, id));
  }

  async getProducts(userId: string) {
    return accountProductsSchema.parse(await this.repository.getProducts(userId));
  }

  async replaceProducts(userId: string, payload: unknown) {
    const update = accountProductsSchema.parse(payload);
    return accountProductsSchema.parse(await this.repository.replaceProducts(userId, update));
  }

  async createProduct(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const create = companyProductCreateSchema.parse(payload);
    return companyProductSchema.parse(await this.repository.createProduct(userId, id, create));
  }

  async updateProduct(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const update = companyProductUpdateSchema.parse(payload);
    return companyProductSchema.parse(await this.repository.updateProduct(userId, id, update));
  }

  async deleteProduct(userId: string, itemId: string) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    return companyProductSchema.parse(await this.repository.deleteProduct(userId, id));
  }

  async getMetaRegions(userId: string) {
    return accountMetaRegionsSchema.parse(await this.repository.getMetaRegions(userId));
  }

  async replaceMetaRegions(userId: string, payload: unknown) {
    const update = accountMetaRegionsSchema.parse(payload);
    return accountMetaRegionsSchema.parse(await this.repository.replaceMetaRegions(userId, update));
  }

  async createMetaRegion(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const create = metaRegionCreateSchema.parse(payload);
    return metaRegionSchema.parse(await this.repository.createMetaRegion(userId, id, create));
  }

  async updateMetaRegion(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const update = metaRegionUpdateSchema.parse(payload);
    return metaRegionSchema.parse(await this.repository.updateMetaRegion(userId, id, update));
  }

  async deleteMetaRegion(userId: string, itemId: string) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    return metaRegionSchema.parse(await this.repository.deleteMetaRegion(userId, id));
  }

  async getNotifications(userId: string) {
    return accountNotificationsSchema.parse(await this.repository.getNotifications(userId));
  }

  async replaceNotifications(userId: string, payload: unknown) {
    const update = accountNotificationsSchema.parse(payload);
    return accountNotificationsSchema.parse(await this.repository.replaceNotifications(userId, update));
  }

  async createNotification(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const create = notificationPreferenceCreateSchema.parse(payload);
    return notificationPreferenceSchema.parse(await this.repository.createNotification(userId, id, create));
  }

  async updateNotification(userId: string, itemId: string, payload: unknown) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    const update = notificationPreferenceUpdateSchema.parse(payload);
    const current = await this.repository.updateNotification(userId, id, update);
    return notificationPreferenceSchema.parse(current);
  }

  async deleteNotification(userId: string, itemId: string) {
    const id = accountWorkspaceItemIdSchema.parse(itemId);
    return notificationPreferenceSchema.parse(await this.repository.deleteNotification(userId, id));
  }
}
