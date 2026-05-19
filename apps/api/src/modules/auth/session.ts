import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthSessionResponse } from "../../../../../packages/contracts/dist/index.js";
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

export interface AuthenticatedAccountSession {
  userId: string;
  sessionId: string;
}

export interface AccountSessionAuthority {
  getSession(sessionId: string | undefined, requestId: string): Promise<AuthSessionResponse>;
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

export async function resolveAuthenticatedAccountSession(
  request: IncomingMessage,
  authority: AccountSessionAuthority,
  context: ApiRequestContext,
  options: { allowQueryUserId?: boolean } = {},
): Promise<AuthenticatedAccountSession> {
  const parsed = resolveAccountSession(request, options);
  if (!parsed.sessionId) {
    throw new AccountSessionError(
      "account_session_required",
      `Account requests must include ${accountSessionIdHeaderName}.`,
    );
  }

  let response: AuthSessionResponse;
  try {
    response = await authority.getSession(parsed.sessionId, context.requestId);
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "AuthServiceError") {
      throw error;
    }
    throw new AccountSessionError(
      "account_session_invalid",
      "Account session is invalid or expired.",
    );
  }

  if (response.session.userId !== parsed.userId) {
    throw new AccountSessionError(
      "account_session_invalid",
      "Account session does not match the requested user.",
    );
  }

  return {
    userId: response.session.userId,
    sessionId: response.session.id,
  };
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

export async function resolveOptionalAuthenticatedAccountSession(
  request: IncomingMessage,
  authority: AccountSessionAuthority,
  context: ApiRequestContext,
  options: { allowQueryUserId?: boolean } = {},
): Promise<AuthenticatedAccountSession | null> {
  const userIdFromHeader = firstHeader(request.headers[accountUserIdHeaderName])?.trim();
  const sessionIdFromHeader = firstHeader(request.headers[accountSessionIdHeaderName])?.trim();
  const url = options.allowQueryUserId ? getRequestUrl(request) : null;
  const userIdFromQuery = url?.searchParams.get("accountUserId")?.trim();
  const sessionIdFromQuery = url?.searchParams.get("accountSessionId")?.trim();

  if (!userIdFromHeader && !sessionIdFromHeader && !userIdFromQuery && !sessionIdFromQuery) {
    return null;
  }

  return resolveAuthenticatedAccountSession(request, authority, context, options);
}

export function sendAccountSessionError(
  response: ServerResponse,
  context: ApiRequestContext,
  error: AccountSessionError,
) {
  sendError(response, 401, error.code, error.message, context);
}

export { accountSessionIdHeaderName, accountUserIdHeaderName };
