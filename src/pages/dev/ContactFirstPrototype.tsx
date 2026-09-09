/**
 * Isolated contact-first customer-work interface stage.
 *
 * Runs above every provider on one hidden route. Everything here lives in
 * component memory: no storage, no network, no backend, no real client data.
 */
import { useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTROL, FIELD, ICON_CONTROL } from "./crm-contact-first/ui";
import { ContactsList, type CrmPerms } from "./crm-contact-first/ContactsList";
import { ContactRecord } from "./crm-contact-first/ContactRecord";
import {
  CreateClientDialog,
  type CreateClientValues,
} from "./crm-contact-first/CreateClientDialog";
import {
  CRM_COMPANIES,
  CRM_CONTACTS,
  CRM_EMPLOYEES,
  type CrmCompany,
  type CrmContact,
  type CrmEmployee,
} from "./crm-contact-first/data";
import {
  CRM_LANGS,
  CRM_ROLES,
  CRM_SCENARIOS,
  crmCopy,
  type CrmLang,
  type CrmRoleKey,
  type CrmScenarioKey,
} from "./crm-contact-first/copy";

type NavKey = "contacts" | "deals" | "tasks" | "companies";

const permsFor = (role: CrmRoleKey, scenario: CrmScenarioKey): CrmPerms => {
  const readOnly = role === "observer" || scenario === "viewOnly";
  if (readOnly) return { canCreate: false, canEdit: false, canReachOut: false };
  return { canCreate: true, canEdit: true, canReachOut: true };
};

export const ContactFirstPrototype = () => {
  const [lang, setLang] = useState<CrmLang>("ru");
  const [dark, setDark] = useState(false);
  const [role, setRole] = useState<CrmRoleKey>("owner");
  const [scenario, setScenario] = useState<CrmScenarioKey>("ready");
  const [nav, setNav] = useState<NavKey>("contacts");
  const [contacts, setContacts] = useState<CrmContact[]>(CRM_CONTACTS);
  const [companies, setCompanies] = useState<CrmCompany[]>(CRM_COMPANIES);
  const [extraEmployees] = useState<CrmEmployee[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const t = crmCopy[lang];
  const employee = CRM_EMPLOYEES[role];
  const perms = permsFor(role, scenario);

  // Видимость записей зависит только от выбранной роли просмотра.
  const visible = useMemo(() => {
    if (role === "limitedManager") return contacts.filter((c) => c.ownerId === employee.id);
    return contacts;
  }, [contacts, role, employee]);

  const openContact = visible.find((c) => c.id === openId) ?? null;

  // Организации-клиенты доступны всем сотрудникам рабочего пространства.
  const selectableCompanies = companies;


  const roleLabel = (key: CrmRoleKey) =>
    key === "owner"
      ? t.role_owner
      : key === "admin"
        ? t.role_admin
        : key === "manager"
          ? t.role_manager
          : key === "limitedManager"
            ? t.role_limitedManager
            : t.role_observer;

  const scenarioLabel = (key: CrmScenarioKey) =>
    ({
      loading: t.scn_loading,
      ready: t.scn_ready,
      activeFilters: t.scn_activeFilters,
      emptySearch: t.scn_emptySearch,
      emptyBase: t.scn_emptyBase,
      unavailable: t.scn_unavailable,
      denied: t.scn_denied,
      viewOnly: t.scn_viewOnly,
      inactive: t.scn_inactive,
    })[key];

  const navItems: { key: NavKey; label: string; available: boolean }[] = [
    { key: "contacts", label: t.nav_contacts, available: true },
    { key: "deals", label: t.nav_deals, available: false },
    { key: "tasks", label: t.nav_tasks, available: false },
    { key: "companies", label: t.nav_companies, available: false },
  ];

  const createClient = (values: CreateClientValues) => {
    const now = new Date().toISOString();
    let companyId = values.companyId;
    if (companyId === "__new") {
      companyId = `new-${companies.length + 1}`;
      setCompanies((prev) => [
        ...prev,
        {
          id: companyId,
          name: values.newCompanyName.trim(),
          country: values.newCompanyCountry,
          products: [],
        },
      ]);
    }
    const id = `new-c-${contacts.length + 1}`;
    const contact: CrmContact = {
      id,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email || undefined,
      phone: values.phone || undefined,
      companyId,
      stage: values.stage,
      ownerId: employee.id,
      teamId: employee.teamId,
      language: values.language,
      tags: [],
      lastActivityAt: now,
      createdAt: now,
      active: true,
      deleted: false,
      activity: [
        { id: `${id}-a1`, type: "created", at: now },
        { id: `${id}-a2`, type: "stage", at: now, stage: values.stage },
      ],
      tasks: [],
      notes: [],
    };
    setContacts((prev) => [contact, ...prev]);
    setCreateOpen(false);
    setOpenId(id);
  };

  const updateOpen = (updater: (c: CrmContact) => CrmContact) => {
    if (!openId) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === openId ? { ...updater(c), lastActivityAt: new Date().toISOString() } : c)),
    );
  };

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="min-h-screen min-w-0 bg-background text-foreground">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
            <p className="font-heading text-lg font-semibold tracking-tight">YORSO</p>
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">{t.proto_note}</p>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="crm-lang" className="sr-only">
                {t.proto_lang}
              </label>
              <select
                id="crm-lang"
                className={`${FIELD} w-auto`}
                value={lang}
                onChange={(e) => setLang(e.target.value as CrmLang)}
                aria-label={t.proto_lang}
                data-testid="crm-lang"
              >
                {CRM_LANGS.map((code) => (
                  <option key={code} value={code}>
                    {code === "ru" ? t.lang_ru : code === "en" ? t.lang_en : t.lang_es}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                className={ICON_CONTROL}
                aria-label={dark ? t.proto_theme_light : t.proto_theme_dark}
                title={dark ? t.proto_theme_light : t.proto_theme_dark}
                onClick={() => setDark((prev) => !prev)}
                data-testid="crm-theme"
              >
                {dark ? (
                  <Sun aria-hidden className="h-4 w-4" />
                ) : (
                  <Moon aria-hidden className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end gap-3 border-t border-border/60 px-4 py-3">
            <div className="min-w-0">
              <label htmlFor="crm-role" className="text-xs font-medium">
                {t.proto_role}
              </label>
              <select
                id="crm-role"
                className={`${FIELD} mt-1 w-auto`}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as CrmRoleKey);
                  setOpenId(null);
                }}
                data-testid="crm-role"
              >
                {CRM_ROLES.map((key) => (
                  <option key={key} value={key}>
                    {roleLabel(key)}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="crm-scenario" className="text-xs font-medium">
                {t.proto_scenario}
              </label>
              <select
                id="crm-scenario"
                className={`${FIELD} mt-1 w-auto`}
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value as CrmScenarioKey);
                  setOpenId(null);
                }}
                data-testid="crm-scenario"
              >
                {CRM_SCENARIOS.map((key) => (
                  <option key={key} value={key}>
                    {scenarioLabel(key)}
                  </option>
                ))}
              </select>
            </div>
            <p className="min-w-0 text-xs text-muted-foreground" data-testid="crm-current-employee">
              {employee.name}
            </p>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-4 px-4 py-4 lg:flex-row">
          <nav aria-label={t.nav_contacts} className="min-w-0 lg:w-56 lg:shrink-0">
            <ul className="flex flex-wrap gap-2 lg:flex-col">
              {navItems.map((item) => (
                <li key={item.key} className="min-w-0">
                  <Button
                    variant={nav === item.key ? "secondary" : "ghost"}
                    className={`${CONTROL} w-full justify-start`}
                    aria-current={nav === item.key ? "page" : undefined}
                    onClick={() => {
                      setNav(item.key);
                      setOpenId(null);
                    }}
                    data-testid={`crm-nav-${item.key}`}
                  >
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0 flex-1">
            {nav !== "contacts" ? (
              <div
                className="rounded-lg border border-border bg-card p-4"
                data-testid="crm-nav-unavailable"
              >
                <h2 className="font-heading text-lg font-semibold">
                  {navItems.find((i) => i.key === nav)?.label}
                </h2>
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">{t.nav_soon}</p>
              </div>
            ) : openContact ? (
              <ContactRecord
                lang={lang}
                contact={openContact}
                company={companies.find((c) => c.id === openContact.companyId)}
                perms={perms}
                extraEmployees={extraEmployees}
                onBack={() => setOpenId(null)}
                onChange={updateOpen}
              />
            ) : (
              <ContactsList
                lang={lang}
                scenario={scenario}
                perms={perms}
                contacts={visible}
                companies={companies}
                extraEmployees={extraEmployees}
                onOpen={setOpenId}
                onCreate={() => setCreateOpen(true)}
                onRetry={() => setScenario("ready")}
              />
            )}
          </main>
        </div>

        <CreateClientDialog
          lang={lang}
          open={createOpen && perms.canCreate}
          companies={selectableCompanies}
          ownerName={employee.name}
          onClose={() => setCreateOpen(false)}
          onCreate={createClient}
        />
      </div>
    </div>
  );
};

export default ContactFirstPrototype;
