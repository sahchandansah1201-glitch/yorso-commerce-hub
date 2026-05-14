import type { IncomingMessage, ServerResponse } from "node:http";
import {
  accountSessionHeadersSchema,
  accountSessionIdHeaderName,
  accountUserIdHeaderName,
} from "../../../../../packages/contracts/dist/index.js";
import type { ApiRequestContext } from "../../http.js";
import { getRequestUrl, sendError } from "../../http.js";

export interface AccountSession {
  userId: string;
  sessionId?: string;
}

export class AccountSessionError extends Error {
  constructor(
    public readonly code: "account_session_required" | "account_session_invalid",
    message: string,
  ) {
    super(message);
    this.name = "AccountSessionError";
  }
}

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function resolveAccountSession(
  request: IncomingMessage,
  options: { allowQueryUserId?: boolean } = {},
): AccountSession {
  const userIdFromHeader = firstHeader(request.headers[accountUserIdHeaderName]);
  const sessionIdFromHeader = firstHeader(request.headers[accountSessionIdHeaderName]);
  const url = options.allowQueryUserId ? getRequestUrl(request) : null;
  const userId = userIdFromHeader?.trim() || url?.searchParams.get("accountUserId")?.trim() || "";
  const sessionId = sessionIdFromHeader?.trim() || url?.searchParams.get("accountSessionId")?.trim() || undefined;

  if (!userId) {
    throw new AccountSessionError(
      "account_session_required",
      `Account requests must include ${accountUserIdHeaderName}.`,
    );
  }

  const parsed = accountSessionHeadersSchema.safeParse({ userId, sessionId });
  if (!parsed.success) {
    throw new AccountSessionError(
      "account_session_invalid",
      "Account session headers failed validation.",
    );
  }

  return parsed.data;
}

export function resolveOptionalAccountSession(
  request: IncomingMessage,
  options: { allowQueryUserId?: boolean } = {},
): AccountSession | null {
  const userIdFromHeader = firstHeader(request.headers[accountUserIdHeaderName])?.trim();
  const sessionIdFromHeader = firstHeader(request.headers[accountSessionIdHeaderName])?.trim();
  const url = options.allowQueryUserId ? getRequestUrl(request) : null;
  const userIdFromQuery = url?.searchParams.get("accountUserId")?.trim();
  const sessionIdFromQuery = url?.searchParams.get("accountSessionId")?.trim();

  if (!userIdFromHeader && !sessionIdFromHeader && !userIdFromQuery && !sessionIdFromQuery) {
    return null;
  }

  return resolveAccountSession(request, options);
}

export function sendAccountSessionError(
  response: ServerResponse,
  context: ApiRequestContext,
  error: AccountSessionError,
) {
  sendError(response, 401, error.code, error.message, context);
}

export { accountSessionIdHeaderName, accountUserIdHeaderName };
