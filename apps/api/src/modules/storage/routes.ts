import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { type ApiRequestContext, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import type { AccountService } from "../account/service.js";
import type { FileService } from "./service.js";

const getCurrentUserId = (request: IncomingMessage) =>
  request.headers["x-demo-user-id"]?.toString() || "00000000-0000-4000-8000-000000000001";

export async function handleStorageRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  accountService: AccountService,
  fileService: FileService,
  pathname: string,
) {
  const userId = getCurrentUserId(request);

  try {
    if (pathname === "/v1/account/documents") {
      if (request.method === "GET") {
        const company = await accountService.getCompanyProfile(userId);
        const documents = await fileService.listCompanyDocuments(company.id);
        sendJson(response, 200, { ok: true, documents, requestId: context.requestId });
        return true;
      }

      if (request.method === "POST") {
        const company = await accountService.getCompanyProfile(userId);
        const payload = fileService.parseDocumentCreate(await readJsonBody(request, fileService.maxJsonBodyBytes));
        const document = await fileService.createCompanyDocument({ userId, companyId: company.id, payload });
        sendJson(response, 201, { ok: true, document, requestId: context.requestId });
        return true;
      }

      methodNotAllowed(response, context, "GET, POST");
      return true;
    }

    if (pathname === "/v1/account/company/media/logo" || pathname === "/v1/account/company/media/cover") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const slot = pathname.endsWith("/logo") ? "logo" : "cover";
      const company = await accountService.getCompanyProfile(userId);
      const upload = fileService.parseMediaUpload(await readJsonBody(request, fileService.maxJsonBodyBytes));
      const asset = await fileService.storeAccountFile({
        userId,
        companyId: company.id,
        purpose: slot === "logo" ? "company_logo" : "company_cover",
        upload,
      });
      const nextCompany = await accountService.updateCompanyProfile(userId, {
        media: slot === "logo"
          ? {
              logoObjectKey: asset.objectKey,
              logoAlt: upload.alt ?? company.media.logoAlt,
            }
          : {
              coverObjectKey: asset.objectKey,
              coverAlt: upload.alt ?? company.media.coverAlt,
            },
      });

      sendJson(response, 201, {
        ok: true,
        asset,
        company: nextCompany,
        requestId: context.requestId,
      });
      return true;
    }

    if (pathname.startsWith("/v1/account/files/")) {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const assetId = decodeURIComponent(pathname.slice("/v1/account/files/".length));
      const file = await fileService.getFileForUser(userId, assetId);
      response.writeHead(200, {
        "content-type": file.contentType,
        "content-length": String(file.bytes.byteLength),
        "content-disposition": `inline; filename="${sanitizeHeaderFileName(file.asset.originalFileName)}"`,
        "cache-control": "private, max-age=300",
        "x-request-id": context.requestId,
      });
      response.end(file.bytes);
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

    if (error instanceof Error && (error.message === "upload_too_large" || error.message === "upload_size_mismatch")) {
      sendError(response, 400, error.message, "Uploaded file payload is invalid.", context);
      return true;
    }

    if (error instanceof Error && (error.message === "company_not_found" || error.message === "file_asset_not_found")) {
      sendError(response, 404, error.message, "Requested account file resource was not found.", context);
      return true;
    }

    throw error;
  }

  return false;
}

const sanitizeHeaderFileName = (value: string) => value.replace(/["\\\r\n]/g, "_");
