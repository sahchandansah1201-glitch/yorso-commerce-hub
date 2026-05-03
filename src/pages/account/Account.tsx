import { cloneElement, useId, useMemo, useState, type ReactNode } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { AccountShell, type AccountSectionKey } from "@/components/account/AccountShell";
import { AccountSectionCard } from "@/components/account/AccountSectionCard";
import { EditableCard } from "@/components/account/EditableCard";
import { CompanyMediaCard } from "@/components/account/CompanyMediaCard";
import { SupplierProfilePreview } from "@/components/account/SupplierProfilePreview";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { getAccountProfile, saveAccountProfile } from "@/lib/account-store";
import {
  validateEmail,
  validateLanguage,
  validateName,
  validatePhone,
  validateText,
  validateUrl,
  validateYear,
} from "@/lib/account-validation";
import type {
  AccountProfile,
  CompanyBranch,
  CompanyProduct,
  CompanyProfile,
  MetaRegion,
  NotificationPreference,
  ProductState,
  UserProfile,
} from "@/data/mockAccount";

const VALID: AccountSectionKey[] = [
  "personal",
  "company",
  "branches",
  "products",
  "meta-regions",
  "notifications",
];

const fallback = (v: string | undefined, nf: string) => (v && v.trim() ? v : nf);

const Field = ({ label, value }: { label: string; value: string }) => {
  const { t } = useLanguage();
  const isEmpty = !value || !value.trim();
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          isEmpty
            ? "mt-1 truncate text-[15px] italic text-muted-foreground"
            : "mt-1 truncate text-[15px] font-medium text-foreground"
        }
        title={isEmpty ? undefined : value}
      >
        {fallback(value, t.account_value_notSpecified)}
      </dd>
    </div>
  );
};

const FormRow = ({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactElement;
}) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  // Inject id + aria attributes into the single child input/select/textarea
  const enhancedChild = (() => {
    try {
      const childProps = (children.props ?? {}) as Record<string, unknown>;
      return cloneElement(children, {
        id: (childProps.id as string | undefined) ?? id,
        "aria-invalid": !!error || undefined,
        "aria-describedby":
          [
            (childProps["aria-describedby"] as string | undefined) ?? "",
            describedBy ?? "",
          ]
            .filter(Boolean)
            .join(" ") || undefined,
        className:
          [
            (childProps.className as string | undefined) ?? "",
            error ? "border-destructive focus-visible:ring-destructive" : "",
          ]
            .filter(Boolean)
            .join(" ")
            .trim() || undefined,
      } as Record<string, unknown>);
    } catch {
      return children;
    }
  })();
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}{" "}
        {required ? (
          <span aria-hidden className="text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {enhancedChild}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

const splitList = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

// ─── PERSONAL ──────────────────────────────────────────────────────

const PersonalSection = ({
  profile,
  onChange,
}: {
  profile: AccountProfile;
  onChange: (p: AccountProfile) => void;
}) => {
  const { t } = useLanguage();
  const u = profile.user;

  const anchors = [
    { id: "personal-basic", label: t.account_personal_basic_title },
    { id: "personal-security", label: t.account_personal_security_title },
    { id: "personal-membership", label: t.account_personal_membership_title },
  ];

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-primary/50");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-primary/50"), 1200);
    el.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-4" data-testid="account-section-personal">
      <nav
        aria-label={t.account_personal_jump_aria}
        className="sticky top-2 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/95 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85"
        data-testid="account-personal-jumpbar"
      >
        <span
          id="account-personal-jump-label"
          className="pl-1 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t.account_personal_jump_label}
        </span>
        {anchors.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => jumpTo(a.id)}
            className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-describedby="account-personal-jump-label"
            data-testid={`account-personal-jump-${a.id}`}
          >
            {a.label}
          </button>
        ))}
      </nav>
      <section
        id="personal-basic"
        tabIndex={-1}
        aria-label={t.account_personal_basic_title}
        className="scroll-mt-24 rounded-lg outline-none transition-shadow"
      >
      <EditableCard<UserProfile>
        title={t.account_personal_basic_title}
        description={t.account_personal_basic_desc}
        testId="account-card-personal-basic"
        initial={u}
        validate={(d) => {
          const e: Record<string, string> = {};
          const fn = validateName(d.firstName, t);
          if (fn) e.firstName = fn;
          const ln = validateName(d.lastName, t);
          if (ln) e.lastName = ln;
          const em = validateEmail(d.email, t);
          if (em) e.email = em;
          const ph = validatePhone(d.phone, t, false);
          if (ph) e.phone = ph;
          const role = validateName(d.roleInCompany, t, false);
          if (role) e.roleInCompany = role;
          const lang = validateLanguage(d.language, t);
          if (lang) e.language = lang;
          return e;
        }}
        onSave={(d) => onChange({ ...profile, user: d })}
        renderView={(v) => {
          const langLabel =
            v.language === "ru" ? "Русский" : v.language === "es" ? "Español" : "English";
          return (
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label={t.account_personal_firstName} value={v.firstName} />
                <Field label={t.account_personal_lastName} value={v.lastName} />
                <Field label={t.account_personal_role} value={v.roleInCompany} />
              </dl>
              <div className="border-t border-border/60" />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label={t.account_personal_email} value={v.email} />
                <Field label={t.account_personal_phone} value={v.phone} />
              </dl>
              <div className="border-t border-border/60" />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label={t.account_personal_timezone} value={v.timezone} />
                <Field label={t.account_personal_language} value={langLabel} />
              </dl>
            </div>
          );
        }}
        renderEdit={({ draft, setDraft, errors }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormRow label={t.account_personal_firstName} required error={errors.firstName}>
              <Input
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                data-testid="account-input-firstName"
              />
            </FormRow>
            <FormRow label={t.account_personal_lastName} required error={errors.lastName}>
              <Input
                value={draft.lastName}
                onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              />
            </FormRow>
            <FormRow
              label={t.account_personal_email}
              required
              error={errors.email}
              hint={t.account_hint_email}
            >
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </FormRow>
            <FormRow
              label={t.account_personal_phone}
              error={errors.phone}
              hint={t.account_hint_phone}
            >
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={32}
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_personal_role} error={errors.roleInCompany}>
              <Input
                maxLength={100}
                value={draft.roleInCompany}
                onChange={(e) => setDraft({ ...draft, roleInCompany: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_personal_timezone}>
              <Input
                value={draft.timezone}
                onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_personal_language} error={errors.language}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.language}
                onChange={(e) =>
                  setDraft({ ...draft, language: e.target.value as UserProfile["language"] })
                }
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
              </select>
            </FormRow>
          </div>
        )}
      />
      </section>
      <section
        id="personal-security"
        tabIndex={-1}
        aria-label={t.account_personal_security_title}
        className="scroll-mt-24 rounded-lg outline-none transition-shadow"
      >
      <AccountSectionCard
        title={t.account_personal_security_title}
        description={t.account_personal_security_desc}
        testId="account-card-personal-security"
      >
        <p className="text-sm text-muted-foreground">{t.account_personal_security_placeholder}</p>
      </AccountSectionCard>
      </section>
      <section
        id="personal-membership"
        tabIndex={-1}
        aria-label={t.account_personal_membership_title}
        className="scroll-mt-24 rounded-lg outline-none transition-shadow"
      >
      <AccountSectionCard
        title={t.account_personal_membership_title}
        description={t.account_personal_membership_desc}
        testId="account-card-personal-membership"
      >
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary"
          >
            {profile.company.tradeName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {profile.company.tradeName}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-normal">
                {profile.company.country}
              </Badge>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {accountRoleLabel(profile.company.accountRole, t)}
              </span>
            </div>
          </div>
        </div>
      </AccountSectionCard>
      </section>
    </div>
  );
};

// ─── COMPANY ───────────────────────────────────────────────────────

const accountRoleLabel = (
  role: CompanyProfile["accountRole"],
  t: ReturnType<typeof useLanguage>["t"],
) =>
  role === "buyer"
    ? t.account_company_role_buyer
    : role === "supplier"
      ? t.account_company_role_supplier
      : t.account_company_role_both;

const pubLabelMap = (t: ReturnType<typeof useLanguage>["t"]) => ({
  draft: t.account_company_pub_draft,
  ready_for_review: t.account_company_pub_review,
  published: t.account_company_pub_published,
});

const qualLabelMap = (t: ReturnType<typeof useLanguage>["t"]) => ({
  incomplete: t.account_company_qual_incomplete,
  ready: t.account_company_qual_ready,
  qualified: t.account_company_qual_qualified,
});

const CompanySection = ({
  profile,
  onChange,
}: {
  profile: AccountProfile;
  onChange: (p: AccountProfile) => void;
}) => {
  const { t } = useLanguage();
  const c = profile.company;
  const pub = pubLabelMap(t);
  const qual = qualLabelMap(t);

  const saveCompany = (next: CompanyProfile) => onChange({ ...profile, company: next });

  return (
    <div className="space-y-4" data-testid="account-section-company">
      <CompanyMediaCard company={c} onSave={saveCompany} />

      <EditableCard<CompanyProfile>
        title={t.account_company_identity_title}
        testId="account-card-company-identity"
        initial={c}
        validate={(d) => {
          const e: Record<string, string> = {};
          const legal = validateName(d.legalName, t);
          if (legal) e.legalName = legal;
          const trade = validateName(d.tradeName, t);
          if (trade) e.tradeName = trade;
          const country = validateName(d.country, t);
          if (country) e.country = country;
          const ws = validateUrl(d.website, t);
          if (ws) e.website = ws;
          const yr = validateYear(d.yearFounded, t);
          if (yr) e.yearFounded = yr;
          return e;
        }}
        onSave={saveCompany}
        renderView={(v) => (
          <>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.account_company_legalName} value={v.legalName} />
              <Field label={t.account_company_tradeName} value={v.tradeName} />
              <Field label={t.account_company_country} value={v.country} />
              <Field label={t.account_company_website} value={v.website} />
              <Field
                label={t.account_company_yearFounded}
                value={v.yearFounded ? String(v.yearFounded) : ""}
              />
              <Field label={t.account_company_role} value={accountRoleLabel(v.accountRole, t)} />
            </dl>
          </>
        )}
        renderEdit={({ draft, setDraft, errors }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormRow label={t.account_company_legalName} required error={errors.legalName}>
              <Input
                value={draft.legalName}
                onChange={(e) => setDraft({ ...draft, legalName: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_company_tradeName} required error={errors.tradeName}>
              <Input
                value={draft.tradeName}
                onChange={(e) => setDraft({ ...draft, tradeName: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_company_country} required error={errors.country}>
              <Input
                value={draft.country}
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_company_website} error={errors.website}>
              <Input
                value={draft.website}
                onChange={(e) => setDraft({ ...draft, website: e.target.value })}
              />
            </FormRow>
            <FormRow label={t.account_company_yearFounded} error={errors.yearFounded}>
              <Input
                type="number"
                value={draft.yearFounded || ""}
                onChange={(e) =>
                  setDraft({ ...draft, yearFounded: Number(e.target.value) || 0 })
                }
              />
            </FormRow>
            <FormRow label={t.account_company_role}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.accountRole}
                onChange={(e) =>
                  setDraft({ ...draft, accountRole: e.target.value as CompanyProfile["accountRole"] })
                }
                data-testid="account-input-accountRole"
              >
                <option value="buyer">{t.account_company_role_buyer}</option>
                <option value="supplier">{t.account_company_role_supplier}</option>
                <option value="both">{t.account_company_role_both}</option>
              </select>
            </FormRow>
          </div>
        )}
      />

      <EditableCard<CompanyProfile>
        title={t.account_company_contacts_title}
        testId="account-card-company-contacts"
        initial={c}
        validate={(d) => {
          const e: Record<string, string> = {};
          const em = validateEmail(d.contactEmail, t);
          if (em) e.contactEmail = em;
          const ph = validatePhone(d.contactPhone, t, true);
          if (ph) e.contactPhone = ph;
          const wa = validatePhone(d.whatsapp, t, false);
          if (wa) e.whatsapp = wa;
          return e;
        }}
        onSave={saveCompany}
        renderView={(v) => (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.account_company_contactEmail} value={v.contactEmail} />
            <Field label={t.account_company_contactPhone} value={v.contactPhone} />
            <Field label={t.account_company_whatsapp} value={v.whatsapp} />
          </dl>
        )}
        renderEdit={({ draft, setDraft, errors }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormRow
              label={t.account_company_contactEmail}
              required
              error={errors.contactEmail}
              hint={t.account_hint_email}
            >
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                value={draft.contactEmail}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
              />
            </FormRow>
            <FormRow
              label={t.account_company_contactPhone}
              required
              error={errors.contactPhone}
              hint={t.account_hint_phone}
            >
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={32}
                value={draft.contactPhone}
                onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
              />
            </FormRow>
            <FormRow
              label={t.account_company_whatsapp}
              error={errors.whatsapp}
              hint={t.account_hint_whatsapp}
            >
              <Input
                type="tel"
                inputMode="tel"
                maxLength={32}
                value={draft.whatsapp}
                onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
              />
            </FormRow>
          </div>
        )}
      />

      <EditableCard<CompanyProfile>
        title={t.account_company_description_title}
        testId="account-card-company-description"
        initial={c}
        onSave={saveCompany}
        renderView={(v) => (
          <p className="text-sm text-muted-foreground">
            {fallback(v.description, t.account_value_notSpecified)}
          </p>
        )}
        renderEdit={({ draft, setDraft }) => (
          <FormRow label={t.account_company_description_label}>
            <Textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </FormRow>
        )}
      />

      <EditableCard<CompanyProfile>
        title={t.account_company_trust_title}
        testId="account-card-company-trust"
        initial={c}
        onSave={saveCompany}
        renderView={(v) => (
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {t.account_company_productFocus}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {v.productFocus.length === 0 ? (
                  <span className="text-sm text-muted-foreground">{t.account_value_notSpecified}</span>
                ) : (
                  v.productFocus.map((x) => (
                    <Badge key={x} variant="outline">
                      {x}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {t.account_company_certificates}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {v.certificates.length === 0 ? (
                  <span className="text-sm text-muted-foreground">{t.account_value_notSpecified}</span>
                ) : (
                  v.certificates.map((x) => (
                    <Badge key={x} variant="secondary">
                      {x}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        renderEdit={({ draft, setDraft }) => (
          <div className="space-y-3">
            <FormRow label={t.account_company_productFocus}>
              <Input
                value={draft.productFocus.join(", ")}
                onChange={(e) => setDraft({ ...draft, productFocus: splitList(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t.account_company_listHelp}</p>
            </FormRow>
            <FormRow label={t.account_company_certificates}>
              <Input
                value={draft.certificates.join(", ")}
                onChange={(e) => setDraft({ ...draft, certificates: splitList(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t.account_company_listHelp}</p>
            </FormRow>
          </div>
        )}
      />

      <EditableCard<CompanyProfile>
        title={t.account_company_payment_title}
        testId="account-card-company-payment"
        initial={c}
        onSave={saveCompany}
        renderView={(v) => (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {v.paymentTerms.length === 0 ? (
              <li className="list-none text-muted-foreground">{t.account_value_notSpecified}</li>
            ) : (
              v.paymentTerms.map((x) => <li key={x}>{x}</li>)
            )}
          </ul>
        )}
        renderEdit={({ draft, setDraft }) => (
          <FormRow label={t.account_company_paymentTerms}>
            <Input
              value={draft.paymentTerms.join(", ")}
              onChange={(e) => setDraft({ ...draft, paymentTerms: splitList(e.target.value) })}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t.account_company_listHelp}</p>
          </FormRow>
        )}
      />

      <EditableCard<CompanyProfile>
        title={t.account_company_publication_title}
        description={t.account_company_publication_desc}
        testId="account-card-company-publication"
        initial={c}
        onSave={saveCompany}
        renderView={(v) => (
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">{t.account_company_publication_status}: </span>
              <span className="font-medium">{pub[v.supplierPublicationStatus]}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t.account_company_qualification_status}: </span>
              <span className="font-medium">{qual[v.buyerQualificationStatus]}</span>
            </p>
          </div>
        )}
        renderEdit={({ draft, setDraft }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormRow label={t.account_company_publication_status}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.supplierPublicationStatus}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    supplierPublicationStatus: e.target
                      .value as CompanyProfile["supplierPublicationStatus"],
                  })
                }
              >
                <option value="draft">{t.account_company_pub_draft}</option>
                <option value="ready_for_review">{t.account_company_pub_review}</option>
                <option value="published">{t.account_company_pub_published}</option>
              </select>
            </FormRow>
            <FormRow label={t.account_company_qualification_status}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.buyerQualificationStatus}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    buyerQualificationStatus: e.target
                      .value as CompanyProfile["buyerQualificationStatus"],
                  })
                }
              >
                <option value="incomplete">{t.account_company_qual_incomplete}</option>
                <option value="ready">{t.account_company_qual_ready}</option>
                <option value="qualified">{t.account_company_qual_qualified}</option>
              </select>
            </FormRow>
          </div>
        )}
      />

      <SupplierProfilePreview company={c} />
    </div>
  );
};

// ─── BRANCHES (read-only as before) ────────────────────────────────

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

const BranchesSection = ({ profile }: { profile: AccountProfile }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4" data-testid="account-section-branches">
      <AccountSectionCard
        title={t.account_branches_title}
        description={t.account_branches_desc}
      >
        <p className="text-sm text-muted-foreground" data-testid="account-branches-explainer">
          {t.account_branches_deliveryBasisExplainer}
        </p>
      </AccountSectionCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.branches.map((b) => (
          <AccountSectionCard key={b.id} title={b.name} testId={`account-branch-${b.id}`}>
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

// ─── PRODUCTS ──────────────────────────────────────────────────────

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

const productStateLabel = (s: ProductState, t: ReturnType<typeof useLanguage>["t"]) =>
  ({
    frozen: t.account_product_state_frozen,
    fresh: t.account_product_state_fresh,
    chilled: t.account_product_state_chilled,
    alive: t.account_product_state_alive,
    cooked: t.account_product_state_cooked,
  }[s]);

const ProductsSection = ({ profile }: { profile: AccountProfile }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4" data-testid="account-section-products">
      <AccountSectionCard
        title={t.account_products_title}
        description={t.account_products_desc}
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
                <td className="px-3 py-2">{productStateLabel(p.state, t)}</td>
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

// ─── META REGIONS ──────────────────────────────────────────────────

const MetaRegionsSection = ({ profile }: { profile: AccountProfile }) => {
  const { t } = useLanguage();
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

// ─── NOTIFICATIONS ─────────────────────────────────────────────────

const NotificationsSection = ({ profile }: { profile: AccountProfile }) => {
  const { t } = useLanguage();
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

// ─── ROUTER ────────────────────────────────────────────────────────

const Account = () => {
  const { section } = useParams<{ section?: string }>();
  const active = useMemo<AccountSectionKey | null>(() => {
    if (!section) return null;
    return (VALID as string[]).includes(section) ? (section as AccountSectionKey) : null;
  }, [section]);

  const [profile, setProfile] = useState<AccountProfile>(() => getAccountProfile());

  const update = (next: AccountProfile) => {
    setProfile(next);
    saveAccountProfile(next);
  };

  if (!active) return <Navigate to="/account/personal" replace />;

  let content: JSX.Element;
  switch (active) {
    case "personal":
      content = <PersonalSection profile={profile} onChange={update} />;
      break;
    case "company":
      content = <CompanySection profile={profile} onChange={update} />;
      break;
    case "branches":
      content = <BranchesSection profile={profile} />;
      break;
    case "products":
      content = <ProductsSection profile={profile} />;
      break;
    case "meta-regions":
      content = <MetaRegionsSection profile={profile} />;
      break;
    case "notifications":
      content = <NotificationsSection profile={profile} />;
      break;
  }

  return (
    <AccountShell active={active} profile={profile}>
      {content}
    </AccountShell>
  );
};

export default Account;
