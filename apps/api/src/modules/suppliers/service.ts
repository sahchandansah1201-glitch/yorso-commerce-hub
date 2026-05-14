import {
  supplierDirectoryDetailResponseSchema,
  supplierDirectoryItemSchema,
  supplierDirectoryListResponseSchema,
  supplierDirectoryQuerySchema,
  type SupplierDirectoryAccessLevel,
  type SupplierDirectoryItem,
  type SupplierDirectoryRecord,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierRepository } from "./repository.js";

export class SupplierDirectoryService {
  constructor(private readonly repository: SupplierRepository) {}

  async listSuppliers(rawQuery: Record<string, string | undefined>, requestId: string) {
    const query = supplierDirectoryQuerySchema.parse(rawQuery);
    const { suppliers, total } = await this.repository.listSuppliers(query);

    return supplierDirectoryListResponseSchema.parse({
      ok: true,
      suppliers: suppliers.map((supplier) => shapeSupplierForAccess(supplier, query.accessLevel)),
      total,
      accessLevel: query.accessLevel,
      limit: query.limit,
      offset: query.offset,
      requestId,
    });
  }

  async getSupplierById(id: string, rawQuery: Record<string, string | undefined>, requestId: string) {
    const query = supplierDirectoryQuerySchema.pick({ accessLevel: true }).parse(rawQuery);
    const supplier = await this.repository.getSupplierById(id);
    if (!supplier) throw new Error("supplier_not_found");

    return supplierDirectoryDetailResponseSchema.parse({
      ok: true,
      supplier: shapeSupplierForAccess(supplier, query.accessLevel),
      accessLevel: query.accessLevel,
      requestId,
    });
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
