import type { ApiConfig } from "../../config.js";
import { LocalObjectStorage } from "./object-storage.js";
import { PostgresFileRepository } from "./postgres-repository.js";
import { MemoryFileRepository, type FileRepository } from "./repository.js";
import { FileService } from "./service.js";

export function createFileRepository(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl">,
): FileRepository {
  if (config.accountRepository === "memory") return new MemoryFileRepository();
  if (config.accountRepository === "postgres") return new PostgresFileRepository(config);

  throw new Error(`Unsupported file repository ${String(config.accountRepository)}`);
}

export function createFileService(
  config: Pick<ApiConfig, "accountRepository" | "databaseUrl" | "storageDriver" | "storageLocalRoot" | "maxUploadBytes">,
) {
  if (config.storageDriver !== "local") {
    throw new Error(`Unsupported storage driver ${String(config.storageDriver)}`);
  }

  return new FileService(
    createFileRepository(config),
    new LocalObjectStorage(config.storageLocalRoot),
    {
      maxUploadBytes: config.maxUploadBytes,
      storageDriver: config.storageDriver,
    },
  );
}
