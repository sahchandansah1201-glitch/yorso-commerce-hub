/**
 * Frontend-only account store. localStorage persistence.
 *
 * Никаких credentials/токенов/паролей здесь не хранится. Это прототип
 * Company Operating Profile для будущей backend-интеграции.
 */
import {
  mockAccountProfile,
  type AccountCompletionItem,
  type AccountProfile,
} from "@/data/mockAccount";

const STORAGE_KEY = "yorso_account_profile_v1";

const safeRead = (): AccountProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccountProfile;
    if (!parsed || typeof parsed !== "object" || !parsed.user || !parsed.company) return null;
    return parsed;
  } catch {
    return null;
  }
};

const safeWrite = (profile: AccountProfile | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* swallow */
  }
};

export const getAccountProfile = (): AccountProfile => {
  return safeRead() ?? mockAccountProfile;
};

export const saveAccountProfile = (profile: AccountProfile): void => {
  safeWrite(profile);
};

export const resetAccountProfile = (): void => {
  safeWrite(null);
};

export const calculateAccountCompletion = (
  profile: AccountProfile,
): { items: AccountCompletionItem[]; percent: number } => {
  const u = profile.user;
  const c = profile.company;

  const items: AccountCompletionItem[] = [
    {
      id: "u_basic",
      group: "user_profile",
      labelKey: "account_completion_user_basic",
      done: !!u.firstName && !!u.lastName && !!u.email,
    },
    {
      id: "u_phone",
      group: "user_profile",
      labelKey: "account_completion_user_phone",
      done: !!u.phone,
    },
    {
      id: "c_identity",
      group: "company_profile",
      labelKey: "account_completion_company_identity",
      done: !!c.legalName && !!c.country && !!c.tradeName,
    },
    {
      id: "c_contacts",
      group: "company_profile",
      labelKey: "account_completion_company_contacts",
      done: !!c.contactEmail && !!c.contactPhone,
    },
    {
      id: "c_description",
      group: "company_profile",
      labelKey: "account_completion_company_description",
      done: (c.description ?? "").trim().length >= 40,
    },
    {
      id: "s_branches",
      group: "supplier_readiness",
      labelKey: "account_completion_supplier_branches",
      done: profile.branches.length >= 1,
    },
    {
      id: "s_certificates",
      group: "supplier_readiness",
      labelKey: "account_completion_supplier_certificates",
      done: c.certificates.length >= 1,
    },
    {
      id: "s_publication",
      group: "supplier_readiness",
      labelKey: "account_completion_supplier_publication",
      done:
        c.supplierPublicationStatus === "ready_for_review" ||
        c.supplierPublicationStatus === "published",
    },
    {
      id: "b_products",
      group: "buyer_matching",
      labelKey: "account_completion_buyer_products",
      done: profile.products.some((p) => p.role === "buying" || p.role === "both"),
    },
    {
      id: "b_meta_regions",
      group: "buyer_matching",
      labelKey: "account_completion_buyer_meta_regions",
      done: profile.metaRegions.length >= 1,
    },
    {
      id: "n_any",
      group: "notifications",
      labelKey: "account_completion_notifications_any",
      done: profile.notifications.some((n) => n.enabled),
    },
  ];

  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return { items, percent };
};

export const ACCOUNT_STORAGE_KEY = STORAGE_KEY;
