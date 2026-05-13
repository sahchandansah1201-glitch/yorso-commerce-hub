import type { ServerResponse } from "node:http";
import type {
  CompanyProfile,
  CompanyProfileUpdate,
  UserProfile,
  UserProfileUpdate,
} from "../../../../packages/contracts/dist/index.js";
import type { ApiRequestContext } from "../http.js";
import { sendJson } from "../http.js";

type ContractExample = {
  companyProfile: Pick<CompanyProfile, "accountRole" | "publicationStatus" | "buyerQualificationStatus">;
  companyUpdate: Pick<CompanyProfileUpdate, "media" | "productFocus">;
  userProfile: Pick<UserProfile, "preferredLanguage" | "timezone">;
  userUpdate: Pick<UserProfileUpdate, "firstName" | "preferredLanguage">;
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
};

export function handleAccountCompanyContract(response: ServerResponse, context: ApiRequestContext) {
  sendJson(response, 200, {
    ok: true,
    contract: {
      name: "account-company",
      version: 1,
      source: "packages/contracts/src/account-company.ts",
      dto: ["CompanyProfile", "CompanyProfileUpdate", "UserProfile", "UserProfileUpdate"],
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
