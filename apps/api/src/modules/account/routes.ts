import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { type ApiRequestContext, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import { AccountSessionError, resolveAccountSession, sendAccountSessionError } from "../auth/session.js";
import type { AccountService } from "./service.js";

type AccountCollectionName = "branches" | "products" | "metaRegions" | "notifications";
type AccountItemName = "branch" | "product" | "metaRegion" | "notification";

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

const accountCollectionItems = [
  {
    prefix: "/v1/account/branches/",
    key: "branch",
    get: async (service: AccountService, userId: string, itemId: string) =>
      (await service.getBranches(userId)).find((item) => item.id === itemId),
    create: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.createBranch(userId, itemId, payload),
    update: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.updateBranch(userId, itemId, payload),
    remove: (service: AccountService, userId: string, itemId: string) => service.deleteBranch(userId, itemId),
  },
  {
    prefix: "/v1/account/products/",
    key: "product",
    get: async (service: AccountService, userId: string, itemId: string) =>
      (await service.getProducts(userId)).find((item) => item.id === itemId),
    create: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.createProduct(userId, itemId, payload),
    update: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.updateProduct(userId, itemId, payload),
    remove: (service: AccountService, userId: string, itemId: string) => service.deleteProduct(userId, itemId),
  },
  {
    prefix: "/v1/account/meta-regions/",
    key: "metaRegion",
    get: async (service: AccountService, userId: string, itemId: string) =>
      (await service.getMetaRegions(userId)).find((item) => item.id === itemId),
    create: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.createMetaRegion(userId, itemId, payload),
    update: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.updateMetaRegion(userId, itemId, payload),
    remove: (service: AccountService, userId: string, itemId: string) => service.deleteMetaRegion(userId, itemId),
  },
  {
    prefix: "/v1/account/notifications/",
    key: "notification",
    get: async (service: AccountService, userId: string, itemId: string) =>
      (await service.getNotifications(userId)).find((item) => item.id === itemId),
    create: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.createNotification(userId, itemId, payload),
    update: (service: AccountService, userId: string, itemId: string, payload: unknown) =>
      service.updateNotification(userId, itemId, payload),
    remove: (service: AccountService, userId: string, itemId: string) => service.deleteNotification(userId, itemId),
  },
] satisfies Array<{
  prefix: string;
  key: AccountItemName;
  get: (service: AccountService, userId: string, itemId: string) => Promise<unknown | undefined>;
  create: (service: AccountService, userId: string, itemId: string, payload: unknown) => Promise<unknown>;
  update: (service: AccountService, userId: string, itemId: string, payload: unknown) => Promise<unknown>;
  remove: (service: AccountService, userId: string, itemId: string) => Promise<unknown>;
}>;

function matchCollectionItem(pathname: string) {
  for (const collection of accountCollectionItems) {
    if (!pathname.startsWith(collection.prefix)) continue;
    const rawId = pathname.slice(collection.prefix.length);
    if (!rawId || rawId.includes("/")) continue;
    return {
      collection,
      itemId: decodeURIComponent(rawId),
    };
  }
  return null;
}

export async function handleAccountRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AccountService,
  pathname: string,
) {
  try {
    if (pathname === "/v1/account/me") {
      const { userId } = resolveAccountSession(request);

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
      const { userId } = resolveAccountSession(request);

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
      const { userId } = resolveAccountSession(request);

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

    const collectionItem = matchCollectionItem(pathname);
    if (collectionItem) {
      const { userId } = resolveAccountSession(request);
      const { collection, itemId } = collectionItem;

      if (request.method === "GET") {
        const item = await collection.get(service, userId, itemId);
        if (!item) throw new Error("workspace_item_not_found");
        sendJson(response, 200, {
          ok: true,
          [collection.key]: item,
          requestId: context.requestId,
        });
        return true;
      }

      if (request.method === "POST") {
        const payload = await readJsonBody(request);
        const item = await collection.create(service, userId, itemId, payload);
        sendJson(response, 201, {
          ok: true,
          [collection.key]: item,
          requestId: context.requestId,
        });
        return true;
      }

      if (request.method === "PATCH") {
        const payload = await readJsonBody(request);
        const item = await collection.update(service, userId, itemId, payload);
        sendJson(response, 200, {
          ok: true,
          [collection.key]: item,
          requestId: context.requestId,
        });
        return true;
      }

      if (request.method === "DELETE") {
        const item = await collection.remove(service, userId, itemId);
        sendJson(response, 200, {
          ok: true,
          deletedId: itemId,
          [collection.key]: item,
          requestId: context.requestId,
        });
        return true;
      }

      methodNotAllowed(response, context, "GET, POST, PATCH, DELETE");
      return true;
    }
  } catch (error) {
    if (error instanceof AccountSessionError) {
      sendAccountSessionError(response, context, error);
      return true;
    }

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

    if (error instanceof Error && error.message === "workspace_item_not_found") {
      sendError(response, 404, error.message, "Workspace item was not found for this account.", context);
      return true;
    }

    if (error instanceof Error && error.message === "workspace_item_conflict") {
      sendError(response, 409, error.message, "Workspace item already exists for this account.", context);
      return true;
    }

    throw error;
  }

  return false;
}
