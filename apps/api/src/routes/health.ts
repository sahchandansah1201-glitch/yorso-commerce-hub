import type { ServerResponse } from "node:http";
import type { ApiConfig } from "../config.js";
import type { ApiRequestContext } from "../http.js";
import { sendJson } from "../http.js";

export function handleLive(response: ServerResponse, context: ApiRequestContext) {
  sendJson(response, 200, {
    ok: true,
    service: "yorso-api",
    status: "live",
    requestId: context.requestId,
  });
}

export function handleReady(response: ServerResponse, context: ApiRequestContext, config: ApiConfig) {
  sendJson(response, 200, {
    ok: true,
    service: "yorso-api",
    status: "ready",
    selfHostedBackend: true,
    supabaseProductionBackend: false,
    dependencies: {
      postgresConfigured: config.databaseUrl.startsWith("postgres"),
      redisConfigured: config.redisUrl.startsWith("redis://"),
      objectStorageConfigured: Boolean(config.s3Endpoint && config.s3Bucket),
    },
    requestId: context.requestId,
  });
}
