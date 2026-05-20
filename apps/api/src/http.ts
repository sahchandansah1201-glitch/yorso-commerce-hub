import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

export interface JsonResponseBody {
  [key: string]: unknown;
}

export interface ApiRequestContext {
  correlationId: string;
  error?: ApiErrorContext;
  requestId: string;
  startedAt: number;
  guardrail?: RequestGuardrailContext;
}

export interface ApiErrorContext {
  category: ApiErrorCategory;
  code: string;
  errorId: string;
  statusCode: number;
}

export type ApiErrorCategory =
  | "auth"
  | "client"
  | "conflict"
  | "guardrail"
  | "not_found"
  | "rate_limit"
  | "server"
  | "validation";

export interface JsonBodyReadOptions {
  maxBytes?: number;
  idleTimeoutMs?: number;
}

export interface RequestGuardrailContext {
  code: string;
  kind: "body_idle_timeout" | "body_size" | "request_timeout" | "server_draining";
}

export function createRequestContext(): ApiRequestContext {
  const requestId = randomUUID();
  return {
    correlationId: requestId,
    requestId,
    startedAt: Date.now(),
  };
}

export function sendJson(response: ServerResponse, statusCode: number, body: JsonResponseBody) {
  if (response.writableEnded) return;
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

export function sendError(
  response: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  context: ApiRequestContext,
) {
  markRequestGuardrail(context, code);
  const apiError = markApiError(context, statusCode, code);
  response.setHeader("x-request-id", context.requestId);
  response.setHeader("x-correlation-id", context.correlationId);
  response.setHeader("x-error-id", apiError.errorId);
  sendJson(response, statusCode, {
    ok: false,
    error: {
      code,
      errorId: apiError.errorId,
      message,
    },
    correlationId: context.correlationId,
    requestId: context.requestId,
  });
}

export function markRequestGuardrail(context: ApiRequestContext, code: string) {
  if (context.guardrail) return;
  const kind = requestGuardrailKind(code);
  if (!kind) return;
  context.guardrail = { code, kind };
}

export function sendValidationError(response: ServerResponse, context: ApiRequestContext, error: unknown) {
  const issues =
    error instanceof ZodError
      ? error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      : [];

  const apiError = markApiError(context, 400, "validation_error");
  response.setHeader("x-request-id", context.requestId);
  response.setHeader("x-correlation-id", context.correlationId);
  response.setHeader("x-error-id", apiError.errorId);
  sendJson(response, 400, {
    ok: false,
    error: {
      code: "validation_error",
      errorId: apiError.errorId,
      message: "Request payload failed validation.",
      issues,
    },
    correlationId: context.correlationId,
    requestId: context.requestId,
  });
}

export function markApiError(context: ApiRequestContext, statusCode: number, code: string) {
  if (context.error) return context.error;
  const apiError = {
    category: classifyApiError(statusCode, code),
    code,
    errorId: `err_${randomUUID()}`,
    statusCode,
  };
  context.error = apiError;
  return apiError;
}

export async function readJsonBody(
  request: IncomingMessage,
  maxBytesOrOptions: number | JsonBodyReadOptions = 64 * 1024,
) {
  const options = typeof maxBytesOrOptions === "number"
    ? { maxBytes: maxBytesOrOptions }
    : maxBytesOrOptions;
  const maxBytes = options.maxBytes ?? 64 * 1024;
  const idleTimeoutMs = options.idleTimeoutMs ?? 5_000;
  const contentLength = request.headers["content-length"];
  const declaredLength = Array.isArray(contentLength) ? contentLength[0] : contentLength;
  if (declaredLength && Number.isFinite(Number(declaredLength)) && Number(declaredLength) > maxBytes) {
    throw new Error("request_body_too_large");
  }

  const chunks: Buffer[] = [];
  let size = 0;

  const iterator = request[Symbol.asyncIterator]();
  while (true) {
    const next = await withBodyIdleTimeout(iterator.next(), idleTimeoutMs);
    if (next.done) break;
    const buffer = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value);
    size += buffer.byteLength;
    if (size > maxBytes) {
      throw new Error("request_body_too_large");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("invalid_json");
  }
}

async function withBodyIdleTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("request_body_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function requestGuardrailKind(code: string): RequestGuardrailContext["kind"] | undefined {
  switch (code) {
    case "request_timeout":
      return "request_timeout";
    case "request_body_timeout":
      return "body_idle_timeout";
    case "request_body_too_large":
      return "body_size";
    case "server_draining":
      return "server_draining";
    default:
      return undefined;
  }
}

function classifyApiError(statusCode: number, code: string): ApiErrorCategory {
  if (requestGuardrailKind(code)) return "guardrail";
  if (statusCode === 429 || code.includes("rate_limited")) return "rate_limit";
  if (statusCode === 401 || statusCode === 403 || code.startsWith("auth_") || code.includes("session")) {
    return "auth";
  }
  if (code === "validation_error") return "validation";
  if (statusCode === 404 || code.endsWith("_not_found") || code === "not_found") return "not_found";
  if (statusCode === 409 || code.includes("conflict") || code.includes("already_exists")) return "conflict";
  if (statusCode >= 500) return "server";
  return "client";
}

export function getRequestUrl(request: IncomingMessage) {
  return new URL(request.url ?? "/", "http://localhost");
}

export function methodNotAllowed(response: ServerResponse, context: ApiRequestContext, allowed = "GET") {
  response.setHeader("allow", allowed);
  sendError(response, 405, "method_not_allowed", `Only ${allowed} is supported for this endpoint.`, context);
}
