import type { IncomingMessage } from "node:http";

export const ACCOUNT_VERSION_HEADER = "x-yorso-account-version";

export type AccountVersionPreconditionMode = "optional" | "required";

export interface AccountVersionPreconditionOptions {
  versionPreconditionMode?: AccountVersionPreconditionMode;
}

export function readAccountVersionHeader(request: IncomingMessage) {
  const value = request.headers[ACCOUNT_VERSION_HEADER];
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return typeof value === "string" ? value.trim() : "";
}

export function readAccountVersionPrecondition(
  request: IncomingMessage,
  options: AccountVersionPreconditionOptions = {},
) {
  const version = readAccountVersionHeader(request);
  if (options.versionPreconditionMode === "required" && !version) {
    throw new Error("account_version_required");
  }
  return version;
}
