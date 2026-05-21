import type { ApiConfig } from "../../config.js";
import { PostgresAdminIncidentRepository } from "./postgres-repository.js";
import { MemoryAdminIncidentRepository, type AdminIncidentRepository } from "./repository.js";

export function createAdminIncidentRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl">,
): AdminIncidentRepository {
  if (config.accountRepository === "memory") return new MemoryAdminIncidentRepository();
  if (config.accountRepository === "postgres") return new PostgresAdminIncidentRepository(config);

  throw new Error(`Unsupported admin incident repository ${String(config.accountRepository)}`);
}
