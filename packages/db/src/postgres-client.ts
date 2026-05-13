import { Client, type ClientConfig } from "pg";

import { MigrationRuntimeError, type MigrationClient, type MigrationQueryResult } from "./runtime.js";

export interface PostgresMigrationClientOptions {
  connectionString: string;
  applicationName?: string;
  statementTimeoutMs?: number;
  ssl?: ClientConfig["ssl"];
}

export interface ConnectedPostgresMigrationClient {
  client: MigrationClient;
  close: () => Promise<void>;
}

export class PostgresMigrationClient implements MigrationClient {
  private readonly client: Client;
  private connected = false;

  constructor(options: PostgresMigrationClientOptions) {
    this.client = new Client({
      connectionString: options.connectionString,
      application_name: options.applicationName ?? "yorso-db-migrator",
      statement_timeout: options.statementTimeoutMs ?? 30_000,
      ssl: options.ssl,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.client.connect();
    this.connected = true;
  }

  async close(): Promise<void> {
    if (!this.connected) return;
    await this.client.end();
    this.connected = false;
  }

  async query<Row = unknown>(sql: string, params?: unknown[]): Promise<MigrationQueryResult<Row>> {
    await this.connect();
    const result = await this.client.query(sql, params);

    return { rows: result.rows as Row[] };
  }
}

export async function createPostgresMigrationClient(
  options: PostgresMigrationClientOptions,
): Promise<ConnectedPostgresMigrationClient> {
  const client = new PostgresMigrationClient(options);
  await client.connect();

  return {
    client,
    close: () => client.close(),
  };
}

export function resolveMigrationDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.MIGRATION_DATABASE_URL?.trim();

  if (!url) {
    throw new MigrationRuntimeError([
      "MIGRATION_DATABASE_URL is required for live migration status/apply commands.",
      "Do not use frontend Supabase variables for self-hosted migration execution.",
    ]);
  }

  return url;
}

export function resolveMigrationAppliedBy(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.MIGRATION_APPLIED_BY?.trim();
  return value || "yorso-migrator";
}

export function maskDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.password) url.password = "***";
    if (url.username) url.username = `${url.username ? "***" : ""}`;
    return url.toString();
  } catch {
    return "[invalid database url]";
  }
}
