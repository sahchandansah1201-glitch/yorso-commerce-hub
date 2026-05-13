import type { ServerResponse } from "node:http";
import type {
  AccountBranchesUpdate,
  AccountFileAsset,
  AccountFileUploadPayload,
  AccountMetaRegionsUpdate,
  AccountNotificationsUpdate,
  AccountProductsUpdate,
  AccountSessionHeaders,
  CompanyDocument,
  CompanyDocumentCreate,
  CompanyProfile,
  CompanyProfileUpdate,
  UserProfile,
  UserProfileUpdate,
} from "../../../../packages/contracts/dist/index.js";
import { accountSessionIdHeaderName, accountUserIdHeaderName } from "../../../../packages/contracts/dist/index.js";
import type { ApiRequestContext } from "../http.js";
import { sendJson } from "../http.js";

type ContractExample = {
  companyProfile: Pick<CompanyProfile, "accountRole" | "publicationStatus" | "buyerQualificationStatus">;
  companyUpdate: Pick<CompanyProfileUpdate, "media" | "productFocus">;
  userProfile: Pick<UserProfile, "preferredLanguage" | "timezone">;
  userUpdate: Pick<UserProfileUpdate, "firstName" | "preferredLanguage">;
  branches: AccountBranchesUpdate;
  products: AccountProductsUpdate;
  metaRegions: AccountMetaRegionsUpdate;
  notifications: AccountNotificationsUpdate;
  fileUpload: AccountFileUploadPayload;
  fileAsset: Pick<AccountFileAsset, "purpose" | "objectKey" | "contentType" | "storageDriver">;
  documentCreate: CompanyDocumentCreate;
  document: Pick<CompanyDocument, "documentType" | "visibility" | "status" | "fileName">;
  accountSession: AccountSessionHeaders;
};

const contractExample: ContractExample = {
  companyProfile: {
    accountRole: "both",
    publicationStatus: "draft",
    buyerQualificationStatus: "not_started",
  },
  companyUpdate: {
    productFocus: ["Atlantic Salmon"],
    media: {
      logoObjectKey: "companies/example/logo.webp",
      coverObjectKey: "companies/example/cover.webp",
      logoAlt: "Company logo",
      coverAlt: "Processing plant cover",
      logoFit: "contain",
      coverFocalX: 0.5,
      coverFocalY: 0.5,
    },
  },
  userProfile: {
    preferredLanguage: "en",
    timezone: "Europe/Moscow",
  },
  userUpdate: {
    firstName: "Anna",
    preferredLanguage: "en",
  },
  branches: [
    {
      id: "br_1",
      name: "Main loading point",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Terminal 1",
      defaultIncoterms: "FCA",
      portOrPickupPoint: "Alesund cold terminal",
      notes: "Default collection point for chilled salmon.",
    },
  ],
  products: [
    {
      id: "p_1",
      commercialName: "Atlantic Salmon Fillet",
      latinName: "Salmo salar",
      category: "Salmonids",
      state: "fresh",
      format: "Trim D",
      role: "selling",
      monthlyVolume: "25 t",
      certificates: ["ASC"],
      targetCountries: ["Spain", "France"],
    },
  ],
  metaRegions: [
    {
      id: "mr_1",
      name: "Iberia",
      countries: ["Spain", "Portugal"],
      logisticsReason: "same_sales_market",
      defaultCurrency: "EUR",
      notes: "Shared retail buyers.",
      usedFor: ["notifications", "supplier_matching"],
    },
  ],
  notifications: [
    {
      id: "n_email",
      channel: "email",
      enabled: true,
      events: ["price_access_approved", "rfq_response"],
      frequency: "instant",
    },
  ],
  fileUpload: {
    fileName: "haccp.pdf",
    contentType: "application/pdf",
    sizeBytes: 8,
    contentBase64: "ZG9jdW1lbnQ=",
  },
  fileAsset: {
    purpose: "company_document",
    objectKey: "companies/example/company_document/haccp.pdf",
    contentType: "application/pdf",
    storageDriver: "local",
  },
  documentCreate: {
    title: "HACCP certificate",
    documentType: "haccp",
    visibility: "buyer_qualified",
    expiresAt: null,
    file: {
      fileName: "haccp.pdf",
      contentType: "application/pdf",
      sizeBytes: 8,
      contentBase64: "ZG9jdW1lbnQ=",
    },
  },
  document: {
    documentType: "haccp",
    visibility: "buyer_qualified",
    status: "uploaded",
    fileName: "haccp.pdf",
  },
  accountSession: {
    userId: "00000000-0000-4000-8000-000000000001",
    sessionId: "browser-session_1",
  },
};

export function handleAccountCompanyContract(response: ServerResponse, context: ApiRequestContext) {
  sendJson(response, 200, {
    ok: true,
    contract: {
      name: "account-company",
      version: 1,
      source: "packages/contracts/src/account-company.ts",
      dto: [
        "CompanyProfile",
        "CompanyProfileUpdate",
        "UserProfile",
        "UserProfileUpdate",
        "CompanyBranch",
        "CompanyProduct",
        "MetaRegion",
        "NotificationPreference",
        "AccountFileUploadPayload",
        "AccountFileAsset",
        "CompanyDocument",
        "CompanyDocumentCreate",
        "AccountSessionHeaders",
      ],
      headers: {
        userId: accountUserIdHeaderName,
        sessionId: accountSessionIdHeaderName,
      },
      example: contractExample,
    },
    productionTarget: {
      backend: "self-hosted-yorso-api",
      database: "postgresql",
      cache: "redis",
      objectStorage: "s3-compatible",
      supabase: "prototype-only",
    },
    requestId: context.requestId,
  });
}
