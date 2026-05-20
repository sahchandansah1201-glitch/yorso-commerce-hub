import type { ApiConfig } from "../../config.js";
import { PostgresAdminAuditRepository } from "./postgres-repository.js";
import { MemoryAdminAuditRepository, type AdminAuditRepository } from "./repository.js";

export function createAdminAuditRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl">,
): AdminAuditRepository {
  if (config.accountRepository === "memory") return new MemoryAdminAuditRepository();
  if (config.accountRepository === "postgres") return new PostgresAdminAuditRepository(config);

  throw new Error(`Unsupported admin audit repository ${String(config.accountRepository)}`);
}
