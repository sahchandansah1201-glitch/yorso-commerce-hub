import type { ApiConfig } from "../../config.js";
import { PostgresSupplierRepository } from "./postgres-repository.js";
import { MemorySupplierRepository, type SupplierRepository } from "./repository.js";

export function createSupplierRepository(config: Pick<ApiConfig, "accountRepository" | "databaseUrl">): SupplierRepository {
  if (config.accountRepository === "memory") return new MemorySupplierRepository();
  if (config.accountRepository === "postgres") return new PostgresSupplierRepository(config);

  throw new Error(`Unsupported supplier repository ${String(config.accountRepository)}`);
}
