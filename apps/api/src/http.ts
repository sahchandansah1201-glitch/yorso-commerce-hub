import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

export interface JsonResponseBody {
  [key: string]: unknown;
}

export interface ApiRequestContext {
  requestId: string;
  startedAt: number;
}

export function createRequestContext(): ApiRequestContext {
  return {
    requestId: randomUUID(),
    startedAt: Date.now(),
  };
}

export function sendJson(response: ServerResponse, statusCode: number, body: JsonResponseBody) {
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
  sendJson(response, statusCode, {
    ok: false,
    error: {
      code,
      message,
    },
    requestId: context.requestId,
  });
}

export function sendValidationError(response: ServerResponse, context: ApiRequestContext, error: unknown) {
  const issues =
    error instanceof ZodError
      ? error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      : [];

  sendJson(response, 400, {
    ok: false,
    error: {
      code: "validation_error",
      message: "Request payload failed validation.",
      issues,
    },
    requestId: context.requestId,
  });
}

export async function readJsonBody(request: IncomingMessage, maxBytes = 64 * 1024) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
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

export function getRequestUrl(request: IncomingMessage) {
  return new URL(request.url ?? "/", "http://localhost");
}

export function methodNotAllowed(response: ServerResponse, context: ApiRequestContext, allowed = "GET") {
  response.setHeader("allow", allowed);
  sendError(response, 405, "method_not_allowed", `Only ${allowed} is supported for this endpoint.`, context);
}
