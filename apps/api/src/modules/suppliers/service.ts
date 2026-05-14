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
    const accessibleSupplierIds = await this.listAccessibleSupplierIds(query.accessLevel, viewer);
    const accessibleSupplierIdSet = new Set(accessibleSupplierIds);
    const { suppliers, total } = await this.repository.listSuppliers(query, {
      privateSearchSupplierIds: query.q ? accessibleSupplierIds : [],
    });
    const shapedSuppliers = suppliers.map((supplier) =>
      shapeSupplierForAccess(supplier, this.resolveListAccessLevel(supplier.id, query.accessLevel, accessibleSupplierIdSet)),
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

  private async listAccessibleSupplierIds(
    requested: SupplierDirectoryAccessLevel,
    viewer: { buyerUserId: string } | null,
  ): Promise<string[]> {
    if (requested !== "qualified_unlocked") return [];
    if (!viewer || !this.accessRepository) return [];
    return this.accessRepository.listAccessibleSupplierIds({ buyerUserId: viewer.buyerUserId });
  }

  private resolveListAccessLevel(
    supplierId: string,
    requested: SupplierDirectoryAccessLevel,
    accessibleSupplierIds: ReadonlySet<string>,
  ): SupplierDirectoryAccessLevel {
    if (requested !== "qualified_unlocked") return requested;
    return accessibleSupplierIds.has(supplierId) ? "qualified_unlocked" : "registered_locked";
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
