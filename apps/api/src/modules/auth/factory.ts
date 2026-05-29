import type { ApiConfig } from "../../config.js";
import { PostgresAuthRepository } from "./postgres-repository.js";
import {
  MemoryAuthRepository,
  type AuthRepository,
  type RegistrationAccountProvisioner,
} from "./repository.js";

export function createAuthRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl" | "registrationVerificationCodeSecret">,
  options: { accountProvisioner?: RegistrationAccountProvisioner } = {},
): AuthRepository {
  if (config.accountRepository === "memory") return new MemoryAuthRepository(undefined, undefined, options.accountProvisioner);
  if (config.accountRepository === "postgres") return new PostgresAuthRepository(config);

  throw new Error(`Unsupported auth repository ${String(config.accountRepository)}`);
}
