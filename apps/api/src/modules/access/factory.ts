import type { ApiConfig } from "../../config.js";
import { PostgresSupplierAccessRepository } from "./postgres-repository.js";
import { MemorySupplierAccessRepository, type SupplierAccessRepository } from "./repository.js";

export function createSupplierAccessRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl">,
): SupplierAccessRepository {
  if (config.accountRepository === "memory") return new MemorySupplierAccessRepository();
  if (config.accountRepository === "postgres") return new PostgresSupplierAccessRepository(config);

  throw new Error(`Unsupported supplier access repository ${String(config.accountRepository)}`);
}
