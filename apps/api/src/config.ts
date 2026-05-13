import { z } from "zod";

const optionalUrlSchema = z.string().url().or(z.literal(""));

export const apiConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]).default("development"),
  host: z.string().min(1).default("0.0.0.0"),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  accountRepository: z.enum(["memory", "postgres"]).default("memory"),
  publicAppUrl: z.string().url().default("http://localhost:8080"),
  databaseUrl: z.string().regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a PostgreSQL connection string"),
  redisUrl: z.string().regex(/^redis:\/\//, "REDIS_URL must be a Redis connection string"),
  s3Endpoint: z.string().url(),
  s3Bucket: z.string().min(1),
  sessionSecret: z.string().min(24),
  jwtSecret: z.string().min(24),
  supabaseUrl: optionalUrlSchema.default(""),
  supabasePublishableKey: z.string().default(""),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

export type ApiConfigEnv = Partial<Record<string, string | undefined>>;

const localDefaults = {
  NODE_ENV: "development",
  YORSO_API_HOST: "0.0.0.0",
  YORSO_API_PORT: "3000",
  ACCOUNT_REPOSITORY: "memory",
  YORSO_PUBLIC_APP_URL: "http://localhost:8080",
  DATABASE_URL: "postgres://yorso_app:change-me-local-only@localhost:6432/yorso",
  REDIS_URL: "redis://localhost:6379",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "yorso-local",
  YORSO_SESSION_SECRET: "change-me-32-bytes-minimum",
  YORSO_JWT_SECRET: "change-me-32-bytes-minimum",
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_PUBLISHABLE_KEY: "",
} satisfies Record<string, string>;

export function loadApiConfig(env: ApiConfigEnv = process.env, options: { allowLocalDefaults?: boolean } = {}) {
  const source = options.allowLocalDefaults === false ? env : { ...localDefaults, ...env };

  return apiConfigSchema.parse({
    nodeEnv: source.NODE_ENV,
    host: source.YORSO_API_HOST,
    port: source.YORSO_API_PORT,
    accountRepository: source.ACCOUNT_REPOSITORY,
    publicAppUrl: source.YORSO_PUBLIC_APP_URL,
    databaseUrl: source.DATABASE_URL,
    redisUrl: source.REDIS_URL,
    s3Endpoint: source.S3_ENDPOINT,
    s3Bucket: source.S3_BUCKET,
    sessionSecret: source.YORSO_SESSION_SECRET,
    jwtSecret: source.YORSO_JWT_SECRET,
    supabaseUrl: source.VITE_SUPABASE_URL,
    supabasePublishableKey: source.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function assertSupabaseIsPrototypeOnly(config: ApiConfig) {
  if (config.nodeEnv === "production" && (config.supabaseUrl || config.supabasePublishableKey)) {
    throw new Error("Supabase env values must stay empty in production self-hosted API config.");
  }
}
