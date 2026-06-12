import { cloneElement, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, Navigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/landing/Header";
import { AccountShell, type AccountSectionKey } from "@/components/account/AccountShell";
import { AccountSectionCard } from "@/components/account/AccountSectionCard";
import { EditableCard } from "@/components/account/EditableCard";
import { AccountProductCatalogPicker } from "@/components/account/AccountProductCatalogPicker";
import { CompanyMediaCard, type CompanyMediaDraft } from "@/components/account/CompanyMediaCard";
import { CompanyDocumentsCard } from "@/components/account/CompanyDocumentsCard";
import { SupplierProfilePreview } from "@/components/account/SupplierProfilePreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getAccountProfile, saveAccountProfile } from "@/lib/account-store";
import {
  createAccountApiClient,
  fileToAccountUploadPayload,
  hydrateAccountProfileFromApi,
  isAccountApiConflictError,
  syncAccountProfileSectionToApi,
  syncAccountProfileToApi,
  type AccountProfileSectionSyncTarget,
} from "@/lib/account-api";
import {
  isAuthRuntimeError,
  isSelfHostedAuthConfigured,
  readCurrentAuthSession,
  type AuthRuntimeSession,
} from "@/lib/auth-runtime";
import { buyerSession } from "@/lib/buyer-session";
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

interface AccountUpdateOptions {
  section?: AccountProfileSectionSyncTarget;
  syncRemote?: boolean;
}

type AccountUpdateResult = void | Promise<void>;
type AccountSourceMode = "local" | "self_hosted";
type AccountBootStatus = "loading" | "ready" | "auth_required" | "unavailable";
type AccountApiClient = ReturnType<typeof createAccountApiClient>;

const fallback = (v: string | undefined, nf: string) => (v && v.trim() ? v : nf);

const accountSaveErrorMessage = (
  error: unknown,
  t: ReturnType<typeof useLanguage>["t"],
) => (error instanceof Error && error.message.trim() ? error.message : t.account_remoteSaveFailed);

const Field = ({ label, value, badge }: { label: string; value: string; badge?: ReactNode }) => {
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
            ? "mt-1 flex items-center text-[15px] italic text-muted-foreground"
            : "mt-1 flex items-center text-[15px] font-medium text-foreground"
        }
        title={isEmpty ? undefined : value}
      >
        <span className="truncate">{fallback(value, t.account_value_notSpecified)}</span>
        {badge}
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

const FOCUSABLE_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const GroupHeading = ({
  children,
  onActivate,
  onArrow,
  groupId,
}: {
  children: ReactNode;
  onActivate?: () => void;
  onArrow?: (dir: "next" | "prev") => void;
  groupId?: string;
}) => (
  <h4
    id={groupId}
    role="button"
    tabIndex={0}
    onClick={onActivate}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        onActivate?.();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        onArrow?.("next");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        onArrow?.("prev");
      }
    }}
    className="cursor-pointer rounded text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    aria-label={typeof children === "string" ? `${children} — Enter переходит к первому полю, стрелки переключают группы` : undefined}
  >
    {children}
  </h4>
);

const FieldGroup = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const focusFirstField = () => {
    const el = groupRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    el?.focus();
  };

  const moveToSiblingGroup = (dir: "next" | "prev") => {
    const root = groupRef.current?.closest<HTMLElement>("[data-field-group-root]");
    if (!root) return;
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>("[data-group-heading]"),
    );
    const current = groupRef.current?.querySelector<HTMLElement>("[data-group-heading]");
    const idx = current ? headings.indexOf(current) : -1;
    if (idx === -1) return;
    const nextIdx = dir === "next" ? idx + 1 : idx - 1;
    headings[(nextIdx + headings.length) % headings.length]?.focus();
  };

  const onContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't hijack typing keys inside text inputs
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (target.tagName === "TEXTAREA") return;
    if (target.tagName === "SELECT") return; // native select uses arrows
    if (
      target.tagName === "INPUT" &&
      !["checkbox", "radio", "button", "submit"].includes(
        (target as HTMLInputElement).type,
      )
    ) {
      // Allow arrow nav for text inputs only with Alt modifier to avoid conflict with caret
      if (!e.altKey) return;
    }
    const fields = Array.from(
      groupRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    ).filter((el) => !el.hasAttribute("data-group-heading"));
    if (fields.length === 0) return;
    const idx = fields.indexOf(target);
    if (idx === -1) return;
    e.preventDefault();
    const nextIdx = e.key === "ArrowDown" ? idx + 1 : idx - 1;
    fields[(nextIdx + fields.length) % fields.length]?.focus();
  };

  return (
    <div ref={groupRef} className="space-y-3" onKeyDown={onContainerKeyDown}>
      <div data-group-heading>
        <GroupHeading
          groupId={headingId}
          onActivate={focusFirstField}
          onArrow={moveToSiblingGroup}
        >
          {title}
        </GroupHeading>
      </div>
      <div role="group" aria-labelledby={headingId}>
        {children}
      </div>
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
  onChange: (p: AccountProfile) => AccountUpdateResult;
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
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
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
            <div className="space-y-6" data-field-group-root>
              <FieldGroup title={t.account_group_identity}>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Field label={t.account_personal_firstName} value={v.firstName} />
                  <Field label={t.account_personal_lastName} value={v.lastName} />
                  <Field label={t.account_personal_role} value={v.roleInCompany} />
                </dl>
              </FieldGroup>
              <FieldGroup title={t.account_group_contacts}>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Field label={t.account_personal_email} value={v.email} />
                  <Field
                    label={t.account_personal_phone}
                    value={v.phone}
                    badge={
                      v.phone && v.phoneVerified ? (
                        <span
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                          aria-label={t.account_personal_phone_verified_aria}
                          data-testid="account-personal-phone-verified-badge"
                        >
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          {t.account_personal_phone_verified}
                        </span>
                      ) : null
                    }
                  />
                </dl>
              </FieldGroup>
              <FieldGroup title={t.account_group_locale}>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Field label={t.account_personal_timezone} value={v.timezone} />
                  <Field label={t.account_personal_language} value={langLabel} />
                </dl>
              </FieldGroup>
            </div>
          );
        }}
        renderEdit={({ draft, setDraft, errors }) => (
          <div className="space-y-6" data-field-group-root>
            <FieldGroup title={t.account_group_identity}>
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
                <FormRow label={t.account_personal_role} error={errors.roleInCompany}>
                  <Input
                    maxLength={100}
                    value={draft.roleInCompany}
                    onChange={(e) => setDraft({ ...draft, roleInCompany: e.target.value })}
                  />
                </FormRow>
              </div>
            </FieldGroup>
            <FieldGroup title={t.account_group_contacts}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              </div>
            </FieldGroup>
            <FieldGroup title={t.account_group_locale}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </FieldGroup>
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
  accountApiClient: accountApiClientProp,
}: {
  profile: AccountProfile;
  onChange: (p: AccountProfile, options?: AccountUpdateOptions) => AccountUpdateResult;
  accountApiClient?: AccountApiClient;
}) => {
  const { t } = useLanguage();
  const c = profile.company;
  const pub = pubLabelMap(t);
  const qual = qualLabelMap(t);
  const fallbackAccountApiClient = useMemo(() => createAccountApiClient(), []);
  const accountApiClient = accountApiClientProp ?? fallbackAccountApiClient;

  const saveCompany = (next: CompanyProfile) => onChange({ ...profile, company: next });
  const resolveMediaSrc = (value: string) => accountApiClient.resolveStoredFileUrl(value);
  const uploadCompanyMediaFile = async (
    slot: "logo" | "cover",
    file: File,
    draft: CompanyMediaDraft,
  ) => {
    const payload = await fileToAccountUploadPayload(file);
    const result = await accountApiClient.uploadCompanyMedia(
      slot,
      {
        ...payload,
        alt: slot === "logo" ? draft.logoAlt : draft.coverAlt,
      },
      profile,
    );
    await onChange(result.profile, { syncRemote: false });
    return result.asset.objectKey;
  };

  return (
    <div className="space-y-4" data-testid="account-section-company">
      <CompanyMediaCard
        company={c}
        onSave={saveCompany}
        resolveMediaSrc={resolveMediaSrc}
        onUploadFile={accountApiClient.enabled ? uploadCompanyMediaFile : undefined}
      />

      <CompanyDocumentsCard accountApiClient={accountApiClient} company={c} />

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
          <div className="space-y-6" data-field-group-root>
            <FieldGroup title={t.account_group_identity}>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.account_company_legalName} value={v.legalName} />
                <Field label={t.account_company_tradeName} value={v.tradeName} />
                <Field label={t.account_company_role} value={accountRoleLabel(v.accountRole, t)} />
                <Field label={t.account_company_website} value={v.website} />
              </dl>
            </FieldGroup>
            <FieldGroup title={t.account_group_locale}>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.account_company_country} value={v.country} />
                <Field
                  label={t.account_company_yearFounded}
                  value={v.yearFounded ? String(v.yearFounded) : ""}
                />
              </dl>
            </FieldGroup>
          </div>
        )}
        renderEdit={({ draft, setDraft, errors }) => (
          <div className="space-y-6" data-field-group-root>
            <FieldGroup title={t.account_group_identity}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormRow label={t.account_company_legalName} required error={errors.legalName}>
                  <Input
                    value={draft.legalName}
                    onChange={(e) => setDraft({ ...draft, legalName: e.target.value })}
                    data-testid="account-company-legal-name"
                  />
                </FormRow>
                <FormRow label={t.account_company_tradeName} required error={errors.tradeName}>
                  <Input
                    value={draft.tradeName}
                    onChange={(e) => setDraft({ ...draft, tradeName: e.target.value })}
                    data-testid="account-company-trade-name"
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
                <FormRow label={t.account_company_website} error={errors.website}>
                  <Input
                    value={draft.website}
                    onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                    data-testid="account-company-website"
                  />
                </FormRow>
              </div>
            </FieldGroup>
            <FieldGroup title={t.account_group_locale}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormRow label={t.account_company_country} required error={errors.country}>
                  <Input
                    value={draft.country}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    data-testid="account-company-country"
                  />
                </FormRow>
                <FormRow label={t.account_company_yearFounded} error={errors.yearFounded}>
                  <Input
                    type="number"
                    value={draft.yearFounded || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, yearFounded: Number(e.target.value) || 0 })
                    }
                    data-testid="account-company-year-founded"
                  />
                </FormRow>
              </div>
            </FieldGroup>
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
                data-testid="account-company-contact-email"
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
                data-testid="account-company-contact-phone"
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
                data-testid="account-company-whatsapp"
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
              data-testid="account-company-description"
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
            <FormRow label={t.account_company_productFocus} hint={t.account_company_listHelp}>
              <Input
                value={draft.productFocus.join(", ")}
                onChange={(e) => setDraft({ ...draft, productFocus: splitList(e.target.value) })}
                data-testid="account-company-product-focus"
              />
            </FormRow>
            <FormRow label={t.account_company_certificates} hint={t.account_company_listHelp}>
              <Input
                value={draft.certificates.join(", ")}
                onChange={(e) => setDraft({ ...draft, certificates: splitList(e.target.value) })}
                data-testid="account-company-certificates"
              />
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
          <FormRow label={t.account_company_paymentTerms} hint={t.account_company_listHelp}>
            <Input
              value={draft.paymentTerms.join(", ")}
              onChange={(e) => setDraft({ ...draft, paymentTerms: splitList(e.target.value) })}
              data-testid="account-company-payment-terms"
            />
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
                data-testid="account-company-publication-status"
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
                data-testid="account-company-qualification-status"
              >
                <option value="incomplete">{t.account_company_qual_incomplete}</option>
                <option value="ready">{t.account_company_qual_ready}</option>
                <option value="qualified">{t.account_company_qual_qualified}</option>
              </select>
            </FormRow>
          </div>
        )}
      />

      <SupplierProfilePreview company={c} resolveMediaSrc={resolveMediaSrc} />
    </div>
  );
};

// ─── BRANCHES ──────────────────────────────────────────────────────

const BRANCH_TYPES: CompanyBranch["type"][] = [
  "registered_address",
  "office",
  "warehouse",
  "processing_plant",
  "sales_office",
  "loading_point",
];

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

const createEmptyBranch = (): CompanyBranch => ({
  id: `branch_${Date.now().toString(36)}`,
  name: "",
  type: "loading_point",
  country: "",
  region: "",
  city: "",
  addressLine: "",
  defaultIncoterms: "",
  portOrPickupPoint: "",
  notes: "",
});

const validateBranchDraft = (
  draft: CompanyBranch,
  t: ReturnType<typeof useLanguage>["t"],
) => {
  const nextErrors: Record<string, string> = {
    name: validateName(draft.name, t, true) ?? "",
    country: validateName(draft.country, t, true) ?? "",
    city: validateName(draft.city, t, true) ?? "",
    addressLine: validateName(draft.addressLine, t, true) ?? "",
    defaultIncoterms: validateName(draft.defaultIncoterms, t, true) ?? "",
    portOrPickupPoint: validateName(draft.portOrPickupPoint, t, true) ?? "",
    notes: validateText(draft.notes, t, 500) ?? "",
  };
  return Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
};

const normalizeBranchValue = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const branchDuplicateKey = (branch: CompanyBranch) =>
  [
    branch.name,
    branch.type,
    branch.country,
    branch.city,
    branch.addressLine,
    branch.defaultIncoterms,
    branch.portOrPickupPoint,
  ]
    .map(normalizeBranchValue)
    .join("|");

const BranchesSection = ({
  profile,
  onChange,
}: {
  profile: AccountProfile;
  onChange: (next: AccountProfile) => AccountUpdateResult;
}) => {
  const { t } = useLanguage();
  const branchTypeLabel = useMemo<Record<CompanyBranch["type"], string>>(
    () => ({
      registered_address: t.account_branch_type_registered,
      office: t.account_branch_type_office,
      warehouse: t.account_branch_type_warehouse,
      processing_plant: t.account_branch_type_plant,
      sales_office: t.account_branch_type_sales,
      loading_point: t.account_branch_type_loading,
    }),
    [t],
  );
  const [draft, setDraft] = useState<CompanyBranch | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CompanyBranch["type"] | "all">("all");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const visibleBranches = useMemo(() => {
    const normalizedQuery = normalizeBranchValue(query);
    return profile.branches.filter((branch) => {
      const matchesType = typeFilter === "all" || branch.type === typeFilter;
      if (!matchesType) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        branch.name,
        branchTypeLabel[branch.type],
        branch.country,
        branch.region,
        branch.city,
        branch.addressLine,
        branch.defaultIncoterms,
        branch.portOrPickupPoint,
        branch.notes,
      ]
        .map(normalizeBranchValue)
        .join(" ");

      return searchable.includes(normalizedQuery);
    });
  }, [branchTypeLabel, profile.branches, query, typeFilter]);

  const selectedBranch = selectedBranchId
    ? profile.branches.find((branch) => branch.id === selectedBranchId) ?? null
    : null;

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
  };

  const startAdd = () => {
    setDraft(createEmptyBranch());
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  };

  const startEdit = (branch: CompanyBranch) => {
    setDraft({ ...branch });
    setEditingId(branch.id);
    setErrors({});
    setSaveError(null);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaveError(null);
    const nextErrors = validateBranchDraft(draft, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const normalized: CompanyBranch = {
      ...draft,
      name: draft.name.trim(),
      country: draft.country.trim(),
      region: draft.region.trim(),
      city: draft.city.trim(),
      addressLine: draft.addressLine.trim(),
      defaultIncoterms: draft.defaultIncoterms.trim().toUpperCase(),
      portOrPickupPoint: draft.portOrPickupPoint.trim(),
      notes: draft.notes.trim(),
    };
    const duplicate = profile.branches.some(
      (branch) => branch.id !== editingId && branchDuplicateKey(branch) === branchDuplicateKey(normalized),
    );
    if (duplicate) {
      setErrors({ name: t.account_branch_duplicate_error });
      return;
    }

    const nextBranches = editingId
      ? profile.branches.map((b) => (b.id === editingId ? normalized : b))
      : [...profile.branches, normalized];
    try {
      await onChange({ ...profile, branches: nextBranches });
      setSelectedBranchId(normalized.id);
      cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  const deleteBranch = async (branchId: string) => {
    setSaveError(null);
    try {
      await onChange({ ...profile, branches: profile.branches.filter((b) => b.id !== branchId) });
      if (selectedBranchId === branchId) setSelectedBranchId(null);
      if (editingId === branchId) cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  return (
    <div className="space-y-4" data-testid="account-section-branches">
      {saveError ? (
        <p
          className="flex items-start gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
          data-testid="account-branch-save-error"
        >
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
          <span>{saveError}</span>
        </p>
      ) : null}
      <AccountSectionCard
        title={t.account_branches_title}
        description={t.account_branches_desc}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-muted-foreground" data-testid="account-branches-explainer">
            {t.account_branches_deliveryBasisExplainer}
          </p>
          <Button
            type="button"
            onClick={startAdd}
            className="shrink-0"
            data-testid="account-branch-add"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t.account_branch_add}
          </Button>
        </div>
      </AccountSectionCard>
      {profile.branches.length > 0 ? (
        <AccountSectionCard
          title={t.account_branch_search_title}
          description={t.account_branch_search_desc}
          testId="account-branch-search-panel"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
            <FormRow label={t.account_branch_search_label}>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 pl-9"
                  placeholder={t.account_branch_search_placeholder}
                  data-testid="account-branch-search"
                />
              </div>
            </FormRow>
            <FormRow label={t.account_branch_type_filter_label}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as CompanyBranch["type"] | "all")
                }
                data-testid="account-branch-type-filter"
              >
                <option value="all">{t.account_branch_type_filter_all}</option>
                {BRANCH_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {branchTypeLabel[type]}
                  </option>
                ))}
              </select>
            </FormRow>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!query && typeFilter === "all"}
              data-testid="account-branch-search-clear"
              className="h-9"
            >
              <X className="mr-2 h-4 w-4" aria-hidden />
              {t.account_action_reset}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground" data-testid="account-branch-results-count">
            {t.account_branch_results_count
              .replace("{visible}", String(visibleBranches.length))
              .replace("{total}", String(profile.branches.length))}
          </p>
        </AccountSectionCard>
      ) : null}
      {draft ? (
        <AccountSectionCard
          title={editingId ? t.account_branch_form_title_edit : t.account_branch_form_title_add}
          description={t.account_branch_form_desc}
          testId="account-branch-form"
        >
          <div className="space-y-5">
            <fieldset className="space-y-3">
              <legend className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.account_branch_form_section_identity}
              </legend>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormRow label={t.account_branch_field_name} required error={errors.name}>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    data-testid="account-branch-name"
                  />
                </FormRow>
                <FormRow label={t.account_branch_field_type}>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.type}
                    onChange={(e) =>
                      setDraft({ ...draft, type: e.target.value as CompanyBranch["type"] })
                    }
                    data-testid="account-branch-type"
                  >
                    {BRANCH_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {branchTypeLabel[type]}
                      </option>
                    ))}
                  </select>
                </FormRow>
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.account_branch_form_section_address}
              </legend>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormRow label={t.account_company_country} required error={errors.country}>
                  <Input
                    value={draft.country}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    list="account-branch-country-suggestions"
                    data-testid="account-branch-country"
                  />
                </FormRow>
                <FormRow label={t.account_branch_field_region}>
                  <Input
                    value={draft.region}
                    onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                    data-testid="account-branch-region"
                  />
                </FormRow>
                <FormRow label={t.account_branch_field_city} required error={errors.city}>
                  <Input
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    data-testid="account-branch-city"
                  />
                </FormRow>
                <FormRow
                  label={t.account_branch_field_address}
                  required
                  error={errors.addressLine}
                >
                  <Input
                    value={draft.addressLine}
                    onChange={(e) => setDraft({ ...draft, addressLine: e.target.value })}
                    data-testid="account-branch-address"
                  />
                </FormRow>
              </div>
              <datalist id="account-branch-country-suggestions">
                {countrySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.account_branch_form_section_logistics}
              </legend>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormRow
                  label={t.account_branch_incoterms}
                  required
                  error={errors.defaultIncoterms}
                >
                  <Input
                    value={draft.defaultIncoterms}
                    onChange={(e) => setDraft({ ...draft, defaultIncoterms: e.target.value })}
                    data-testid="account-branch-incoterms"
                  />
                </FormRow>
                <FormRow
                  label={t.account_branch_pickup}
                  required
                  error={errors.portOrPickupPoint}
                >
                  <Input
                    value={draft.portOrPickupPoint}
                    onChange={(e) => setDraft({ ...draft, portOrPickupPoint: e.target.value })}
                    data-testid="account-branch-pickup"
                  />
                </FormRow>
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.account_branch_form_section_notes}
              </legend>
              <FormRow label={t.account_branch_field_notes} error={errors.notes}>
                <Textarea
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  data-testid="account-branch-notes"
                />
              </FormRow>
            </fieldset>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              data-testid="account-branch-cancel"
            >
              {t.account_action_cancel}
            </Button>
            <Button type="button" onClick={() => void saveDraft()} data-testid="account-branch-save">
              {t.account_action_save}
            </Button>
          </div>
        </AccountSectionCard>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.branches.length === 0 ? (
          <AccountSectionCard title={t.account_branch_empty} testId="account-branch-empty">
            <p className="text-sm text-muted-foreground">{t.account_branch_empty_desc}</p>
          </AccountSectionCard>
        ) : visibleBranches.length === 0 ? (
          <AccountSectionCard
            title={t.account_branch_noResults}
            description={t.account_branch_noResults_desc}
            testId="account-branch-no-results"
          >
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              data-testid="account-branch-no-results-reset"
            >
              {t.account_action_reset}
            </Button>
          </AccountSectionCard>
        ) : (
          visibleBranches.map((b) => {
            const locationLine = [b.city, b.region, b.country].filter(Boolean).join(", ");
            return (
              <AccountSectionCard key={b.id} title={b.name} testId={`account-branch-${b.id}`}>
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <BranchTypeBadge type={b.type} />
                    {locationLine ? (
                      <span className="text-sm font-medium text-foreground break-words min-w-0">
                        {locationLine}
                      </span>
                    ) : null}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs min-w-0">
                    <div className="min-w-0">
                      <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {t.account_branch_incoterms}
                      </dt>
                      <dd className="mt-0.5 font-semibold text-foreground break-words">
                        {b.defaultIncoterms || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {t.account_branch_pickup}
                      </dt>
                      <dd className="mt-0.5 font-medium text-foreground break-words">
                        {b.portOrPickupPoint || "—"}
                      </dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {t.account_branch_field_address}
                      </dt>
                      <dd className="mt-0.5 text-foreground break-words">
                        {b.addressLine || "—"}
                      </dd>
                    </div>
                  </dl>
                  {b.notes ? (
                    <p className="text-xs italic text-muted-foreground break-words">{b.notes}</p>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant={selectedBranchId === b.id ? "secondary" : "default"}
                      size="sm"
                      onClick={() => setSelectedBranchId((current) => (current === b.id ? null : b.id))}
                      data-testid={`account-branch-open-${b.id}`}
                      className="min-h-11"
                    >
                      {selectedBranchId === b.id
                        ? t.account_branch_details_hide
                        : t.account_branch_details_open}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(b)}
                      data-testid={`account-branch-edit-${b.id}`}
                      aria-label={`${t.account_action_edit}: ${b.name}`}
                      className="min-h-11 min-w-11"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      <span className="sr-only sm:not-sr-only sm:ml-1.5">{t.account_action_edit}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void deleteBranch(b.id)}
                      aria-label={`${t.account_branch_delete}: ${b.name}`}
                      data-testid={`account-branch-delete-${b.id}`}
                      className="min-h-11 min-w-11 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </AccountSectionCard>
            );
          })
        )}
      </div>
      {selectedBranch ? (
        <AccountSectionCard
          title={t.account_branch_details_title}
          description={t.account_branch_details_desc}
          testId={`account-branch-detail-${selectedBranch.id}`}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t.account_branch_field_name} value={selectedBranch.name} />
            <Field
              label={t.account_branch_field_type}
              value={branchTypeLabel[selectedBranch.type]}
            />
            <Field label={t.account_company_country} value={selectedBranch.country} />
            <Field label={t.account_branch_field_city} value={selectedBranch.city} />
            <Field label={t.account_branch_field_region} value={selectedBranch.region} />
            <Field label={t.account_branch_field_address} value={selectedBranch.addressLine} />
            <Field label={t.account_branch_incoterms} value={selectedBranch.defaultIncoterms} />
            <Field label={t.account_branch_pickup} value={selectedBranch.portOrPickupPoint} />
          </div>
          {selectedBranch.notes ? (
            <p className="mt-4 rounded-md bg-muted/45 p-3 text-sm text-muted-foreground">
              {selectedBranch.notes}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedBranchId(null)}
              data-testid="account-branch-close-detail"
            >
              {t.account_action_close}
            </Button>
            <Button
              type="button"
              onClick={() => startEdit(selectedBranch)}
              data-testid="account-branch-detail-edit"
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              {t.account_action_edit}
            </Button>
          </div>
        </AccountSectionCard>
      ) : null}
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

const PRODUCT_STATES: CompanyProduct["state"][] = ["frozen", "fresh", "chilled", "alive", "cooked"];
const PRODUCT_ROLES: CompanyProduct["role"][] = ["buying", "selling", "both"];
type ProductSortKey = "commercialName" | "category" | "state" | "role" | "monthlyVolume";
type SortDirection = "asc" | "desc";
type ProductShareStatus = "idle" | "copied" | "manual";
const PRODUCT_SORT_KEYS: ProductSortKey[] = [
  "commercialName",
  "category",
  "state",
  "role",
  "monthlyVolume",
];
const PRODUCT_PAGE_SIZE_OPTIONS = [2, 5, 10, 25] as const;
type ProductPageSize = (typeof PRODUCT_PAGE_SIZE_OPTIONS)[number];
const PRODUCT_VIEW_STORAGE_KEY = "yorso_account_products_view_v1";

const isProductSortKey = (value: unknown): value is ProductSortKey =>
  typeof value === "string" && PRODUCT_SORT_KEYS.includes(value as ProductSortKey);

const isSortDirection = (value: unknown): value is SortDirection =>
  value === "asc" || value === "desc";

const isProductPageSize = (value: unknown): value is ProductPageSize =>
  typeof value === "number" && PRODUCT_PAGE_SIZE_OPTIONS.includes(value as ProductPageSize);

const isProductState = (value: unknown): value is CompanyProduct["state"] =>
  typeof value === "string" && PRODUCT_STATES.includes(value as CompanyProduct["state"]);

const isProductRole = (value: unknown): value is CompanyProduct["role"] =>
  typeof value === "string" && PRODUCT_ROLES.includes(value as CompanyProduct["role"]);

const isProductPageParam = (value: string | null) => {
  if (!value) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const parseProductPageIndex = (value: string | null) => {
  return isProductPageParam(value) ? Math.floor(Number(value)) - 1 : 0;
};

const readProductViewPrefs = (): {
  sortKey: ProductSortKey;
  sortDirection: SortDirection;
  pageSize: ProductPageSize;
} => {
  const fallbackPrefs = {
    sortKey: "commercialName" as ProductSortKey,
    sortDirection: "asc" as SortDirection,
    pageSize: 10 as ProductPageSize,
  };
  if (typeof window === "undefined") return fallbackPrefs;

  try {
    const raw = window.localStorage.getItem(PRODUCT_VIEW_STORAGE_KEY);
    if (!raw) return fallbackPrefs;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      sortKey: isProductSortKey(parsed.sortKey) ? parsed.sortKey : fallbackPrefs.sortKey,
      sortDirection: isSortDirection(parsed.sortDirection)
        ? parsed.sortDirection
        : fallbackPrefs.sortDirection,
      pageSize: isProductPageSize(parsed.pageSize) ? parsed.pageSize : fallbackPrefs.pageSize,
    };
  } catch {
    return fallbackPrefs;
  }
};

const readProductInitialView = (searchParams: URLSearchParams) => {
  const storedPrefs = readProductViewPrefs();
  const sortParam = searchParams.get("sort");
  const directionParam = searchParams.get("dir");
  const rowsParam = Number(searchParams.get("rows"));
  const stateParam = searchParams.get("state");
  const roleParam = searchParams.get("role");
  const pageParam = searchParams.get("page");
  const ignoredParams = [
    stateParam !== null && !isProductState(stateParam) ? "state" : null,
    roleParam !== null && !isProductRole(roleParam) ? "role" : null,
    sortParam !== null && !isProductSortKey(sortParam) ? "sort" : null,
    directionParam !== null && !isSortDirection(directionParam) ? "dir" : null,
    searchParams.has("rows") && !isProductPageSize(rowsParam) ? "rows" : null,
    searchParams.has("page") && !isProductPageParam(pageParam) ? "page" : null,
  ].filter(Boolean) as string[];

  return {
    query: searchParams.get("q") ?? "",
    stateFilter: isProductState(stateParam) ? stateParam : ("all" as const),
    roleFilter: isProductRole(roleParam) ? roleParam : ("all" as const),
    sortKey: isProductSortKey(sortParam) ? sortParam : storedPrefs.sortKey,
    sortDirection: isSortDirection(directionParam) ? directionParam : storedPrefs.sortDirection,
    pageSize: isProductPageSize(rowsParam) ? rowsParam : storedPrefs.pageSize,
    pageIndex: parseProductPageIndex(pageParam),
    ignoredParams,
  };
};

const productStateLabel = (s: ProductState, t: ReturnType<typeof useLanguage>["t"]) =>
  ({
    frozen: t.account_product_state_frozen,
    fresh: t.account_product_state_fresh,
    chilled: t.account_product_state_chilled,
    alive: t.account_product_state_alive,
    cooked: t.account_product_state_cooked,
  }[s]);

const productRoleLabel = (role: CompanyProduct["role"], t: ReturnType<typeof useLanguage>["t"]) =>
  ({
    buying: t.account_product_role_buying,
    selling: t.account_product_role_selling,
    both: t.account_product_role_both,
  }[role]);

const ProductMobileField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="min-w-0">
    <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {label}
    </p>
    <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
  </div>
);

const productTaxonomyDisplay = (product: Pick<CompanyProduct, "commercialName" | "latinName">) =>
  `${product.latinName} (${product.commercialName})`;

const ProductMobileCard = ({
  product,
  isSelected,
  onToggleDetails,
  onEdit,
  onDelete,
  t,
}: {
  product: CompanyProduct;
  isSelected: boolean;
  onToggleDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) => (
  <article
    className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm"
    data-testid={`account-product-mobile-card-${product.id}`}
  >
    <div className="min-w-0 space-y-0.5">
      <h3 className="break-words text-base font-semibold leading-snug text-foreground">
        <span className="italic">{product.latinName}</span>
      </h3>
      <p className="break-words text-sm leading-snug text-muted-foreground">
        ({product.commercialName})
      </p>
      {product.format ? (
        <p className="break-words text-xs leading-snug text-muted-foreground">{product.format}</p>
      ) : null}
    </div>

    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border/60 pt-3">
      <ProductMobileField label={t.account_product_col_state}>
        <span className="break-words">{productStateLabel(product.state, t)}</span>
      </ProductMobileField>
      <ProductMobileField label={t.account_product_col_role}>
        <ProductRoleBadge role={product.role} />
      </ProductMobileField>
      <ProductMobileField label={t.account_product_col_volume}>
        <span className="break-words">{product.monthlyVolume}</span>
      </ProductMobileField>
      <ProductMobileField label={t.account_product_col_certs}>
        {product.certificates.length ? (
          <span className="flex flex-wrap gap-1">
            {product.certificates.map((certificate) => (
              <Badge key={certificate} variant="outline" className="text-[10px]">
                {certificate}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">{t.account_value_notSpecified}</span>
        )}
      </ProductMobileField>
      <div className="col-span-2 min-w-0">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t.account_product_col_targets}
        </p>
        <p className="mt-1 break-words text-sm text-foreground">
          {product.targetCountries.length
            ? product.targetCountries.join(", ")
            : t.account_value_notSpecified}
        </p>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
      <Button
        type="button"
        variant={isSelected ? "secondary" : "outline"}
        onClick={onToggleDetails}
        size="sm"
        className="min-h-11 flex-1 justify-center"
        data-testid={`account-product-mobile-open-${product.id}`}
      >
        {isSelected ? t.account_product_details_hide : t.account_product_details_open}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onEdit}
        size="sm"
        className="min-h-11 min-w-11 justify-center px-3"
        aria-label={`${t.account_action_edit}: ${productTaxonomyDisplay(product)}`}
        data-testid={`account-product-mobile-edit-${product.id}`}
      >
        <Pencil className="h-4 w-4" aria-hidden />
        <span className="sr-only">{t.account_action_edit}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onDelete}
        size="sm"
        className="min-h-11 min-w-11 justify-center px-3 text-destructive hover:text-destructive"
        aria-label={`${t.account_product_delete}: ${productTaxonomyDisplay(product)}`}
        data-testid={`account-product-mobile-delete-${product.id}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        <span className="sr-only">{t.account_product_delete}</span>
      </Button>
    </div>
  </article>
);

const createEmptyProduct = (): CompanyProduct => ({
  id: `product_${Date.now().toString(36)}`,
  commercialName: "",
  latinName: "",
  category: "",
  state: "frozen",
  format: "",
  role: "both",
  monthlyVolume: "",
  certificates: [],
  targetCountries: [],
});

const validateProductDraft = (
  draft: CompanyProduct,
  t: ReturnType<typeof useLanguage>["t"],
) => {
  const nextErrors: Record<string, string> = {
    commercialName: validateName(draft.commercialName, t, true) ?? "",
    latinName: validateName(draft.latinName, t, true) ?? "",
    category: validateName(draft.category, t, true) ?? "",
    format: validateText(draft.format, t, 120) ?? "",
    monthlyVolume: validateName(draft.monthlyVolume, t, true) ?? "",
  };
  return Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
};

const normalizeProductValue = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const parseVolume = (value: string) => {
  const match = value.replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const productDuplicateKey = (product: CompanyProduct) =>
  [
    product.commercialName,
    product.latinName,
    product.category,
    product.state,
    product.role,
    product.format,
  ]
    .map(normalizeProductValue)
    .join("|");

const ProductsSection = ({
  profile,
  onChange,
}: {
  profile: AccountProfile;
  onChange: (next: AccountProfile) => AccountUpdateResult;
}) => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialView] = useState(() => readProductInitialView(searchParams));
  const [draft, setDraft] = useState<CompanyProduct | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialView.query);
  const [stateFilter, setStateFilter] = useState<CompanyProduct["state"] | "all">(
    initialView.stateFilter,
  );
  const [roleFilter, setRoleFilter] = useState<CompanyProduct["role"] | "all">(
    initialView.roleFilter,
  );
  const [sortKey, setSortKey] = useState<ProductSortKey>(initialView.sortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialView.sortDirection);
  const [pageSize, setPageSize] = useState<ProductPageSize>(initialView.pageSize);
  const [pageIndex, setPageIndex] = useState(initialView.pageIndex);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<ProductShareStatus>("idle");
  const [shareLinkValue, setShareLinkValue] = useState("");
  const [ignoredLinkParams, setIgnoredLinkParams] = useState(initialView.ignoredParams);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<CompanyProduct | null>(null);
  const productViewMountedRef = useRef(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const shareLinkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      PRODUCT_VIEW_STORAGE_KEY,
      JSON.stringify({ sortKey, sortDirection, pageSize }),
    );
  }, [pageSize, sortDirection, sortKey]);

  useEffect(() => {
    if (!productViewMountedRef.current) {
      productViewMountedRef.current = true;
      return;
    }
    setPageIndex(0);
  }, [pageSize, query, roleFilter, sortDirection, sortKey, stateFilter]);

  useEffect(() => {
    setShareStatus("idle");
    setShareLinkValue("");
  }, [pageIndex, pageSize, query, roleFilter, sortDirection, sortKey, stateFilter]);

  const focusShareLinkInput = () => {
    window.setTimeout(() => {
      shareLinkInputRef.current?.focus();
      shareLinkInputRef.current?.select();
    }, 0);
  };

  const buildProductViewParams = () => {
    const nextParams = new URLSearchParams();
    const trimmedQuery = query.trim();
    if (trimmedQuery) nextParams.set("q", trimmedQuery);
    if (stateFilter !== "all") nextParams.set("state", stateFilter);
    if (roleFilter !== "all") nextParams.set("role", roleFilter);
    if (sortKey !== "commercialName") nextParams.set("sort", sortKey);
    if (sortDirection !== "asc") nextParams.set("dir", sortDirection);
    if (pageSize !== 10) nextParams.set("rows", String(pageSize));
    if (safePageIndex > 0) nextParams.set("page", String(safePageIndex + 1));
    return nextParams;
  };

  const buildProductViewUrl = (nextParams: URLSearchParams) => {
    if (typeof window === "undefined") return "";
    const nextUrl = new URL(window.location.href);
    nextUrl.search = nextParams.toString();
    return nextUrl.toString();
  };

  const sortKeyLabel = (key: ProductSortKey) =>
    ({
      commercialName: t.account_product_sort_by_product,
      category: t.account_product_sort_by_category,
      state: t.account_product_sort_by_state,
      role: t.account_product_sort_by_role,
      monthlyVolume: t.account_product_sort_by_volume,
    })[key];

  const visibleProducts = useMemo(() => {
    const normalizedQuery = normalizeProductValue(query);
    const filtered = profile.products.filter((product) => {
      if (stateFilter !== "all" && product.state !== stateFilter) return false;
      if (roleFilter !== "all" && product.role !== roleFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        product.commercialName,
        product.latinName,
        product.category,
        productStateLabel(product.state, t),
        productRoleLabel(product.role, t),
        product.format,
        product.monthlyVolume,
        product.certificates.join(" "),
        product.targetCountries.join(" "),
      ]
        .map(normalizeProductValue)
        .join(" ");

      return searchable.includes(normalizedQuery);
    });

    return [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "monthlyVolume") {
        const diff = parseVolume(a.monthlyVolume) - parseVolume(b.monthlyVolume);
        if (diff !== 0) return diff * direction;
      }

      const aValue =
        sortKey === "state"
          ? productStateLabel(a.state, t)
          : sortKey === "role"
            ? productRoleLabel(a.role, t)
            : a[sortKey];
      const bValue =
        sortKey === "state"
          ? productStateLabel(b.state, t)
          : sortKey === "role"
            ? productRoleLabel(b.role, t)
            : b[sortKey];

      const result = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return result * direction;
    });
  }, [profile.products, query, roleFilter, sortDirection, sortKey, stateFilter, t]);

  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageStart = visibleProducts.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const pageEnd = Math.min(visibleProducts.length, (safePageIndex + 1) * pageSize);
  const pagedProducts = visibleProducts.slice(safePageIndex * pageSize, pageEnd);

  const selectedProduct = selectedProductId
    ? profile.products.find((product) => product.id === selectedProductId) ?? null
    : null;

  const resetFilters = () => {
    setQuery("");
    setStateFilter("all");
    setRoleFilter("all");
    setPageIndex(0);
    setIgnoredLinkParams([]);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    nextParams.delete("state");
    nextParams.delete("role");
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const copyProductViewLink = async (url: string) => {
    const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    if (!clipboard?.writeText) {
      setShareStatus("manual");
      focusShareLinkInput();
      return;
    }

    try {
      await clipboard.writeText(url);
      setShareStatus("copied");
    } catch {
      setShareStatus("manual");
    }
    focusShareLinkInput();
  };

  const shareCurrentView = async () => {
    const nextParams = buildProductViewParams();
    const nextUrl = buildProductViewUrl(nextParams);
    setIgnoredLinkParams([]);
    setSearchParams(nextParams, { replace: false });
    setShareLinkValue(nextUrl);
    await copyProductViewLink(nextUrl);
  };

  const copyCurrentShareLink = async () => {
    if (!shareLinkValue) return;
    await copyProductViewLink(shareLinkValue);
  };

  const cleanIgnoredLinkParams = () => {
    const nextParams = new URLSearchParams(searchParams);
    ignoredLinkParams.forEach((param) => nextParams.delete(param));
    setIgnoredLinkParams([]);
    setSearchParams(nextParams, { replace: true });
    window.setTimeout(() => shareButtonRef.current?.focus(), 0);
  };

  const startAdd = () => {
    setDraft(createEmptyProduct());
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  };

  const startEdit = (product: CompanyProduct) => {
    setDraft({
      ...product,
      certificates: [...product.certificates],
      targetCountries: [...product.targetCountries],
    });
    setEditingId(product.id);
    setErrors({});
    setSaveError(null);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaveError(null);
    const nextErrors = validateProductDraft(draft, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const normalized: CompanyProduct = {
      ...draft,
      commercialName: draft.commercialName.trim(),
      latinName: draft.latinName.trim(),
      category: draft.category.trim(),
      format: draft.format.trim(),
      monthlyVolume: draft.monthlyVolume.trim(),
      certificates: draft.certificates.map((c) => c.trim()).filter(Boolean),
      targetCountries: draft.targetCountries.map((c) => c.trim()).filter(Boolean),
    };
    const duplicate = profile.products.some(
      (product) =>
        product.id !== editingId && productDuplicateKey(product) === productDuplicateKey(normalized),
    );
    if (duplicate) {
      setErrors({ commercialName: t.account_product_duplicate_error });
      return;
    }

    const nextProducts = editingId
      ? profile.products.map((p) => (p.id === editingId ? normalized : p))
      : [...profile.products, normalized];

    try {
      await onChange({ ...profile, products: nextProducts });
      setSelectedProductId(normalized.id);
      cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  const deleteProduct = async (productId: string) => {
    setSaveError(null);
    try {
      await onChange({ ...profile, products: profile.products.filter((p) => p.id !== productId) });
      if (selectedProductId === productId) setSelectedProductId(null);
      if (editingId === productId) cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  return (
    <div className="space-y-4" data-testid="account-section-products">
      {saveError ? (
        <p
          className="flex items-start gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
          data-testid="account-product-save-error"
        >
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
          <span>{saveError}</span>
        </p>
      ) : null}
      <AccountSectionCard
        title={t.account_products_title}
        description={t.account_products_desc}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.account_products_matchingExplainer}</p>
          <Button
            type="button"
            onClick={startAdd}
            className="shrink-0"
            data-testid="account-product-add"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t.account_product_add}
          </Button>
        </div>
      </AccountSectionCard>
      {profile.products.length > 0 ? (
        <AccountSectionCard
          title={t.account_product_search_title}
          description={t.account_product_search_desc}
          testId="account-product-search-panel"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <FormRow label={t.account_product_search_label}>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 pl-9"
                  placeholder={t.account_product_search_placeholder}
                  data-testid="account-product-search"
                />
              </div>
            </FormRow>
            <FormRow label={t.account_product_state_filter_label}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={stateFilter}
                onChange={(event) =>
                  setStateFilter(event.target.value as CompanyProduct["state"] | "all")
                }
                data-testid="account-product-state-filter"
              >
                <option value="all">{t.account_product_state_filter_all}</option>
                {PRODUCT_STATES.map((state) => (
                  <option key={state} value={state}>
                    {productStateLabel(state, t)}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label={t.account_product_role_filter_label}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as CompanyProduct["role"] | "all")
                }
                data-testid="account-product-role-filter"
              >
                <option value="all">{t.account_product_role_filter_all}</option>
                {PRODUCT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {productRoleLabel(role, t)}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="min-w-[160px] flex-1">
              <FormRow label={t.account_product_sort_label}>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as ProductSortKey)}
                  data-testid="account-product-sort-key"
                >
                  {PRODUCT_SORT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {sortKeyLabel(key)}
                    </option>
                  ))}
                </select>
              </FormRow>
            </div>
            <div className="min-w-[120px]">
              <FormRow label={t.account_product_sort_direction_label}>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                  data-testid="account-product-sort-direction"
                >
                  <option value="asc">{t.account_product_sort_asc}</option>
                  <option value="desc">{t.account_product_sort_desc}</option>
                </select>
              </FormRow>
            </div>
            <div className="min-w-[120px]">
              <FormRow label={t.account_product_page_size_label}>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value) as ProductPageSize)}
                  data-testid="account-product-page-size"
                >
                  {PRODUCT_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {t.account_product_page_size_option.replace("{count}", String(size))}
                    </option>
                  ))}
                </select>
              </FormRow>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={!query && stateFilter === "all" && roleFilter === "all"}
                data-testid="account-product-search-clear"
                className="h-9"
              >
                <X className="mr-2 h-4 w-4" aria-hidden />
                {t.account_product_clear_filters}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                ref={shareButtonRef}
                onClick={shareCurrentView}
                data-testid="account-product-share-view"
                className="h-9"
              >
                {t.account_product_share_view}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p data-testid="account-product-results-count" aria-live="polite">
              {t.account_product_results_count
                .replace("{visible}", String(visibleProducts.length))
                .replace("{total}", String(profile.products.length))}
              {" · "}
              {t.account_product_sorted_by.replace("{field}", sortKeyLabel(sortKey))}
            </p>
            {visibleProducts.length > 0 ? (
              <p data-testid="account-product-page-summary" aria-live="polite">
                {t.account_product_page_summary
                  .replace("{start}", String(pageStart))
                  .replace("{end}", String(pageEnd))
                  .replace("{total}", String(visibleProducts.length))}
              </p>
            ) : null}
          </div>
          {shareStatus !== "idle" ? (
            <div
              className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
              data-testid="account-product-link-status"
              role="status"
              aria-live="polite"
            >
              <p>
                {shareStatus === "copied"
                  ? t.account_product_link_copied
                  : t.account_product_link_manual}
              </p>
              {shareLinkValue ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Label htmlFor="account-product-share-url" className="sr-only">
                    {t.account_product_link_value_label}
                  </Label>
                  <Input
                    id="account-product-share-url"
                    ref={shareLinkInputRef}
                    readOnly
                    value={shareLinkValue}
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-9 bg-background text-xs"
                    data-testid="account-product-share-url"
                    aria-label={t.account_product_link_value_label}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyCurrentShareLink}
                    data-testid="account-product-copy-link"
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" aria-hidden />
                    {t.account_product_copy_link}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {ignoredLinkParams.length ? (
            <div
              className="mt-2 flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between"
              data-testid="account-product-link-warning"
              role="status"
              aria-live="polite"
            >
              <span>
                {t.account_product_link_ignored.replace("{params}", ignoredLinkParams.join(", "))}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cleanIgnoredLinkParams}
                className="border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100"
                data-testid="account-product-clean-link"
              >
                {t.account_product_clean_link}
              </Button>
            </div>
          ) : null}
        </AccountSectionCard>
      ) : null}
      {draft ? (
        <AccountSectionCard
          title={editingId ? t.account_product_form_title_edit : t.account_product_form_title_add}
          description={t.account_product_form_desc}
          testId="account-product-form"
        >
          <div className="mb-4">
            <AccountProductCatalogPicker
              selected={{
                commercialName: draft.commercialName,
                latinName: draft.latinName,
              }}
              onSelect={(item) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        commercialName: item.commercialName,
                        latinName: item.latinName,
                      }
                    : current,
                )
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormRow label={t.account_product_col_product} required error={errors.commercialName}>
              <Input
                value={draft.commercialName}
                onChange={(e) => setDraft({ ...draft, commercialName: e.target.value })}
                data-testid="account-product-commercial-name"
              />
            </FormRow>
            <FormRow label={t.account_product_col_latin} required error={errors.latinName}>
              <Input
                value={draft.latinName}
                onChange={(e) => setDraft({ ...draft, latinName: e.target.value })}
                data-testid="account-product-latin-name"
              />
            </FormRow>
            <FormRow label={t.account_product_field_category} required error={errors.category}>
              <Input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                data-testid="account-product-category"
              />
            </FormRow>
            <FormRow label={t.account_product_col_state}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.state}
                onChange={(e) =>
                  setDraft({ ...draft, state: e.target.value as CompanyProduct["state"] })
                }
                data-testid="account-product-state"
              >
                {PRODUCT_STATES.map((state) => (
                  <option key={state} value={state}>
                    {productStateLabel(state, t)}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label={t.account_product_col_role}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value as CompanyProduct["role"] })
                }
                data-testid="account-product-role"
              >
                {PRODUCT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {productRoleLabel(role, t)}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label={t.account_product_col_volume} required error={errors.monthlyVolume}>
              <Input
                value={draft.monthlyVolume}
                onChange={(e) => setDraft({ ...draft, monthlyVolume: e.target.value })}
                data-testid="account-product-monthly-volume"
              />
            </FormRow>
            <FormRow label={t.account_product_field_format} error={errors.format}>
              <Input
                value={draft.format}
                onChange={(e) => setDraft({ ...draft, format: e.target.value })}
                data-testid="account-product-format"
              />
            </FormRow>
            <FormRow label={t.account_product_col_certs}>
              <Input
                value={draft.certificates.join(", ")}
                onChange={(e) => setDraft({ ...draft, certificates: splitList(e.target.value) })}
                data-testid="account-product-certificates"
              />
            </FormRow>
            <FormRow label={t.account_product_col_targets}>
              <Input
                value={draft.targetCountries.join(", ")}
                onChange={(e) =>
                  setDraft({ ...draft, targetCountries: splitList(e.target.value) })
                }
                data-testid="account-product-target-countries"
              />
            </FormRow>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              data-testid="account-product-cancel"
            >
              {t.account_action_cancel}
            </Button>
            <Button type="button" onClick={() => void saveDraft()} data-testid="account-product-save">
              {t.account_action_save}
            </Button>
          </div>
        </AccountSectionCard>
      ) : null}
      <div className="grid gap-3 md:hidden" data-testid="account-products-mobile-cards">
        {profile.products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {t.account_product_empty}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div
            className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground"
            data-testid="account-product-mobile-no-results"
          >
            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
              <div>
                <p className="font-medium text-foreground">{t.account_product_noResults}</p>
                <p className="mt-1">{t.account_product_noResults_desc}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="min-h-11"
                data-testid="account-product-mobile-no-results-reset"
              >
                {t.account_product_clear_filters}
              </Button>
            </div>
          </div>
        ) : (
          pagedProducts.map((product: CompanyProduct) => (
            <ProductMobileCard
              key={product.id}
              product={product}
              isSelected={selectedProductId === product.id}
              onToggleDetails={() =>
                setSelectedProductId((current) => (current === product.id ? null : product.id))
              }
              onEdit={() => startEdit(product)}
              onDelete={() => setPendingDeleteProduct(product)}
              t={t}
            />
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full text-sm" data-testid="account-products-table">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{t.account_product_col_product}</th>
              <th className="px-3 py-2">{t.account_product_col_state}</th>
              <th className="px-3 py-2">{t.account_product_col_role}</th>
              <th className="px-3 py-2">{t.account_product_col_volume}</th>
              <th className="px-3 py-2">{t.account_product_col_certs}</th>
              <th className="px-3 py-2">{t.account_product_col_targets}</th>
              <th className="px-3 py-2 text-right">{t.account_product_col_actions}</th>
            </tr>
          </thead>
          <tbody>
            {profile.products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {t.account_product_empty}
                </td>
              </tr>
            ) : visibleProducts.length === 0 ? (
              <tr data-testid="account-product-no-results">
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                    <div>
                      <p className="font-medium text-foreground">{t.account_product_noResults}</p>
                      <p className="mt-1">{t.account_product_noResults_desc}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      data-testid="account-product-no-results-reset"
                    >
                      {t.account_product_clear_filters}
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              pagedProducts.map((p: CompanyProduct) => (
                <tr
                  key={p.id}
                  className="border-t border-border align-top odd:bg-muted/20 hover:bg-muted/40"
                  data-testid={`account-product-row-${p.id}`}
                >

                  <td className="px-3 py-2">
                    <div className="font-medium italic">{p.latinName}</div>
                    <div className="text-xs text-muted-foreground">({p.commercialName})</div>
                    <div className="text-xs text-muted-foreground">{p.format}</div>
                  </td>
                  <td className="px-3 py-2">{productStateLabel(p.state, t)}</td>
                  <td className="px-3 py-2">
                    <ProductRoleBadge role={p.role} />
                  </td>
                  <td className="px-3 py-2">{p.monthlyVolume}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {p.certificates.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {p.targetCountries.join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant={selectedProductId === p.id ? "secondary" : "outline"}
                        size="sm"
                        onClick={() =>
                          setSelectedProductId((current) => (current === p.id ? null : p.id))
                        }
                        data-testid={`account-product-open-${p.id}`}
                      >
                        {selectedProductId === p.id
                          ? t.account_product_details_hide
                          : t.account_product_details_open}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(p)}
                        data-testid={`account-product-edit-${p.id}`}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        {t.account_action_edit}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteProduct(p)}
                        aria-label={`${t.account_product_delete}: ${productTaxonomyDisplay(p)}`}
                        data-testid={`account-product-delete-${p.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {visibleProducts.length > pageSize ? (
        <div
          className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          data-testid="account-product-pagination"
        >
          <p className="text-muted-foreground">
            {t.account_product_page_status
              .replace("{current}", String(safePageIndex + 1))
              .replace("{total}", String(pageCount))}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              disabled={safePageIndex === 0}
              aria-label={t.account_product_page_previous}
              data-testid="account-product-page-previous"
            >
              {t.account_product_page_previous}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
              disabled={safePageIndex >= pageCount - 1}
              aria-label={t.account_product_page_next}
              data-testid="account-product-page-next"
            >
              {t.account_product_page_next}
            </Button>
          </div>
        </div>
      ) : null}
      {selectedProduct ? (
        <AccountSectionCard
          title={t.account_product_details_title}
          description={t.account_product_details_desc}
          testId={`account-product-detail-${selectedProduct.id}`}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t.account_product_col_product} value={productTaxonomyDisplay(selectedProduct)} />
            <Field label={t.account_product_field_category} value={selectedProduct.category} />
            <Field label={t.account_product_col_state} value={productStateLabel(selectedProduct.state, t)} />
            <Field label={t.account_product_col_role} value={productRoleLabel(selectedProduct.role, t)} />
            <Field label={t.account_product_col_volume} value={selectedProduct.monthlyVolume} />
            <Field label={t.account_product_field_format} value={selectedProduct.format} />
            <Field
              label={t.account_product_col_targets}
              value={selectedProduct.targetCountries.join(", ")}
            />
          </div>
          {selectedProduct.certificates.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProduct.certificates.map((certificate) => (
                <Badge key={certificate} variant="outline">
                  {certificate}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedProductId(null)}
              data-testid="account-product-close-detail"
            >
              {t.account_action_close}
            </Button>
            <Button
              type="button"
              onClick={() => startEdit(selectedProduct)}
              data-testid="account-product-detail-edit"
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              {t.account_action_edit}
            </Button>
          </div>
        </AccountSectionCard>
      ) : null}
      <AlertDialog
        open={pendingDeleteProduct !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteProduct(null);
        }}
      >
        <AlertDialogContent data-testid="account-product-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.account_product_delete_confirm_title}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.account_product_delete_confirm_desc.replace(
                "{product}",
                pendingDeleteProduct ? productTaxonomyDisplay(pendingDeleteProduct) : "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDeleteProduct ? (
            <dl
              className="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3"
              data-testid="account-product-delete-confirm-context"
            >
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.account_product_delete_confirm_productLabel}
              </dt>
              <dd
                className="font-medium text-foreground"
                data-testid="account-product-delete-confirm-product"
              >
                {productTaxonomyDisplay(pendingDeleteProduct)}
              </dd>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.account_product_delete_confirm_roleLabel}
              </dt>
              <dd className="text-foreground">
                {productRoleLabel(pendingDeleteProduct.role, t)}
              </dd>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.account_product_col_state}
              </dt>
              <dd className="text-foreground">
                {productStateLabel(pendingDeleteProduct.state, t)}
              </dd>
            </dl>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPendingDeleteProduct(null)}
              data-testid="account-product-delete-confirm-cancel"
            >
              {t.account_product_delete_confirm_cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = pendingDeleteProduct;
                setPendingDeleteProduct(null);
                if (target) void deleteProduct(target.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="account-product-delete-confirm-submit"
            >
              {t.account_product_delete_confirm_submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── META REGIONS ──────────────────────────────────────────────────

const META_REGION_REASONS: MetaRegion["logisticsReason"][] = [
  "similar_freight_cost",
  "same_customs_zone",
  "same_sales_market",
  "same_warehouse_route",
  "manual",
];

const META_REGION_USES: Array<MetaRegion["usedFor"][number]> = [
  "notifications",
  "price_access",
  "campaigns",
  "landed_cost",
  "supplier_matching",
];

const createEmptyMetaRegion = (): MetaRegion => ({
  id: `meta_${Date.now().toString(36)}`,
  name: "",
  countries: [],
  logisticsReason: "similar_freight_cost",
  defaultCurrency: "EUR",
  notes: "",
  usedFor: ["supplier_matching"],
});

const validateMetaRegionDraft = (
  draft: MetaRegion,
  t: ReturnType<typeof useLanguage>["t"],
) => {
  const nextErrors: Record<string, string> = {
    name: validateName(draft.name, t, true) ?? "",
    countries: draft.countries.length ? "" : t.account_validation_required,
    defaultCurrency: validateName(draft.defaultCurrency, t, true) ?? "",
    notes: validateText(draft.notes, t, 500) ?? "",
  };
  return Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
};

const MetaRegionsSection = ({
  profile,
  onChange,
}: {
  profile: AccountProfile;
  onChange: (next: AccountProfile) => AccountUpdateResult;
}) => {
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
  const [draft, setDraft] = useState<MetaRegion | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const startAdd = () => {
    setDraft(createEmptyMetaRegion());
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  };

  const startEdit = (region: MetaRegion) => {
    setDraft({
      ...region,
      countries: [...region.countries],
      usedFor: [...region.usedFor],
    });
    setEditingId(region.id);
    setErrors({});
    setSaveError(null);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  };

  const toggleUse = (use: MetaRegion["usedFor"][number]) => {
    if (!draft) return;
    const usedFor = draft.usedFor.includes(use)
      ? draft.usedFor.filter((u) => u !== use)
      : [...draft.usedFor, use];
    setDraft({ ...draft, usedFor });
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaveError(null);
    const nextErrors = validateMetaRegionDraft(draft, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const normalized: MetaRegion = {
      ...draft,
      name: draft.name.trim(),
      countries: draft.countries.map((c) => c.trim()).filter(Boolean),
      defaultCurrency: draft.defaultCurrency.trim().toUpperCase(),
      notes: draft.notes.trim(),
      usedFor: draft.usedFor.length ? draft.usedFor : ["supplier_matching"],
    };
    const nextRegions = editingId
      ? profile.metaRegions.map((m) => (m.id === editingId ? normalized : m))
      : [...profile.metaRegions, normalized];
    try {
      await onChange({ ...profile, metaRegions: nextRegions });
      cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  const deleteRegion = async (regionId: string) => {
    setSaveError(null);
    try {
      await onChange({ ...profile, metaRegions: profile.metaRegions.filter((m) => m.id !== regionId) });
      if (editingId === regionId) cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  return (
    <div className="space-y-4" data-testid="account-section-meta-regions">
      {saveError ? (
        <p
          className="flex items-start gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
          data-testid="account-meta-save-error"
        >
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
          <span>{saveError}</span>
        </p>
      ) : null}
      <AccountSectionCard
        title={t.account_metaRegions_title}
        description={t.account_metaRegions_desc}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.account_metaRegions_explainer}</p>
          <Button
            type="button"
            onClick={startAdd}
            className="shrink-0"
            data-testid="account-meta-add"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t.account_metaRegion_add}
          </Button>
        </div>
      </AccountSectionCard>
      {draft ? (
        <AccountSectionCard
          title={editingId ? t.account_metaRegion_form_title_edit : t.account_metaRegion_form_title_add}
          description={t.account_metaRegion_form_desc}
          testId="account-meta-form"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormRow label={t.account_metaRegion_field_name} required error={errors.name}>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                data-testid="account-meta-name"
              />
            </FormRow>
            <FormRow
              label={t.account_metaRegion_field_countries}
              required
              error={errors.countries}
            >
              <Input
                value={draft.countries.join(", ")}
                onChange={(e) => setDraft({ ...draft, countries: splitList(e.target.value) })}
                data-testid="account-meta-countries"
              />
            </FormRow>
            <FormRow label={t.account_metaRegion_reason}>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.logisticsReason}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    logisticsReason: e.target.value as MetaRegion["logisticsReason"],
                  })
                }
                data-testid="account-meta-reason"
              >
                {META_REGION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reasonLabel[reason]}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow
              label={t.account_metaRegion_field_currency}
              required
              error={errors.defaultCurrency}
            >
              <Input
                value={draft.defaultCurrency}
                onChange={(e) => setDraft({ ...draft, defaultCurrency: e.target.value })}
                data-testid="account-meta-currency"
              />
            </FormRow>
            <div className="md:col-span-2">
              <FormRow label={t.account_metaRegion_field_notes} error={errors.notes}>
                <Textarea
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  data-testid="account-meta-notes"
                />
              </FormRow>
            </div>
          </div>
          <fieldset className="mt-4 rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t.account_metaRegion_field_usedFor}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {META_REGION_USES.map((use) => (
                <label
                  key={use}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={draft.usedFor.includes(use)}
                    onChange={() => toggleUse(use)}
                    data-testid={`account-meta-use-${use}`}
                  />
                  <span>{usedForLabel[use]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              data-testid="account-meta-cancel"
            >
              {t.account_action_cancel}
            </Button>
            <Button type="button" onClick={() => void saveDraft()} data-testid="account-meta-save">
              {t.account_action_save}
            </Button>
          </div>
        </AccountSectionCard>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.metaRegions.length === 0 ? (
          <AccountSectionCard title={t.account_metaRegion_empty} testId="account-meta-empty">
            <p className="text-sm text-muted-foreground">{t.account_metaRegion_empty_desc}</p>
          </AccountSectionCard>
        ) : (
          profile.metaRegions.map((m) => (
            <AccountSectionCard key={m.id} title={m.name} testId={`account-meta-${m.id}`}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {m.countries.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[11px]">
                      {c}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs">
                  <span className="text-muted-foreground">{t.account_metaRegion_reason}: </span>
                  <span className="font-medium">{reasonLabel[m.logisticsReason]}</span>
                </p>
                <p className="text-xs">
                  <span className="text-muted-foreground">
                    {t.account_metaRegion_field_currency}:{" "}
                  </span>
                  <span className="font-medium">{m.defaultCurrency}</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {m.usedFor.map((u) => (
                    <Badge key={u} variant="outline" className="text-[10px]">
                      {usedForLabel[u]}
                    </Badge>
                  ))}
                </div>
                {m.notes ? <p className="text-xs text-muted-foreground italic">{m.notes}</p> : null}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(m)}
                    data-testid={`account-meta-edit-${m.id}`}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    {t.account_action_edit}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void deleteRegion(m.id)}
                    aria-label={`${t.account_metaRegion_delete}: ${m.name}`}
                    data-testid={`account-meta-delete-${m.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            </AccountSectionCard>
          ))
        )}
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS ─────────────────────────────────────────────────

const NOTIFICATION_EVENTS: Array<NotificationPreference["events"][number]> = [
  "price_access_approved",
  "new_matching_product",
  "rfq_response",
  "price_movement",
  "document_readiness",
  "country_news",
  "supplier_profile_review",
];

const NOTIFICATION_FREQUENCIES: NotificationPreference["frequency"][] = [
  "instant",
  "daily",
  "weekly",
];

const NotificationsSection = ({
  profile,
  onChange,
}: {
  profile: AccountProfile;
  onChange: (next: AccountProfile) => AccountUpdateResult;
}) => {
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
  const [draft, setDraft] = useState<NotificationPreference | null>(null);
  const [editingChannel, setEditingChannel] = useState<NotificationPreference["channel"] | null>(
    null,
  );
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = (preference: NotificationPreference) => {
    setDraft({ ...preference, events: [...preference.events] });
    setEditingChannel(preference.channel);
    setEventsError(null);
    setSaveError(null);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditingChannel(null);
    setEventsError(null);
    setSaveError(null);
  };

  const toggleEvent = (event: NotificationPreference["events"][number]) => {
    if (!draft) return;
    const events = draft.events.includes(event)
      ? draft.events.filter((e) => e !== event)
      : [...draft.events, event];
    setDraft({ ...draft, events });
    if (events.length) setEventsError(null);
  };

  const saveDraft = async () => {
    if (!draft || !editingChannel) return;
    setSaveError(null);
    if (draft.enabled && draft.events.length === 0) {
      setEventsError(t.account_notif_validation_eventsRequired);
      return;
    }
    const nextNotifications = profile.notifications.map((n) =>
      n.channel === editingChannel
        ? {
            ...draft,
            events: draft.events,
          }
        : n,
    );
    try {
      await onChange({ ...profile, notifications: nextNotifications });
      cancelEdit();
    } catch (error) {
      setSaveError(accountSaveErrorMessage(error, t));
    }
  };

  return (
    <div className="space-y-4" data-testid="account-section-notifications">
      {saveError ? (
        <p
          className="flex items-start gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
          data-testid="account-notif-save-error"
        >
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
          <span>{saveError}</span>
        </p>
      ) : null}
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
            <div className="space-y-3">
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
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(n)}
                  data-testid={`account-notif-edit-${n.channel}`}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {t.account_action_edit}
                </Button>
              </div>
            </div>
          </AccountSectionCard>
        ))}
      </div>
      {draft ? (
        <AccountSectionCard
          title={`${t.account_notif_form_title}: ${channelLabel[draft.channel]}`}
          description={t.account_notif_form_desc}
          testId="account-notif-form"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-foreground">
                    {t.account_notif_field_enabled}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {draft.enabled ? t.account_notif_enabled : t.account_notif_disabled}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                  data-testid="account-notif-enabled"
                />
              </label>
              <FormRow label={t.account_notif_field_frequency}>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.frequency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      frequency: e.target.value as NotificationPreference["frequency"],
                    })
                  }
                  data-testid="account-notif-frequency"
                >
                  {NOTIFICATION_FREQUENCIES.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {freqLabel[frequency]}
                    </option>
                  ))}
                </select>
              </FormRow>
            </div>
            <fieldset
              className="rounded-lg border border-border p-3"
              aria-invalid={!!eventsError || undefined}
              aria-describedby={eventsError ? "account-notif-events-error" : undefined}
            >
              <legend className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.account_notif_eventsLabel}
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {NOTIFICATION_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={draft.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                      data-testid={`account-notif-event-${event}`}
                    />
                    <span>{eventLabel(event)}</span>
                  </label>
                ))}
              </div>
              {eventsError ? (
                <p
                  id="account-notif-events-error"
                  className="mt-2 flex items-start gap-1 text-xs text-destructive"
                  role="alert"
                  data-testid="account-notif-events-error"
                >
                  <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
                  <span>{eventsError}</span>
                </p>
              ) : null}
            </fieldset>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              data-testid="account-notif-cancel"
            >
              {t.account_action_cancel}
            </Button>
            <Button type="button" onClick={() => void saveDraft()} data-testid="account-notif-save">
              {t.account_action_save}
            </Button>
          </div>
        </AccountSectionCard>
      ) : null}
    </div>
  );
};

// ─── ROUTER ────────────────────────────────────────────────────────

const AccountStatusScreen = ({
  kind,
  onRetry,
}: {
  kind: "loading" | "unavailable";
  onRetry?: () => void;
}) => {
  const { t } = useLanguage();
  const isLoading = kind === "loading";

  return (
    <div className="min-h-screen bg-background">
      <Header showSkipLink />
      <main
        id="main"
        className="container flex min-h-[60vh] max-w-2xl items-center py-16"
        data-testid={isLoading ? "account-session-loading" : "account-backend-unavailable"}
      >
        <section className="w-full rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className={
                isLoading
                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive"
              }
              aria-hidden
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                {isLoading ? t.account_loading_title : t.account_unavailable_title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {isLoading ? t.account_loading_body : t.account_unavailable_body}
              </p>
              {!isLoading && onRetry ? (
                <Button type="button" onClick={onRetry} className="mt-2" data-testid="account-backend-retry">
                  <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />
                  {t.account_unavailable_retry}
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const AccountConflictBanner = ({ onReload }: { onReload: () => void }) => {
  const { t } = useLanguage();

  return (
    <section
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm"
      role="alert"
      data-testid="account-save-conflict"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{t.account_conflict_title}</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">{t.account_conflict_body}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 border-amber-300 bg-background text-amber-950 hover:bg-amber-100"
          onClick={onReload}
          data-testid="account-save-conflict-reload"
        >
          <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />
          {t.account_conflict_reload}
        </Button>
      </div>
    </section>
  );
};

const Account = () => {
  const { t } = useLanguage();
  const { section } = useParams<{ section?: string }>();
  const active = useMemo<AccountSectionKey | null>(() => {
    if (!section) return null;
    return (VALID as string[]).includes(section) ? (section as AccountSectionKey) : null;
  }, [section]);

  const apiEnabled = isSelfHostedAuthConfigured();
  const sourceMode: AccountSourceMode = apiEnabled ? "self_hosted" : "local";
  const [profile, setProfile] = useState<AccountProfile | null>(() =>
    apiEnabled ? null : getAccountProfile(),
  );
  const [bootStatus, setBootStatus] = useState<AccountBootStatus>(() =>
    apiEnabled ? "loading" : "ready",
  );
  const [bootRetry, setBootRetry] = useState(0);
  const [saveConflict, setSaveConflict] = useState(false);
  const [authSession, setAuthSession] = useState<AuthRuntimeSession | null>(null);
  const syncVersionRef = useRef(0);
  const accountApiClient = useMemo(
    () =>
      apiEnabled && authSession
        ? createAccountApiClient({
            sessionId: authSession.id,
            userId: authSession.userId,
          })
        : createAccountApiClient(),
    [apiEnabled, authSession],
  );

  useEffect(() => {
    let isMounted = true;
    const localProfile = getAccountProfile();
    const hydrationVersion = syncVersionRef.current;

      if (!apiEnabled) {
        setAuthSession(null);
        setProfile(localProfile);
        setSaveConflict(false);
        setBootStatus("ready");
      return () => {
        isMounted = false;
      };
    }

    setAuthSession(null);
    setProfile(null);
    setBootStatus("loading");

    void (async () => {
      const authResult = await readCurrentAuthSession();
      if (!isMounted || hydrationVersion !== syncVersionRef.current) return;

      if (isAuthRuntimeError(authResult) || !authResult.session) {
        const code = isAuthRuntimeError(authResult) ? authResult.code : "";
        if (code !== "auth_session_required" && code !== "auth_session_invalid") {
          setAuthSession(null);
          setProfile(null);
          setSaveConflict(false);
          setBootStatus("unavailable");
          return;
        }
        buyerSession.signOut();
        setAuthSession(null);
        setSaveConflict(false);
        setBootStatus("auth_required");
        return;
      }

      const client = createAccountApiClient({
        sessionId: authResult.session.id,
        userId: authResult.session.userId,
      });
      const remoteProfile = await hydrateAccountProfileFromApi(localProfile, client);
      if (!isMounted || hydrationVersion !== syncVersionRef.current) return;

      if (!remoteProfile) {
        setAuthSession(authResult.session);
        setProfile(null);
        setSaveConflict(false);
        setBootStatus("unavailable");
        return;
      }

      setAuthSession(authResult.session);
      setProfile(remoteProfile);
      setSaveConflict(false);
      setBootStatus("ready");
    })().catch(() => {
      if (!isMounted) return;
      setAuthSession(null);
      setProfile(null);
      setSaveConflict(false);
      setBootStatus("unavailable");
    });

    return () => {
      isMounted = false;
    };
  }, [apiEnabled, bootRetry]);

  const update = async (next: AccountProfile, options: AccountUpdateOptions = {}) => {
    syncVersionRef.current += 1;
    const syncVersion = syncVersionRef.current;

    if (apiEnabled) {
      if (options.syncRemote === false) {
        setProfile(next);
        return;
      }

      if (!authSession || !options.section) throw new Error(t.account_remoteSaveFailed);
      let remoteProfile: AccountProfile | null;
      try {
        remoteProfile = await syncAccountProfileSectionToApi(
          next,
          profile,
          options.section,
          accountApiClient,
        );
      } catch (error) {
        if (isAccountApiConflictError(error)) {
          setSaveConflict(true);
          throw new Error(t.account_conflict_saveFailed);
        }
        throw error;
      }
      if (!remoteProfile) throw new Error(t.account_remoteSaveFailed);
      if (syncVersion !== syncVersionRef.current) return;
      setProfile(remoteProfile);
      setSaveConflict(false);
      return;
    }

    setProfile(next);
    setSaveConflict(false);
    saveAccountProfile(next);
    if (options.syncRemote === false) return;
    void syncAccountProfileToApi(next).then((remoteProfile) => {
      if (!remoteProfile || syncVersion !== syncVersionRef.current) return;
      setProfile(remoteProfile);
      setSaveConflict(false);
      saveAccountProfile(remoteProfile);
    });
  };

  const reloadAccountData = () => {
    setSaveConflict(false);
    setBootRetry((value) => value + 1);
  };

  if (!active) return <Navigate to="/account/personal" replace />;
  if (bootStatus === "auth_required") return <Navigate to="/signin" replace />;
  if (bootStatus === "loading") return <AccountStatusScreen kind="loading" />;
  if (bootStatus === "unavailable" || !profile) {
    return <AccountStatusScreen kind="unavailable" onRetry={() => setBootRetry((value) => value + 1)} />;
  }

  const updateSection =
    (sectionKey: AccountProfileSectionSyncTarget) =>
    (next: AccountProfile, options: AccountUpdateOptions = {}) =>
      update(next, { ...options, section: sectionKey });

  let content: JSX.Element;
  switch (active) {
    case "personal":
      content = <PersonalSection profile={profile} onChange={updateSection("personal")} />;
      break;
    case "company":
      content = (
        <CompanySection
          profile={profile}
          onChange={updateSection("company")}
          accountApiClient={accountApiClient}
        />
      );
      break;
    case "branches":
      content = <BranchesSection profile={profile} onChange={updateSection("branches")} />;
      break;
    case "products":
      content = <ProductsSection profile={profile} onChange={updateSection("products")} />;
      break;
    case "meta-regions":
      content = <MetaRegionsSection profile={profile} onChange={updateSection("meta-regions")} />;
      break;
    case "notifications":
      content = <NotificationsSection profile={profile} onChange={updateSection("notifications")} />;
      break;
  }

  return (
    <AccountShell active={active} profile={profile} sourceMode={sourceMode}>
      {saveConflict ? <AccountConflictBanner onReload={reloadAccountData} /> : null}
      {content}
    </AccountShell>
  );
};

export default Account;
