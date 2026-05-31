import { describe, expect, it } from "vitest";
import {
  evaluateSupplierDocumentManagementPolicy,
  supplierDocumentManagementAuditActionByAction,
} from "./document-management-policy.js";

describe("supplier document management policy", () => {
  it("allows supplier owners to create review documents and update only non-approved metadata", () => {
    expect(
      evaluateSupplierDocumentManagementPolicy({
        actorRole: "supplier_owner",
        action: "create",
        currentStatus: null,
      }),
    ).toMatchObject({
      allowed: true,
      auditAction: "supplier_document.create",
      nextStatus: "review",
    });

    expect(
      evaluateSupplierDocumentManagementPolicy({
        actorRole: "supplier_owner",
        action: "update_metadata",
        currentStatus: "review",
      }),
    ).toMatchObject({
      allowed: true,
      nextStatus: "review",
    });

    expect(
      evaluateSupplierDocumentManagementPolicy({
        actorRole: "supplier_owner",
        action: "update_metadata",
        currentStatus: "approved",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "approved_document_immutable",
    });
  });

  it("keeps approval and rejection admin-only with explicit status transitions", () => {
    expect(
      evaluateSupplierDocumentManagementPolicy({
        actorRole: "admin",
        action: "approve",
        currentStatus: "review",
      }),
    ).toMatchObject({
      allowed: true,
      auditAction: "supplier_document.approve",
      nextStatus: "approved",
    });

    expect(
      evaluateSupplierDocumentManagementPolicy({
        actorRole: "supplier_owner",
        action: "approve",
        currentStatus: "review",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "admin_role_required",
    });

    expect(
      evaluateSupplierDocumentManagementPolicy({
        actorRole: "admin",
        action: "reject",
        currentStatus: "review",
      }),
    ).toMatchObject({
      allowed: true,
      nextStatus: "on_request",
    });
  });

  it("prevents direct deletion of approved documents to preserve buyer audit history", () => {
    for (const actorRole of ["supplier_owner", "admin"] as const) {
      expect(
        evaluateSupplierDocumentManagementPolicy({
          actorRole,
          action: "delete",
          currentStatus: "approved",
        }),
      ).toMatchObject({
        allowed: false,
        reason: "approved_document_immutable",
      });
    }
  });

  it("keeps the audit action map stable for future route implementation", () => {
    expect(supplierDocumentManagementAuditActionByAction).toEqual({
      approve: "supplier_document.approve",
      create: "supplier_document.create",
      delete: "supplier_document.delete",
      expire: "supplier_document.expire",
      reject: "supplier_document.reject",
      submit_for_review: "supplier_document.submit_for_review",
      update_metadata: "supplier_document.update_metadata",
    });
  });
});
