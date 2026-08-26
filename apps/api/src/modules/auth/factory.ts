import type { ApiConfig } from "../../config.js";
import { PostgresAuthRepository } from "./postgres-repository.js";
import {
  MemoryAuthRepository,
  type AuthRepository,
  type RegistrationAccountProvisioner,
} from "./repository.js";

export function createAuthRepository(
  config: Pick<
    ApiConfig,
    | "accountRepository"
    | "databaseUrl"
    | "registrationVerificationCodeSecret"
    | "localAuthEmail"
    | "localAuthPassword"
    | "localAuthDisplayName"
    | "localAuthRoles"
  >,
  options: { accountProvisioner?: RegistrationAccountProvisioner } = {},
): AuthRepository {
  if (config.accountRepository === "memory") {
    const bootstrapUser = config.localAuthEmail && config.localAuthPassword
      ? {
          roles: config.localAuthRoles ?? ["admin", "support", "company_admin", "buyer", "supplier"],
          user: {
            id: "00000000-0000-4000-8000-000000000099",
            email: config.localAuthEmail,
            displayName: config.localAuthDisplayName ?? config.localAuthEmail,
            passwordSecret: `plain:${config.localAuthPassword}`,
          },
        }
      : undefined;
    return new MemoryAuthRepository(undefined, undefined, options.accountProvisioner, bootstrapUser);
  }
  if (config.accountRepository === "postgres") return new PostgresAuthRepository(config);

  throw new Error(`Unsupported auth repository ${String(config.accountRepository)}`);
}
