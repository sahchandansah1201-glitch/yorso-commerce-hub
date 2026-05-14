import type { ApiConfig } from "../../config.js";
import { PostgresOfferCatalogRepository } from "./postgres-repository.js";
import { MemoryOfferCatalogRepository, type OfferCatalogRepository } from "./repository.js";

export function createOfferCatalogRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl">,
): OfferCatalogRepository {
  if (config.accountRepository === "memory") return new MemoryOfferCatalogRepository();
  if (config.accountRepository === "postgres") return new PostgresOfferCatalogRepository(config);

  throw new Error(`Unsupported offer catalog repository ${String(config.accountRepository)}`);
}
