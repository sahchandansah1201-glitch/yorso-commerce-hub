/**
 * Contacts start screen: search, filters, dense table on wide screens and
 * compact records at 390px. In-memory only.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Mail, Phone, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTROL, FIELD, ICON_CONTROL } from "./ui";
import {
  CRM_COUNTRY_LABELS,
  CRM_EMPLOYEE_LIST,
  CRM_PAGE_SIZE,
  CRM_PRODUCT_LABELS,
  employeeName,
  formatDate,
  type CrmCompany,
  type CrmContact,
  type CrmEmployee,
  type CrmProductKey,
} from "./data";
import {
  CRM_STAGES,
  crmCopy,
  fillCopy,
  type CrmLang,
  type CrmScenarioKey,
  type CrmStage,
} from "./copy";

export type CrmPerms = { canCreate: boolean; canEdit: boolean; canReachOut: boolean };

/** Copy control with an inline confirmation, no toast provider needed. */
export const CopyValueButton = ({
  value,
  label,
  copiedLabel,
  testId,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  testId: string;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        className={ICON_CONTROL}
        aria-label={label}
        title={label}
        data-testid={testId}
        onClick={() => {
          try {
            void navigator.clipboard?.writeText(value);
          } catch {
            /* Копирование недоступно в этой среде — подтверждение всё равно показываем. */
          }
          setCopied(true);
        }}
      >
        {copied ? (
          <Check aria-hidden className="h-4 w-4 text-success" />
        ) : (
          <Copy aria-hidden className="h-4 w-4" />
        )}
      </Button>
      {copied ? (
        <span className="text-xs text-success" role="status">
          {copiedLabel}
        </span>
      ) : null}
    </span>
  );
};

const StatePanel = ({
  title,
  body,
  testId,
  children,
}: {
  title: string;
  body: string;
  testId: string;
  children?: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-card p-4" data-testid={testId}>
    <h3 className="font-heading text-base font-semibold">{title}</h3>
    <p className="mt-1 max-w-prose text-sm text-muted-foreground">{body}</p>
    {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
  </div>
);

export const ContactsList = ({
  lang,
  scenario,
  perms,
  contacts,
  companies,
  extraEmployees,
  onOpen,
  onCreate,
  onRetry,
}: {
  lang: CrmLang;
  scenario: CrmScenarioKey;
  perms: CrmPerms;
  contacts: CrmContact[];
  companies: CrmCompany[];
  extraEmployees: CrmEmployee[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onRetry: () => void;
}) => {
  const t = crmCopy[lang];
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [country, setCountry] = useState("");
  const [product, setProduct] = useState("");
  const [page, setPage] = useState(1);
  // Повторная попытка сохраняет запрос и фильтры пользователя.
  const keepQueryRef = useRef(false);

  // Сценарий страницы задаёт исходные значения поиска и фильтров.
  useEffect(() => {
    if (keepQueryRef.current) {
      keepQueryRef.current = false;
      return;
    }
    setPage(1);
    if (scenario === "activeFilters") {
      setQuery("");
      setOwner("");
      setStage("Negotiation");
      setCountry("");
      setProduct("tuna");
      return;
    }
    if (scenario === "emptySearch") {
      setQuery("qqqqq");
      setOwner("");
      setStage("Qualified");
      setCountry("");
      setProduct("");
      return;
    }
    setQuery("");
    setOwner("");
    setStage("");
    setCountry("");
    setProduct("");
  }, [scenario]);

  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies],
  );

  const filtered = useMemo(() => {
    if (scenario === "emptyBase") return [];
    const q = query.trim().toLowerCase();
    return contacts
      .filter((c) => !c.deleted)
      .filter((c) => (scenario === "inactive" ? !c.active : c.active || scenario === "ready"))
      .filter((c) => {
        const company = companyById.get(c.companyId);
        if (owner && c.ownerId !== owner) return false;
        if (stage && c.stage !== stage) return false;
        if (country && company?.country !== country) return false;
        if (product && !company?.products.includes(product as CrmProductKey)) return false;
        if (!q) return true;
        const haystack = [
          c.firstName,
          c.lastName,
          c.jobTitle ?? "",
          c.email ?? "",
          c.phone ?? "",
          company?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1));
  }, [contacts, companyById, query, owner, stage, country, product, scenario]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / CRM_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * CRM_PAGE_SIZE, safePage * CRM_PAGE_SIZE);

  const activeFilterChips = [
    owner ? `${t.f_owner}: ${employeeName(owner, extraEmployees)}` : null,
    stage ? `${t.f_stage}: ${stage}` : null,
    country ? `${t.f_country}: ${CRM_COUNTRY_LABELS[country as keyof typeof CRM_COUNTRY_LABELS][lang]}` : null,
    product ? `${t.f_product}: ${CRM_PRODUCT_LABELS[product as CrmProductKey][lang]}` : null,
  ].filter(Boolean) as string[];

  const resetFilters = () => {
    setOwner("");
    setStage("");
    setCountry("");
    setProduct("");
    setPage(1);
  };

  const countryKeys = useMemo(
    () => Array.from(new Set(companies.map((c) => c.country))),
    [companies],
  );

  const quickActions = (contact: CrmContact, suffix = "") => (
    <span className="inline-flex flex-wrap items-center gap-1">
      {perms.canReachOut && contact.phone ? (
        <a
          href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
          aria-label={`${t.act_call}: ${contact.firstName} ${contact.lastName}`}
          title={t.act_call}
          data-testid={`crm-call-${contact.id}${suffix}`}
          className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-md border border-input text-foreground hover:bg-accent"
        >
          <Phone aria-hidden className="h-4 w-4" />
        </a>
      ) : null}
      {perms.canReachOut && contact.email ? (
        <a
          href={`mailto:${contact.email}`}
          aria-label={`${t.act_email}: ${contact.firstName} ${contact.lastName}`}
          title={t.act_email}
          data-testid={`crm-mail-${contact.id}${suffix}`}
          className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-md border border-input text-foreground hover:bg-accent"
        >
          <Mail aria-hidden className="h-4 w-4" />
        </a>
      ) : null}
    </span>
  );

  const channels = (contact: CrmContact, suffix = "") => (
    <div className="min-w-0 space-y-1">
      {contact.email ? (
        <div className="flex min-w-0 items-center gap-1">
          <span className="min-w-0 break-all text-sm">{contact.email}</span>
          <CopyValueButton
            value={contact.email}
            label={`${t.act_copy_email}: ${contact.email}`}
            copiedLabel={t.act_copied}
            testId={`crm-copy-email-${contact.id}${suffix}`}
          />
        </div>
      ) : null}
      {contact.phone ? (
        <div className="flex min-w-0 items-center gap-1">
          <span className="min-w-0 break-all text-sm">{contact.phone}</span>
          <CopyValueButton
            value={contact.phone}
            label={`${t.act_copy_phone}: ${contact.phone}`}
            copiedLabel={t.act_copied}
            testId={`crm-copy-phone-${contact.id}${suffix}`}
          />
        </div>
      ) : null}
    </div>
  );

  const nameCell = (contact: CrmContact, suffix = "") => (
    <div className="min-w-0">
      <Button
        type="button"
        variant="link"
        className={`h-auto justify-start whitespace-normal break-words p-0 text-left text-sm font-medium ${
          suffix ? "min-h-[44px]" : "min-h-0"
        }`}
        onClick={() => onOpen(contact.id)}
        title={t.act_open}
        data-testid={`crm-open-${contact.id}${suffix}`}
      >
        {contact.firstName} {contact.lastName}
      </Button>
      {contact.jobTitle ? (
        <p className="mt-0.5 break-words text-xs text-muted-foreground">{contact.jobTitle}</p>
      ) : null}
      {!contact.active ? (
        <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          {t.badge_inactive}
        </p>
      ) : null}
    </div>
  );

  if (scenario === "denied") {
    return <StatePanel title={t.st_denied_title} body={t.st_denied_body} testId="crm-denied" />;
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold lg:text-2xl">{t.list_title}</h2>
          <p className="text-xs text-muted-foreground" data-testid="crm-count">
            {fillCopy(t.list_count, { n: String(filtered.length) })}
          </p>
        </div>
        {perms.canCreate ? (
          <Button className={CONTROL} onClick={onCreate} data-testid="crm-create-open">
            {t.list_create}
          </Button>
        ) : (
          <span
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
            data-testid="crm-view-only-badge"
          >
            {t.badge_viewOnly}
          </span>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-3">
        <div className="min-w-0">
          <label htmlFor="crm-search" className="text-xs font-medium">
            {t.list_search}
          </label>
          <Input
            id="crm-search"
            value={query}
            placeholder={t.list_searchPlaceholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-[44px]"
            data-testid="crm-search"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor="crm-filter-owner" className="text-xs font-medium">
              {t.f_owner}
            </label>
            <select
              id="crm-filter-owner"
              className={`${FIELD} mt-1`}
              value={owner}
              onChange={(e) => {
                setOwner(e.target.value);
                setPage(1);
              }}
              data-testid="crm-filter-owner"
            >
              <option value="">{t.f_any}</option>
              {[...CRM_EMPLOYEE_LIST, ...extraEmployees].map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="crm-filter-stage" className="text-xs font-medium">
              {t.f_stage}
            </label>
            <select
              id="crm-filter-stage"
              className={`${FIELD} mt-1`}
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                setPage(1);
              }}
              data-testid="crm-filter-stage"
            >
              <option value="">{t.f_any}</option>
              {CRM_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="crm-filter-country" className="text-xs font-medium">
              {t.f_country}
            </label>
            <select
              id="crm-filter-country"
              className={`${FIELD} mt-1`}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              data-testid="crm-filter-country"
            >
              <option value="">{t.f_any}</option>
              {countryKeys.map((code) => (
                <option key={code} value={code}>
                  {CRM_COUNTRY_LABELS[code][lang]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="crm-filter-product" className="text-xs font-medium">
              {t.f_product}
            </label>
            <select
              id="crm-filter-product"
              className={`${FIELD} mt-1`}
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
                setPage(1);
              }}
              data-testid="crm-filter-product"
            >
              <option value="">{t.f_any}</option>
              {(Object.keys(CRM_PRODUCT_LABELS) as CrmProductKey[]).map((key) => (
                <option key={key} value={key}>
                  {CRM_PRODUCT_LABELS[key][lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFilterChips.length ? (
          <div className="flex flex-wrap items-center gap-2" data-testid="crm-active-filters">
            <span className="text-xs font-medium text-muted-foreground">{t.f_active}:</span>
            {activeFilterChips.map((chip) => (
              <span
                key={chip}
                className="rounded-md border border-border px-2 py-1 text-xs text-foreground"
              >
                {chip}
              </span>
            ))}
            <Button
              variant="outline"
              className={CONTROL}
              onClick={resetFilters}
              data-testid="crm-reset-filters"
            >
              {t.f_reset}
            </Button>
          </div>
        ) : null}
      </div>

      {scenario === "loading" ? (
        <div className="space-y-2" data-testid="crm-loading" aria-label={t.st_loading}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : scenario === "unavailable" ? (
        <StatePanel
          title={t.st_unavailable_title}
          body={t.st_unavailable_body}
          testId="crm-unavailable"
        >
          <Button variant="outline" className={CONTROL} onClick={() => {
              keepQueryRef.current = true;
              onRetry();
            }}
            data-testid="crm-retry">
            <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
            {t.st_retry}
          </Button>
        </StatePanel>
      ) : filtered.length === 0 ? (
        query.trim() || activeFilterChips.length ? (
          <StatePanel
            title={t.st_emptySearch_title}
            body={t.st_emptySearch_body}
            testId="crm-empty-search"
          />
        ) : (
          <StatePanel title={t.st_empty_title} body={t.st_empty_body} testId="crm-empty" />
        )
      ) : (
        <>
          {/* Wide screens: semantic table. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
            <table className="w-full table-fixed border-collapse text-sm" data-testid="crm-table">
              <caption className="sr-only">{t.list_title}</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th scope="col" className="w-[18%] px-3 py-2 font-medium">{t.col_name}</th>
                  <th scope="col" className="w-[22%] px-3 py-2 font-medium">{t.col_contacts}</th>
                  <th scope="col" className="w-[18%] px-3 py-2 font-medium">{t.col_company}</th>
                  <th scope="col" className="w-[12%] px-3 py-2 font-medium">{t.col_stage}</th>
                  <th scope="col" className="w-[12%] px-3 py-2 font-medium">{t.col_owner}</th>
                  <th scope="col" className="w-[10%] px-3 py-2 font-medium">{t.col_activity}</th>
                  <th scope="col" className="w-[8%] px-3 py-2 font-medium">{t.col_actions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((contact) => {
                  const company = companyById.get(contact.companyId);
                  return (
                    <tr
                      key={contact.id}
                      className="border-b border-border/60 align-top"
                      data-testid={`crm-row-${contact.id}`}
                    >
                      <td className="px-3 py-2">{nameCell(contact)}</td>
                      <td className="px-3 py-2">{channels(contact)}</td>
                      <td className="px-3 py-2">
                        <p className="break-words">{company?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {company ? CRM_COUNTRY_LABELS[company.country][lang] : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2">{contact.stage}</td>
                      <td className="px-3 py-2 break-words">
                        {employeeName(contact.ownerId, extraEmployees)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(contact.lastActivityAt, lang)}
                      </td>
                      <td className="px-3 py-2">{quickActions(contact)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 390px: compact records. */}
          <ul className="space-y-2 lg:hidden" data-testid="crm-cards">
            {rows.map((contact) => {
              const company = companyById.get(contact.companyId);
              return (
                <li
                  key={contact.id}
                  className="min-w-0 rounded-lg border border-border bg-card p-3"
                  data-testid={`crm-card-${contact.id}`}
                >
                  {nameCell(contact, "-card")}
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {company?.name}
                    {company ? ` · ${CRM_COUNTRY_LABELS[company.country][lang]}` : ""}
                  </p>
                  <div className="mt-2">{channels(contact, "-card")}</div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{t.col_stage}</dt>
                      <dd className="break-words">{contact.stage}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{t.col_owner}</dt>
                      <dd className="break-words">
                        {employeeName(contact.ownerId, extraEmployees)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{t.col_activity}</dt>
                      <dd>{formatDate(contact.lastActivityAt, lang)}</dd>
                    </div>
                  </dl>
                  <div className="mt-2">{quickActions(contact, "-card")}</div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground" data-testid="crm-page-label">
              {fillCopy(t.pg_page, { n: String(safePage), m: String(pageCount) })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={CONTROL}
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                data-testid="crm-prev"
              >
                {t.pg_prev}
              </Button>
              <Button
                variant="outline"
                className={CONTROL}
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
                data-testid="crm-next"
              >
                {t.pg_next}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export type { CrmStage };
