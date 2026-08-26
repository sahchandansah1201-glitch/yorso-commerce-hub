import type { BuyerSession } from "@/lib/buyer-session";
import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";

export type CrmAccessErrorCode =
  | "crm_access_denied"
  | "crm_invalid_response"
  | "crm_session_required"
  | "crm_unavailable";

export class CrmAccessError extends Error {
  constructor(public readonly code: CrmAccessErrorCode) {
    super(code);
    this.name = "CrmAccessError";
  }
}

export interface CrmAccessResponse {
  crmUrl: string;
  requestId: string;
}

interface CrmApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session: BuyerSession | null;
}

interface CrmAccessRequestOptions {
  refresh?: boolean;
}

const parseCrmUrl = (value: unknown) => {
  if (typeof value !== "string") throw new CrmAccessError("crm_invalid_response");
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new CrmAccessError("crm_invalid_response");
    }
    return url.toString();
  } catch (error) {
    if (error instanceof CrmAccessError) throw error;
    throw new CrmAccessError("crm_invalid_response");
  }
};

export const createCrmApiClient = ({
  baseUrl = getConfiguredAccountApiBaseUrl(),
  fetchImpl = fetch,
  session,
}: CrmApiClientOptions) => ({
  async getFullUiAccess({ refresh = false }: CrmAccessRequestOptions = {}): Promise<CrmAccessResponse> {
    if (!baseUrl || !session?.id || !session.userId) {
      throw new CrmAccessError("crm_session_required");
    }

    const response = await fetchImpl(`${baseUrl}/v1/crm/full-ui`, {
      headers: {
        [ACCOUNT_SESSION_ID_HEADER]: session.id,
        [ACCOUNT_USER_ID_HEADER]: session.userId,
        ...(refresh ? { "cache-control": "no-cache" } : {}),
      },
    });
    const body = await response.json().catch(() => null) as {
      crmUrl?: unknown;
      error?: { code?: string };
      requestId?: unknown;
    } | null;

    if (!response.ok) {
      if (body?.error?.code === "crm_access_denied") throw new CrmAccessError("crm_access_denied");
      if (body?.error?.code === "crm_unavailable") throw new CrmAccessError("crm_unavailable");
      if (response.status === 401) throw new CrmAccessError("crm_session_required");
      throw new CrmAccessError("crm_unavailable");
    }
    if (typeof body?.requestId !== "string") throw new CrmAccessError("crm_invalid_response");

    return {
      crmUrl: parseCrmUrl(body.crmUrl),
      requestId: body.requestId,
    };
  },
});
