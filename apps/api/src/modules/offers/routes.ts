import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { methodNotAllowed, sendError, sendJson, sendValidationError, type ApiRequestContext } from "../../http.js";
import type { OfferCatalogService } from "./service.js";

const queryParams = (url: URL) => Object.fromEntries(url.searchParams.entries());

export async function handleOfferCatalogRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: OfferCatalogService,
  url: URL,
) {
  try {
    if (url.pathname === "/v1/offers") {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      sendJson(response, 200, await service.listOffers(queryParams(url), context.requestId));
      return true;
    }

    if (url.pathname.startsWith("/v1/offers/")) {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const id = decodeURIComponent(url.pathname.slice("/v1/offers/".length));
      if (!id || id.includes("/")) return false;
      sendJson(response, 200, await service.getOfferById(id, queryParams(url), context.requestId));
      return true;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      sendValidationError(response, context, error);
      return true;
    }

    if (error instanceof Error && error.message === "offer_not_found") {
      sendError(response, 404, error.message, "Offer was not found.", context);
      return true;
    }

    throw error;
  }

  return false;
}
