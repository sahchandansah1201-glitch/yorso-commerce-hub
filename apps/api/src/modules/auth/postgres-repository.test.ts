import { describe, expect, it } from "vitest";
import { PostgresAuthRepository, type AuthQueryClient } from "./postgres-repository.js";

class RecordingAuthQueryClient implements AuthQueryClient {
  readonly calls: Array<{ params: readonly unknown[] | undefined; sql: string }> = [];

  async query<Row extends Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: Row[] }> {
    this.calls.push({ params, sql });
    return { rows: [{ exists: true } as Row] };
  }
}

const createRepository = (client: AuthQueryClient) =>
  new PostgresAuthRepository(
    {
      databaseUrl: "postgres://test:test@127.0.0.1:5432/yorso_test",
      registrationVerificationCodeSecret: "test-registration-secret",
    },
    { client },
  );

describe("PostgresAuthRepository.hasAnyRole", () => {
  it("checks all allowed roles with one indexed membership query", async () => {
    const client = new RecordingAuthQueryClient();
    const repository = createRepository(client);

    await expect(repository.hasAnyRole("user-1", ["admin", "company_admin"])).resolves.toBe(true);

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]?.sql.replace(/\s+/g, " ").trim()).toContain(
      "from yorso_user_roles where user_id = $1 and role = any($2::text[])",
    );
    expect(client.calls[0]?.params).toEqual(["user-1", ["admin", "company_admin"]]);
  });

  it("does not query PostgreSQL when no allowed roles are configured", async () => {
    const client = new RecordingAuthQueryClient();
    const repository = createRepository(client);

    await expect(repository.hasAnyRole("user-1", [])).resolves.toBe(false);
    expect(client.calls).toHaveLength(0);
  });
});
