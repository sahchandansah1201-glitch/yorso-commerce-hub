import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import { type ApiRequestContext, type JsonBodyReadOptions, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import type { AccountService } from "../account/service.js";
import {
  AccountSessionError,
  type AccountSessionAuthority,
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
} from "../auth/session.js";
import type { FileService } from "./service.js";

export async function handleStorageRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  accountService: AccountService,
  fileService: FileService,
  sessionAuthority: AccountSessionAuthority,
  pathname: string,
  jsonBodyOptions: JsonBodyReadOptions,
  auditSink: AuditSink,
) {
  try {
    if (pathname === "/v1/account/files/by-object-key") {
      const { userId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context, { allowQueryUserId: true });

      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const objectKey = new URL(request.url ?? "", "http://localhost").searchParams.get("objectKey")?.trim();
      if (!objectKey) {
        sendError(response, 400, "missing_object_key", "File object key is required.", context);
        return true;
      }

      const file = await fileService.getFileByObjectKeyForUser(userId, objectKey);
      sendFile(response, context.requestId, file);
      return true;
    }

    if (pathname === "/v1/account/documents") {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context);

      if (request.method === "GET") {
        const company = await accountService.getCompanyProfile(userId);
        const documents = await fileService.listCompanyDocuments(company.id);
        sendJson(response, 200, { ok: true, documents, requestId: context.requestId });
        return true;
      }

      if (request.method === "POST") {
        const company = await accountService.getCompanyProfile(userId);
        const payload = fileService.parseDocumentCreate(await readJsonBody(request, {
          ...jsonBodyOptions,
          maxBytes: fileService.maxJsonBodyBytes,
        }));
        const document = await fileService.createCompanyDocument({ userId, companyId: company.id, payload });
        auditFromRequest(auditSink, context, request, {
          action: "storage.document.create",
          actorUserId: userId,
          outcome: "success",
          resourceId: document.id,
          resourceType: "company_document",
          route: "/v1/account/documents",
          sessionId,
          statusCode: 201,
        });
        sendJson(response, 201, { ok: true, document, requestId: context.requestId });
        return true;
      }

      methodNotAllowed(response, context, "GET, POST");
      return true;
    }

    if (pathname === "/v1/account/company/media/logo" || pathname === "/v1/account/company/media/cover") {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context);

      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const slot = pathname.endsWith("/logo") ? "logo" : "cover";
      const company = await accountService.getCompanyProfile(userId);
      const upload = fileService.parseMediaUpload(await readJsonBody(request, {
        ...jsonBodyOptions,
        maxBytes: fileService.maxJsonBodyBytes,
      }));
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

      auditFromRequest(auditSink, context, request, {
        action: "storage.company_media.upload",
        actorUserId: userId,
        outcome: "success",
        reason: slot,
        resourceId: asset.id,
        resourceType: "account_file_asset",
        route: "/v1/account/company/media/:slot",
        sessionId,
        statusCode: 201,
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
      const { userId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context, { allowQueryUserId: true });

      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const assetId = decodeURIComponent(pathname.slice("/v1/account/files/".length));
      const file = await fileService.getFileForUser(userId, assetId);
      sendFile(response, context.requestId, file);
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

    if (error instanceof Error && error.message === "request_body_timeout") {
      sendError(response, 408, "request_body_timeout", "Request body read timed out.", context);
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

const sendFile = (
  response: ServerResponse,
  requestId: string,
  file: Awaited<ReturnType<FileService["getFileForUser"]>>,
) => {
  response.writeHead(200, {
    "content-type": file.contentType,
    "content-length": String(file.bytes.byteLength),
    "content-disposition": `inline; filename="${sanitizeHeaderFileName(file.asset.originalFileName)}"`,
    "cache-control": "private, max-age=300",
    "x-request-id": requestId,
  });
  response.end(file.bytes);
};
