import { buildMigrationPlan, type MigrationPlan, type MigrationPlanItem } from "./migrator.js";

export interface AppliedMigrationRecord {
  id: string;
  checksum: string;
  appliedAt?: string | Date | null;
  executionMs?: number | null;
  appliedBy?: string | null;
}

export interface MigrationQueryResult<Row = unknown> {
  rows: Row[];
}

export interface MigrationClient {
  query<Row = unknown>(sql: string, params?: unknown[]): Promise<MigrationQueryResult<Row>>;
}

export interface MigrationStatusItem extends MigrationPlanItem {
  state: "pending" | "applied" | "drift";
  appliedAt: string | Date | null;
  appliedChecksum: string | null;
}

export interface MigrationStatus {
  migrations: MigrationStatusItem[];
  pending: MigrationStatusItem[];
  applied: MigrationStatusItem[];
  drifted: MigrationStatusItem[];
}

export interface MigrationApplyOptions {
  dryRun?: boolean;
  appliedBy?: string;
  now?: () => number;
}

export interface MigrationApplyResult {
  dryRun: boolean;
  applied: MigrationStatusItem[];
  skipped: MigrationStatusItem[];
  pending: MigrationStatusItem[];
}

export class MigrationRuntimeError extends Error {
  constructor(public readonly failures: string[]) {
    super(`YORSO DB migration runtime failed:\n- ${failures.join("\n- ")}`);
    this.name = "MigrationRuntimeError";
  }
}

const REGISTRY_TABLE_SQL = `
create table if not exists _yorso_migrations (
  id text primary key,
  checksum text not null check (char_length(checksum) = 64),
  applied_at timestamptz not null default now(),
  execution_ms integer check (execution_ms is null or execution_ms >= 0),
  applied_by text not null default 'yorso-migrator' check (char_length(applied_by) between 1 and 120)
);
`;

const REGISTRY_INDEX_SQL =
  "create index if not exists idx_yorso_migrations_applied_at on _yorso_migrations(applied_at);";

export async function ensureMigrationRegistry(client: MigrationClient): Promise<void> {
  await client.query(REGISTRY_TABLE_SQL);
  await client.query(REGISTRY_INDEX_SQL);
}

export async function readAppliedMigrations(client: MigrationClient): Promise<Map<string, AppliedMigrationRecord>> {
  const result = await client.query<AppliedMigrationRecord>(
    "select id, checksum, applied_at as \"appliedAt\", execution_ms as \"executionMs\", applied_by as \"appliedBy\" from _yorso_migrations order by id asc",
  );

  return new Map(result.rows.map((row) => [row.id, row]));
}

export async function getMigrationStatus(client: MigrationClient, plan = buildMigrationPlan()): Promise<MigrationStatus> {
  const applied = await readAppliedMigrations(client);

  const migrations = plan.migrations.map((migration) => {
    const record = applied.get(migration.id);
    const state = !record ? "pending" : record.checksum === migration.checksum ? "applied" : "drift";

    return {
      ...migration,
      state,
      appliedAt: record?.appliedAt ?? null,
      appliedChecksum: record?.checksum ?? null,
    } satisfies MigrationStatusItem;
  });

  return {
    migrations,
    pending: migrations.filter((migration) => migration.state === "pending"),
    applied: migrations.filter((migration) => migration.state === "applied"),
    drifted: migrations.filter((migration) => migration.state === "drift"),
  };
}

export async function applyPendingMigrations(
  client: MigrationClient,
  plan: MigrationPlan = buildMigrationPlan(),
  options: MigrationApplyOptions = {},
): Promise<MigrationApplyResult> {
  const dryRun = options.dryRun ?? true;
  const appliedBy = options.appliedBy ?? "yorso-migrator";
  const now = options.now ?? Date.now;
  if (!dryRun) {
    await ensureMigrationRegistry(client);
  }
  const status = await getMigrationStatus(client, plan);

  if (status.drifted.length > 0) {
    throw new MigrationRuntimeError(
      status.drifted.map((migration) => `${migration.id}: checksum drift ${migration.appliedChecksum} != ${migration.checksum}`),
    );
  }

  if (dryRun) {
    return {
      dryRun: true,
      applied: [],
      skipped: status.applied,
      pending: status.pending,
    };
  }

  const applied: MigrationStatusItem[] = [];

  for (const migration of status.pending) {
    const startedAt = now();

    await client.query("begin");
    try {
      await client.query(migration.sql);
      await client.query(
        "insert into _yorso_migrations (id, checksum, execution_ms, applied_by) values ($1, $2, $3, $4)",
        [migration.id, migration.checksum, Math.max(0, now() - startedAt), appliedBy],
      );
      await client.query("commit");
      applied.push(migration);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  return {
    dryRun: false,
    applied,
    skipped: status.applied,
    pending: [],
  };
}

export function formatMigrationStatus(status: MigrationStatus): string[] {
  return status.migrations.map((migration) => {
    const suffix =
      migration.state === "drift"
        ? ` drift expected=${migration.checksum} applied=${migration.appliedChecksum}`
        : ` ${migration.checksum}`;

    return `${migration.id} ${migration.state}${suffix}`;
  });
}

export function formatApplyResult(result: MigrationApplyResult): string[] {
  const lines = [
    `dryRun=${result.dryRun}`,
    `applied=${result.applied.length}`,
    `pending=${result.pending.length}`,
    `skipped=${result.skipped.length}`,
  ];

  for (const migration of result.applied) lines.push(`applied ${migration.id}`);
  for (const migration of result.pending) lines.push(`pending ${migration.id}`);

  return lines;
}
