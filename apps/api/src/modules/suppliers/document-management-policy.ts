import type {
  SupplierDocumentManagementAction,
  SupplierDocumentManagementAuditAction,
  SupplierDocumentManagementRole,
  SupplierDocumentStatus,
} from "../../../../../packages/contracts/dist/index.js";

export type SupplierDocumentManagementReason =
  | "allowed"
  | "admin_role_required"
  | "approved_document_immutable"
  | "current_status_required"
  | "invalid_status_transition";

export type SupplierDocumentManagementDecision =
  | {
      allowed: true;
      auditAction: SupplierDocumentManagementAuditAction;
      nextStatus: SupplierDocumentStatus | null;
      reason: "allowed";
    }
  | {
      allowed: false;
      auditAction: SupplierDocumentManagementAuditAction;
      nextStatus: null;
      reason: Exclude<SupplierDocumentManagementReason, "allowed">;
    };

export const supplierDocumentManagementAuditActionByAction: Record<
  SupplierDocumentManagementAction,
  SupplierDocumentManagementAuditAction
> = {
  approve: "supplier_document.approve",
  create: "supplier_document.create",
  delete: "supplier_document.delete",
  expire: "supplier_document.expire",
  reject: "supplier_document.reject",
  submit_for_review: "supplier_document.submit_for_review",
  update_metadata: "supplier_document.update_metadata",
};

type PolicyInput = {
  actorRole: SupplierDocumentManagementRole;
  action: SupplierDocumentManagementAction;
  currentStatus: SupplierDocumentStatus | null;
};

const mutableOwnerStatuses = new Set<SupplierDocumentStatus>(["review", "on_request"]);
const mutableAdminStatuses = new Set<SupplierDocumentStatus>(["review", "on_request", "expired"]);
const deletableAdminStatuses = new Set<SupplierDocumentStatus>(["review", "on_request", "expired"]);

const allow = (
  action: SupplierDocumentManagementAction,
  nextStatus: SupplierDocumentStatus | null,
): SupplierDocumentManagementDecision => ({
  allowed: true,
  auditAction: supplierDocumentManagementAuditActionByAction[action],
  nextStatus,
  reason: "allowed",
});

const deny = (
  action: SupplierDocumentManagementAction,
  reason: Exclude<SupplierDocumentManagementReason, "allowed">,
): SupplierDocumentManagementDecision => ({
  allowed: false,
  auditAction: supplierDocumentManagementAuditActionByAction[action],
  nextStatus: null,
  reason,
});

export function evaluateSupplierDocumentManagementPolicy(input: PolicyInput): SupplierDocumentManagementDecision {
  const { action, actorRole, currentStatus } = input;

  if (action === "create") {
    return currentStatus === null ? allow(action, "review") : deny(action, "invalid_status_transition");
  }

  if (currentStatus === null) {
    return deny(action, "current_status_required");
  }

  if (currentStatus === "approved" && (action === "update_metadata" || action === "delete")) {
    return deny(action, "approved_document_immutable");
  }

  switch (action) {
    case "update_metadata": {
      const allowedStatuses = actorRole === "admin" ? mutableAdminStatuses : mutableOwnerStatuses;
      return allowedStatuses.has(currentStatus) ? allow(action, currentStatus) : deny(action, "invalid_status_transition");
    }
    case "submit_for_review":
      return actorRole === "supplier_owner" && currentStatus === "on_request"
        ? allow(action, "review")
        : deny(action, "invalid_status_transition");
    case "approve":
      if (actorRole !== "admin") {
        return deny(action, "admin_role_required");
      }
      return currentStatus === "review" ? allow(action, "approved") : deny(action, "invalid_status_transition");
    case "reject":
      if (actorRole !== "admin") {
        return deny(action, "admin_role_required");
      }
      return currentStatus === "review" ? allow(action, "on_request") : deny(action, "invalid_status_transition");
    case "expire":
      if (actorRole !== "admin") {
        return deny(action, "admin_role_required");
      }
      return currentStatus === "approved" ? allow(action, "expired") : deny(action, "invalid_status_transition");
    case "delete":
      if (actorRole === "supplier_owner") {
        return mutableOwnerStatuses.has(currentStatus) ? allow(action, null) : deny(action, "invalid_status_transition");
      }
      return deletableAdminStatuses.has(currentStatus) ? allow(action, null) : deny(action, "invalid_status_transition");
  }
}
