import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

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

export function getRequestUrl(request: IncomingMessage) {
  return new URL(request.url ?? "/", "http://localhost");
}

export function methodNotAllowed(response: ServerResponse, context: ApiRequestContext, allowed = "GET") {
  response.setHeader("allow", allowed);
  sendError(response, 405, "method_not_allowed", `Only ${allowed} is supported for this endpoint.`, context);
}
