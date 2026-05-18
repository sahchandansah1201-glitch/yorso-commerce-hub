import type { ServerResponse } from "node:http";
import type {
  AccountBranchesUpdate,
  AccountFileAsset,
  AccountFileUploadPayload,
  AccountMetaRegionsUpdate,
  AccountNotificationsUpdate,
  AccountProductsUpdate,
  AccountSessionHeaders,
  AuthSession,
  AuthSignIn,
  CompanyBranchCreate,
  CompanyBranchUpdate,
  CompanyDocument,
  CompanyDocumentCreate,
  CompanyProductCreate,
  CompanyProductUpdate,
  MetaRegionCreate,
  MetaRegionUpdate,
  NotificationPreferenceCreate,
  NotificationPreferenceUpdate,
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
  branchCreate: CompanyBranchCreate;
  branchUpdate: CompanyBranchUpdate;
  products: AccountProductsUpdate;
  productCreate: CompanyProductCreate;
  productUpdate: CompanyProductUpdate;
  metaRegions: AccountMetaRegionsUpdate;
  metaRegionCreate: MetaRegionCreate;
  metaRegionUpdate: MetaRegionUpdate;
  notifications: AccountNotificationsUpdate;
  notificationCreate: NotificationPreferenceCreate;
  notificationUpdate: NotificationPreferenceUpdate;
  fileUpload: AccountFileUploadPayload;
  fileAsset: Pick<AccountFileAsset, "purpose" | "objectKey" | "contentType" | "storageDriver">;
  documentCreate: CompanyDocumentCreate;
  document: Pick<CompanyDocument, "documentType" | "visibility" | "status" | "fileName">;
  accountSession: AccountSessionHeaders;
  authSignIn: AuthSignIn;
  authSession: Pick<AuthSession, "userId" | "email" | "displayName">;
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
  branchCreate: {
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
  branchUpdate: {
    defaultIncoterms: "FOB",
    notes: "Updated commercial basis.",
  },
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
  productCreate: {
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
  productUpdate: {
    monthlyVolume: "40 t",
    targetCountries: ["Spain", "France", "Germany"],
  },
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
  metaRegionCreate: {
    name: "Iberia",
    countries: ["Spain", "Portugal"],
    logisticsReason: "same_sales_market",
    defaultCurrency: "EUR",
    notes: "Shared retail buyers.",
    usedFor: ["notifications", "supplier_matching"],
  },
  metaRegionUpdate: {
    usedFor: ["notifications", "landed_cost"],
  },
  notifications: [
    {
      id: "n_email",
      channel: "email",
      enabled: true,
      events: ["price_access_approved", "rfq_response"],
      frequency: "instant",
    },
  ],
  notificationCreate: {
    channel: "email",
    enabled: true,
    events: ["price_access_approved", "rfq_response"],
    frequency: "instant",
  },
  notificationUpdate: {
    frequency: "daily",
  },
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
  authSignIn: {
    email: "buyer@example.com",
    password: "Password1",
  },
  authSession: {
    userId: "00000000-0000-4000-8000-000000000001",
    email: "buyer@example.com",
    displayName: "Demo Buyer",
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
        "CompanyBranchCreate",
        "CompanyBranchUpdate",
        "CompanyProduct",
        "CompanyProductCreate",
        "CompanyProductUpdate",
        "MetaRegion",
        "MetaRegionCreate",
        "MetaRegionUpdate",
        "NotificationPreference",
        "NotificationPreferenceCreate",
        "NotificationPreferenceUpdate",
        "AccountFileUploadPayload",
        "AccountFileAsset",
        "CompanyDocument",
        "CompanyDocumentCreate",
        "AccountSessionHeaders",
        "AuthSignIn",
        "AuthSession",
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
