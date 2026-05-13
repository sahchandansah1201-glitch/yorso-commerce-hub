import type { ApiConfig } from "../../config.js";
import type { AccountRepository } from "./repository.js";
import { MemoryAccountRepository } from "./repository.js";
import { PostgresAccountRepository } from "./postgres-repository.js";

export function createAccountRepository(config: Pick<ApiConfig, "accountRepository" | "databaseUrl">): AccountRepository {
  if (config.accountRepository === "memory") return new MemoryAccountRepository();
  if (config.accountRepository === "postgres") return new PostgresAccountRepository(config);

  throw new Error(`Unsupported account repository ${String(config.accountRepository)}`);
}
