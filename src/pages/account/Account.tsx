import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { AccountShell, type AccountSectionKey } from "@/components/account/AccountShell";
import { AccountSectionCard } from "@/components/account/AccountSectionCard";
import { Badge } from "@/components/ui/badge";
import { getAccountProfile } from "@/lib/account-store";
import type {
  CompanyBranch,
  CompanyProduct,
  MetaRegion,
  NotificationPreference,
} from "@/data/mockAccount";

const VALID: AccountSectionKey[] = [
  "personal",
  "company",
  "branches",
  "products",
  "meta-regions",
  "notifications",
];

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
  </div>
);

const PersonalSection = () => {
  const { t } = useLanguage();
  const profile = getAccountProfile();
  const u = profile.user;
  return (
    <div className="space-y-4" data-testid="account-section-personal">
      <AccountSectionCard
        title={t.account_personal_basic_title}
        description={t.account_personal_basic_desc}
        testId="account-card-personal-basic"
      >
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t.account_personal_firstName} value={u.firstName} />
          <Field label={t.account_personal_lastName} value={u.lastName} />
          <Field label={t.account_personal_email} value={u.email} />
          <Field label={t.account_personal_phone} value={u.phone} />
          <Field label={t.account_personal_role} value={u.roleInCompany} />
          <Field label={t.account_personal_timezone} value={u.timezone} />
        </dl>
      </AccountSectionCard>
      <AccountSectionCard
        title={t.account_personal_security_title}
        description={t.account_personal_security_desc}
        testId="account-card-personal-security"
      >
        <p className="text-sm text-muted-foreground">{t.account_personal_security_placeholder}</p>
      </AccountSectionCard>
      <AccountSectionCard
        title={t.account_personal_membership_title}
        description={t.account_personal_membership_desc}
        editable={false}
      >
        <p className="text-sm">
          {profile.company.tradeName}{" "}
          <span className="text-muted-foreground">({profile.company.country})</span>
        </p>
      </AccountSectionCard>
    </div>
  );
};

const CompanySection = () => {
  const { t } = useLanguage();
  const profile = getAccountProfile();
  const c = profile.company;
  const pubLabel: Record<typeof c.supplierPublicationStatus, string> = {
    draft: t.account_company_pub_draft,
    ready_for_review: t.account_company_pub_review,
    published: t.account_company_pub_published,
  };
  return (
    <div className="space-y-4" data-testid="account-section-company">
      <AccountSectionCard title={t.account_company_identity_title} testId="account-card-company-identity">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t.account_company_legalName} value={c.legalName} />
          <Field label={t.account_company_tradeName} value={c.tradeName} />
          <Field label={t.account_company_country} value={c.country} />
          <Field label={t.account_company_website} value={c.website} />
          <Field label={t.account_company_yearFounded} value={String(c.yearFounded)} />
          <Field label={t.account_company_role} value={c.accountRole} />
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
      </AccountSectionCard>
      <AccountSectionCard title={t.account_company_trust_title}>
        <div className="flex flex-wrap gap-1.5">
          {c.certificates.map((x) => (
            <Badge key={x} variant="secondary">{x}</Badge>
          ))}
        </div>
      </AccountSectionCard>
      <AccountSectionCard title={t.account_company_payment_title}>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {c.paymentTerms.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </AccountSectionCard>
      <AccountSectionCard
        title={t.account_company_publication_title}
        description={t.account_company_publication_desc}
      >
        <p className="text-sm">
          <span className="text-muted-foreground">{t.account_company_publication_status}: </span>
          <span className="font-medium">{pubLabel[c.supplierPublicationStatus]}</span>
        </p>
      </AccountSectionCard>
    </div>
  );
};

const BranchTypeBadge = ({ type }: { type: CompanyBranch["type"] }) => {
  const { t } = useLanguage();
  const map: Record<CompanyBranch["type"], string> = {
    registered_address: t.account_branch_type_registered,
    office: t.account_branch_type_office,
    warehouse: t.account_branch_type_warehouse,
    processing_plant: t.account_branch_type_plant,
    sales_office: t.account_branch_type_sales,
    loading_point: t.account_branch_type_loading,
  };
  return <Badge variant="outline">{map[type]}</Badge>;
};

const BranchesSection = () => {
  const { t } = useLanguage();
  const profile = getAccountProfile();
  return (
    <div className="space-y-4" data-testid="account-section-branches">
      <AccountSectionCard
        title={t.account_branches_title}
        description={t.account_branches_desc}
        editable={false}
      >
        <p className="text-sm text-muted-foreground" data-testid="account-branches-explainer">
          {t.account_branches_deliveryBasisExplainer}
        </p>
      </AccountSectionCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.branches.map((b) => (
          <AccountSectionCard key={b.id} title={b.name} editable testId={`account-branch-${b.id}`}>
            <div className="space-y-2">
              <BranchTypeBadge type={b.type} />
              <p className="text-sm">
                {b.city}, {b.region}, {b.country}
              </p>
              <p className="text-xs text-muted-foreground">{b.addressLine}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span>
                  <span className="text-muted-foreground">{t.account_branch_incoterms}: </span>
                  <span className="font-medium">{b.defaultIncoterms}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">{t.account_branch_pickup}: </span>
                  <span className="font-medium">{b.portOrPickupPoint}</span>
                </span>
              </div>
              {b.notes ? (
                <p className="text-xs text-muted-foreground italic">{b.notes}</p>
              ) : null}
            </div>
          </AccountSectionCard>
        ))}
      </div>
    </div>
  );
};

const ProductRoleBadge = ({ role }: { role: CompanyProduct["role"] }) => {
  const { t } = useLanguage();
  const label =
    role === "buying"
      ? t.account_product_role_buying
      : role === "selling"
        ? t.account_product_role_selling
        : t.account_product_role_both;
  return (
    <Badge
      variant={role === "selling" ? "default" : role === "buying" ? "secondary" : "outline"}
      data-testid={`product-role-${role}`}
    >
      {label}
    </Badge>
  );
};

const ProductsSection = () => {
  const { t } = useLanguage();
  const profile = getAccountProfile();
  return (
    <div className="space-y-4" data-testid="account-section-products">
      <AccountSectionCard
        title={t.account_products_title}
        description={t.account_products_desc}
        editable={false}
      >
        <p className="text-sm text-muted-foreground">{t.account_products_matchingExplainer}</p>
      </AccountSectionCard>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm" data-testid="account-products-table">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{t.account_product_col_product}</th>
              <th className="px-3 py-2">{t.account_product_col_latin}</th>
              <th className="px-3 py-2">{t.account_product_col_state}</th>
              <th className="px-3 py-2">{t.account_product_col_role}</th>
              <th className="px-3 py-2">{t.account_product_col_volume}</th>
              <th className="px-3 py-2">{t.account_product_col_certs}</th>
              <th className="px-3 py-2">{t.account_product_col_targets}</th>
            </tr>
          </thead>
          <tbody>
            {profile.products.map((p: CompanyProduct) => (
              <tr key={p.id} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{p.commercialName}</div>
                  <div className="text-xs text-muted-foreground">{p.format}</div>
                </td>
                <td className="px-3 py-2 italic text-muted-foreground">{p.latinName}</td>
                <td className="px-3 py-2 capitalize">{p.state}</td>
                <td className="px-3 py-2"><ProductRoleBadge role={p.role} /></td>
                <td className="px-3 py-2">{p.monthlyVolume}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {p.certificates.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {p.targetCountries.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MetaRegionsSection = () => {
  const { t } = useLanguage();
  const profile = getAccountProfile();
  const reasonLabel: Record<MetaRegion["logisticsReason"], string> = {
    similar_freight_cost: t.account_metaRegion_reason_freight,
    same_customs_zone: t.account_metaRegion_reason_customs,
    same_sales_market: t.account_metaRegion_reason_sales,
    same_warehouse_route: t.account_metaRegion_reason_warehouse,
    manual: t.account_metaRegion_reason_manual,
  };
  const usedForLabel: Record<MetaRegion["usedFor"][number], string> = {
    notifications: t.account_metaRegion_use_notifications,
    price_access: t.account_metaRegion_use_priceAccess,
    campaigns: t.account_metaRegion_use_campaigns,
    landed_cost: t.account_metaRegion_use_landedCost,
    supplier_matching: t.account_metaRegion_use_matching,
  };
  return (
    <div className="space-y-4" data-testid="account-section-meta-regions">
      <AccountSectionCard
        title={t.account_metaRegions_title}
        description={t.account_metaRegions_desc}
        editable={false}
      >
        <p className="text-sm text-muted-foreground">{t.account_metaRegions_explainer}</p>
      </AccountSectionCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.metaRegions.map((m) => (
          <AccountSectionCard key={m.id} title={m.name} testId={`account-meta-${m.id}`}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {m.countries.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>
                ))}
              </div>
              <p className="text-xs">
                <span className="text-muted-foreground">{t.account_metaRegion_reason}: </span>
                <span className="font-medium">{reasonLabel[m.logisticsReason]}</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {m.usedFor.map((u) => (
                  <Badge key={u} variant="outline" className="text-[10px]">
                    {usedForLabel[u]}
                  </Badge>
                ))}
              </div>
              {m.notes ? <p className="text-xs text-muted-foreground italic">{m.notes}</p> : null}
            </div>
          </AccountSectionCard>
        ))}
      </div>
    </div>
  );
};

const NotificationsSection = () => {
  const { t } = useLanguage();
  const profile = getAccountProfile();
  const channelLabel: Record<NotificationPreference["channel"], string> = {
    email: t.account_notif_channel_email,
    messenger: t.account_notif_channel_messenger,
    in_app: t.account_notif_channel_inApp,
    agent: t.account_notif_channel_agent,
  };
  const eventLabel = (e: NotificationPreference["events"][number]): string => {
    const map: Record<typeof e, string> = {
      price_access_approved: t.account_notif_event_priceAccessApproved,
      new_matching_product: t.account_notif_event_newMatching,
      rfq_response: t.account_notif_event_rfqResponse,
      price_movement: t.account_notif_event_priceMovement,
      document_readiness: t.account_notif_event_documentReadiness,
      country_news: t.account_notif_event_countryNews,
      supplier_profile_review: t.account_notif_event_supplierReview,
    };
    return map[e];
  };
  const freqLabel: Record<NotificationPreference["frequency"], string> = {
    instant: t.account_notif_freq_instant,
    daily: t.account_notif_freq_daily,
    weekly: t.account_notif_freq_weekly,
  };
  return (
    <div className="space-y-4" data-testid="account-section-notifications">
      <AccountSectionCard
        title={t.account_notifications_title}
        description={t.account_notifications_desc}
        editable={false}
      >
        <p className="text-sm text-muted-foreground">{t.account_notifications_disclaimer}</p>
      </AccountSectionCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.notifications.map((n) => (
          <AccountSectionCard
            key={n.id}
            title={channelLabel[n.channel]}
            testId={`account-notif-${n.channel}`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={n.enabled ? "default" : "outline"}>
                  {n.enabled ? t.account_notif_enabled : t.account_notif_disabled}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t.account_notif_freqLabel}: {freqLabel[n.frequency]}
                </span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t.account_notif_eventsLabel}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs">
                  {n.events.map((e) => (
                    <li key={e}>• {eventLabel(e)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AccountSectionCard>
        ))}
      </div>
    </div>
  );
};

const SECTION_RENDERERS: Record<AccountSectionKey, () => JSX.Element> = {
  personal: PersonalSection,
  company: CompanySection,
  branches: BranchesSection,
  products: ProductsSection,
  "meta-regions": MetaRegionsSection,
  notifications: NotificationsSection,
};

const Account = () => {
  const { section } = useParams<{ section?: string }>();
  const active = useMemo<AccountSectionKey | null>(() => {
    if (!section) return null;
    return (VALID as string[]).includes(section) ? (section as AccountSectionKey) : null;
  }, [section]);

  if (!active) return <Navigate to="/account/personal" replace />;

  const Renderer = SECTION_RENDERERS[active];
  return (
    <AccountShell active={active}>
      <Renderer />
    </AccountShell>
  );
};

export default Account;
