import type { ApiConfig } from "../../config.js";
import { PostgresAuthRepository } from "./postgres-repository.js";
import { MemoryAuthRepository, type AuthRepository } from "./repository.js";

export function createAuthRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl">,
): AuthRepository {
  if (config.accountRepository === "memory") return new MemoryAuthRepository();
  if (config.accountRepository === "postgres") return new PostgresAuthRepository(config);

  throw new Error(`Unsupported auth repository ${String(config.accountRepository)}`);
}
