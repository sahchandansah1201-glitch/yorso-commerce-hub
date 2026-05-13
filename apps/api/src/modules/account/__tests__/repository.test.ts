import { describe, expect, it } from "vitest";
import { loadApiConfig } from "../../../config.js";
import { createAccountRepository } from "../factory.js";
import { MemoryAccountRepository } from "../repository.js";
import { PostgresAccountRepository } from "../postgres-repository.js";

describe("account repositories", () => {
  it("memory repository persists company updates inside one process", async () => {
    const repository = new MemoryAccountRepository();

    const before = await repository.getCompanyProfile("00000000-0000-4000-8000-000000000001");
    const after = await repository.updateCompanyProfile("00000000-0000-4000-8000-000000000001", {
      tradeName: "Memory Repo Seafood",
      countryCode: "IS",
    });
    const reread = await repository.getCompanyProfile("00000000-0000-4000-8000-000000000001");

    expect(before?.tradeName).toBe("Demo Seafood");
    expect(after.tradeName).toBe("Memory Repo Seafood");
    expect(after.countryCode).toBe("IS");
    expect(reread?.tradeName).toBe("Memory Repo Seafood");
  });

  it("factory selects memory repository by default", () => {
    const config = loadApiConfig({ NODE_ENV: "test" }, { allowLocalDefaults: true });
    const repository = createAccountRepository(config);

    expect(repository).toBeInstanceOf(MemoryAccountRepository);
  });

  it("factory selects postgres repository when ACCOUNT_REPOSITORY=postgres", () => {
    const config = loadApiConfig(
      {
        NODE_ENV: "test",
        ACCOUNT_REPOSITORY: "postgres",
        DATABASE_URL: "postgres://yorso_app:secret@localhost:6432/yorso",
      },
      { allowLocalDefaults: true },
    );
    const repository = createAccountRepository(config);

    expect(repository).toBeInstanceOf(PostgresAccountRepository);
  });

  it("postgres repository is an explicit skeleton until pg client integration", async () => {
    const repository = new PostgresAccountRepository({
      databaseUrl: "postgres://yorso_app:secret@localhost:6432/yorso",
    });

    await expect(repository.getUserProfile("00000000-0000-4000-8000-000000000001")).rejects.toThrow(
      /PostgresAccountRepository.getUserProfile is not implemented/,
    );
  });
});
