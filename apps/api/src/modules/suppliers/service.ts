import {
  supplierDirectoryDetailResponseSchema,
  supplierDirectoryItemSchema,
  supplierDirectoryListResponseSchema,
  supplierDirectoryQuerySchema,
  type SupplierDirectoryAccessLevel,
  type SupplierDirectoryItem,
  type SupplierDirectoryRecord,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierAccessRepository } from "../access/repository.js";
import type { SupplierRepository } from "./repository.js";

export class SupplierDirectoryService {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly accessRepository?: SupplierAccessRepository,
  ) {}

  async listSuppliers(
    rawQuery: Record<string, string | undefined>,
    requestId: string,
    viewer: { buyerUserId: string } | null = null,
  ) {
    const query = supplierDirectoryQuerySchema.parse(rawQuery);
    const searchAccessLevel = this.searchAccessLevel(query.accessLevel, viewer);
    const { suppliers, total } = await this.repository.listSuppliers({
      ...query,
      accessLevel: searchAccessLevel,
    });
    const shapedSuppliers = await Promise.all(
      suppliers.map(async (supplier) =>
        shapeSupplierForAccess(supplier, await this.resolveDetailAccessLevel(supplier.id, query.accessLevel, viewer)),
      ),
    );

    return supplierDirectoryListResponseSchema.parse({
      ok: true,
      suppliers: shapedSuppliers,
      total,
      accessLevel: query.accessLevel,
      limit: query.limit,
      offset: query.offset,
      requestId,
    });
  }

  async getSupplierById(
    id: string,
    rawQuery: Record<string, string | undefined>,
    requestId: string,
    viewer: { buyerUserId: string } | null = null,
  ) {
    const query = supplierDirectoryQuerySchema.pick({ accessLevel: true }).parse(rawQuery);
    const supplier = await this.repository.getSupplierById(id);
    if (!supplier) throw new Error("supplier_not_found");
    const accessLevel = await this.resolveDetailAccessLevel(supplier.id, query.accessLevel, viewer);

    return supplierDirectoryDetailResponseSchema.parse({
      ok: true,
      supplier: shapeSupplierForAccess(supplier, accessLevel),
      accessLevel,
      requestId,
    });
  }

  private searchAccessLevel(
    requested: SupplierDirectoryAccessLevel,
    viewer: { buyerUserId: string } | null,
  ): SupplierDirectoryAccessLevel {
    if (requested !== "qualified_unlocked") return requested;
    if (!viewer || !this.accessRepository) return "registered_locked";
    // Supplier-name search must stay grant-safe. Batch #45 keeps list search on
    // public fields; detail unlock happens per supplier grant.
    return "registered_locked";
  }

  private async resolveDetailAccessLevel(
    supplierId: string,
    requested: SupplierDirectoryAccessLevel,
    viewer: { buyerUserId: string } | null,
  ): Promise<SupplierDirectoryAccessLevel> {
    if (requested !== "qualified_unlocked") return requested;
    if (!viewer || !this.accessRepository) return "registered_locked";

    const hasAccess = await this.accessRepository.hasSupplierAccess({
      buyerUserId: viewer.buyerUserId,
      supplierId,
    });
    return hasAccess ? "qualified_unlocked" : "registered_locked";
  }
}

export function shapeSupplierForAccess(
  supplier: SupplierDirectoryRecord,
  accessLevel: SupplierDirectoryAccessLevel,
): SupplierDirectoryItem {
  const unlocked = accessLevel === "qualified_unlocked";

  return supplierDirectoryItemSchema.parse({
    ...supplier,
    companyName: unlocked ? supplier.companyName : null,
    about: unlocked ? supplier.about : null,
    activeOffersCount: unlocked ? supplier.activeOffersCount : null,
    deliveryCountries: unlocked
      ? supplier.deliveryCountries
      : supplier.deliveryCountries.slice(0, 3),
    deliveryCountriesTotal: unlocked ? supplier.deliveryCountriesTotal : null,
    totalProductsCount: unlocked ? supplier.totalProductsCount : null,
    website: unlocked ? supplier.website : null,
    whatsapp: unlocked ? supplier.whatsapp : null,
    productCatalogPreview: unlocked
      ? supplier.productCatalogPreview
      : supplier.productCatalogPreview.slice(0, 3),
    accessLevel,
  });
}
