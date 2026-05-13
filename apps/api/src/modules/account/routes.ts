import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { type ApiRequestContext, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import type { AccountService } from "./service.js";

const getCurrentUserId = (request: IncomingMessage) => request.headers["x-demo-user-id"]?.toString() || "00000000-0000-4000-8000-000000000001";

type AccountCollectionName = "branches" | "products" | "metaRegions" | "notifications";

const accountCollections = {
  "/v1/account/branches": {
    key: "branches",
    get: (service: AccountService, userId: string) => service.getBranches(userId),
    replace: (service: AccountService, userId: string, payload: unknown) => service.replaceBranches(userId, payload),
  },
  "/v1/account/products": {
    key: "products",
    get: (service: AccountService, userId: string) => service.getProducts(userId),
    replace: (service: AccountService, userId: string, payload: unknown) => service.replaceProducts(userId, payload),
  },
  "/v1/account/meta-regions": {
    key: "metaRegions",
    get: (service: AccountService, userId: string) => service.getMetaRegions(userId),
    replace: (service: AccountService, userId: string, payload: unknown) => service.replaceMetaRegions(userId, payload),
  },
  "/v1/account/notifications": {
    key: "notifications",
    get: (service: AccountService, userId: string) => service.getNotifications(userId),
    replace: (service: AccountService, userId: string, payload: unknown) => service.replaceNotifications(userId, payload),
  },
} satisfies Record<string, {
  key: AccountCollectionName;
  get: (service: AccountService, userId: string) => Promise<unknown>;
  replace: (service: AccountService, userId: string, payload: unknown) => Promise<unknown>;
}>;

export async function handleAccountRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AccountService,
  pathname: string,
) {
  const userId = getCurrentUserId(request);

  try {
    if (pathname === "/v1/account/me") {
      if (request.method === "GET") {
        const profile = await service.getCurrentUserProfile(userId);
        sendJson(response, 200, {
          ok: true,
          user: profile,
          requestId: context.requestId,
        });
        return true;
      }

      if (request.method === "PATCH") {
        const payload = await readJsonBody(request);
        const profile = await service.updateCurrentUserProfile(userId, payload);
        sendJson(response, 200, {
          ok: true,
          user: profile,
          requestId: context.requestId,
        });
        return true;
      }

      methodNotAllowed(response, context, "GET, PATCH");
      return true;
    }

    if (pathname === "/v1/account/company") {
      if (request.method === "GET") {
        const company = await service.getCompanyProfile(userId);
        sendJson(response, 200, {
          ok: true,
          company,
          requestId: context.requestId,
        });
        return true;
      }

      if (request.method === "PATCH") {
        const payload = await readJsonBody(request);
        const company = await service.updateCompanyProfile(userId, payload);
        sendJson(response, 200, {
          ok: true,
          company,
          requestId: context.requestId,
        });
        return true;
      }

      methodNotAllowed(response, context, "GET, PATCH");
      return true;
    }

    const collection = accountCollections[pathname as keyof typeof accountCollections];
    if (collection) {
      if (request.method === "GET") {
        const items = await collection.get(service, userId);
        sendJson(response, 200, {
          ok: true,
          [collection.key]: items,
          requestId: context.requestId,
        });
        return true;
      }

      if (request.method === "PATCH") {
        const payload = await readJsonBody(request);
        const items = await collection.replace(service, userId, payload);
        sendJson(response, 200, {
          ok: true,
          [collection.key]: items,
          requestId: context.requestId,
        });
        return true;
      }

      methodNotAllowed(response, context, "GET, PATCH");
      return true;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      sendValidationError(response, context, error);
      return true;
    }

    if (error instanceof Error && error.message === "invalid_json") {
      sendError(response, 400, "invalid_json", "Request body must be valid JSON.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_too_large") {
      sendError(response, 413, "request_body_too_large", "Request body is too large.", context);
      return true;
    }

    if (error instanceof Error && (error.message === "user_not_found" || error.message === "company_not_found")) {
      sendError(response, 404, error.message, "Account resource was not found.", context);
      return true;
    }

    throw error;
  }

  return false;
}
