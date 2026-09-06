/**
 * Approval prototype surface — hidden from the user navigation, wired at
 * /dev/customer-workspace.
 *
 * Implemented packages: P0 shell and state library, P1 service review,
 * P2 employees and access, P3 company products, P4 customer work.
 * P5-P7 are NOT implemented here.
 *
 * No backend, no network requests, no storage reads or writes, no new
 * dependencies. All data is deterministic module memory.
 */
import { useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronRight, Loader2, Lock, Moon, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROTO_LANGS,
  PROTO_ROLES,
  PROTO_SECTIONS,
  PROTO_STATES,
  protoCopy,
  type ProtoLang,
  type ProtoRoleKey,
  type ProtoSectionKey,
  type ProtoStateKey,
} from "./customer-workspace/copy";
import { PROTO_COMPANY, PROTO_UPDATED_AT } from "./customer-workspace/data";
import { ServiceReview } from "./customer-workspace/ServiceReview";
import { EmployeesSection } from "./customer-workspace/EmployeesSection";
import { SELF_RECORDS } from "./customer-workspace/data-access";
import { ProductsSection } from "./customer-workspace/ProductsSection";
import { protoProductsCopy } from "./customer-workspace/copy-p3";
import {
  CustomerWorkSection,
  isP4Section,
} from "./customer-workspace/CustomerWorkSection";
import { P4_SCENARIOS, protoP4Copy, type P4Scenario } from "./customer-workspace/copy-p4";
import { AccessClosedScreen, SignInScreen, type SignInStage } from "./customer-workspace/AccessGate";
import { protoAccessCopy } from "./customer-workspace/copy-access";
import { CONTROL, ICON_CONTROL } from "./customer-workspace/ui";

// Состояния, содержащие изменяющие действия.
const MUTATING_STATES: ProtoStateKey[] = [
  "conflict",
  "validating",
  "saving",
  "success",
  "destructive",
];

// Состояния, осмысленные только в разделах работы с клиентами.
const CUSTOMER_WORK_STATES: ProtoStateKey[] = ["emptySearch", "validating"];

const StatePanel = ({
  title,
  body,
  tone = "neutral",
  children,
  testId,
}: {
  title: string;
  body: string;
  tone?: "neutral" | "muted" | "destructive";
  children?: React.ReactNode;
  testId: string;
}) => (
  <div
    data-testid={testId}
    className={[
      "rounded-lg border p-4 sm:p-5",
      tone === "destructive"
        ? "border-destructive/40 bg-destructive/5"
        : tone === "muted"
          ? "border-border bg-muted/40"
          : "border-border bg-card",
    ].join(" ")}
  >
    <h3 className="font-heading text-base font-semibold">{title}</h3>
    <p className="mt-1 max-w-prose text-sm text-muted-foreground">{body}</p>
    {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
  </div>
);

const CustomerWorkspacePrototype = () => {
  const [lang, setLang] = useState<ProtoLang>("ru");
  const [dark, setDark] = useState(false);
  const [section, setSection] = useState<ProtoSectionKey>("products");
  const [role, setRole] = useState<ProtoRoleKey>("owner");
  // Личность текущего сотрудника хранится отдельно от его роли.
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>(
    SELF_RECORDS.owner.id,
  );
  // Ручной выбор роли — переключатель тестового пользователя: он сбрасывает
  // локальную модель сотрудников к исходному набору. Передача владения — нет.
  const [employeesRevision, setEmployeesRevision] = useState(0);
  const [state, setState] = useState<ProtoStateKey>("ready");
  const [scenario, setScenario] = useState<P4Scenario>("view");
  const [editingProducts, setEditingProducts] = useState(false);
  const [signInStage, setSignInStage] = useState<SignInStage>("signedOut");
  const [requestedSection, setRequestedSection] = useState<ProtoSectionKey>("employees");

  const c = protoCopy[lang];
  const p6 = protoP6Copy[lang];
  const a = protoAccessCopy[lang];

  const p = protoProductsCopy[lang];
  const p4 = protoP4Copy[lang];
  const company = PROTO_COMPANY;
  const canEdit = role === "owner" || role === "admin";

  const isService = role === "service";
  const isCustomerWork = isP4Section(section);

  // Продукция: утверждённая матрица — изменяющие действия у Владельца
  // и Администратора. Работа с клиентами: право задаётся только сценарием
  // доступа и никогда не зависит от роли.
  const canMutate = isCustomerWork
    ? scenario === "createEdit"
    : (section === "products" || section === "employees") && canEdit;

  const availableStates = useMemo<ProtoStateKey[]>(() => {
    if (role === "service") return ["ready"];
    return PROTO_STATES.filter((key) => {
      if (!canMutate && MUTATING_STATES.includes(key)) return false;
      if (CUSTOMER_WORK_STATES.includes(key) && !isCustomerWork) return false;
      if (key === "destructive" && isCustomerWork) return false;
      // В разделах работы с клиентами просмотр и отсутствие доступа задаёт
      // только сценарий доступа, поэтому состояние не может ему противоречить.
      if (isCustomerWork && (key === "viewOnly" || key === "denied")) return false;
      return true;
    });
  }, [canMutate, isCustomerWork, role]);

  const stateAllowed = availableStates.includes(state);
  const effectiveState = stateAllowed ? state : "ready";

  useEffect(() => {
    if (!stateAllowed) setState("ready");
  }, [stateAllowed]);

  // Понижение роли или уход из готового состояния немедленно закрывает форму.
  useEffect(() => {
    if (!canEdit || effectiveState !== "ready") setEditingProducts(false);
  }, [canEdit, effectiveState]);

  const isGate = !isService && (effectiveState === "revoked" || effectiveState === "signedOut");
  // Служебная роль и закрытый доступ не показывают ни указатель компании,
  // ни пользовательскую навигацию, ни содержимое записей.
  const hideCustomerChrome = isService || isGate;

  const productsPrimaryAvailable =
    section === "products" && canEdit && effectiveState === "ready" && !editingProducts;
  const productsReadOnly = section === "products" && !canEdit;

  const renderRecords = () => {
    if (section === "products") {
      return (
        <ProductsSection
          lang={lang}
          canEdit={canEdit && effectiveState === "ready"}
          editing={editingProducts}
          onCloseEdit={() => setEditingProducts(false)}
        />
      );
    }

    if (section === "employees") {
      return (
        <EmployeesSection
          key={`employees-${employeesRevision}`}
          lang={lang}
          role={role === "service" ? "viewer" : role}
          currentEmployeeId={currentEmployeeId}
          canMutate={effectiveState === "ready"}
          // Меняется только роль текущего сотрудника: личность сохраняется.
          onOwnershipTransferred={() => setRole("admin")}
          onLeftCompany={() => setState("revoked")}
        />
      );
    }

    return (
      <div className="space-y-4">
        <PilotNotice lang={lang} resetKey={`${role}-${scenario}-${effectiveState}`} />
        <div className="rounded-lg border border-border bg-card p-4" data-testid="proto-overview">
          <h3 className="font-heading text-base font-semibold">{c.overviewHeading}</h3>
          <ul className="mt-2 space-y-1.5">
            {c.overviewItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <ChevronRight aria-hidden className="mt-0.5 h-4 w-4 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

  };

  const renderBody = () => {
    switch (effectiveState) {
      case "loading":
        return (
          <div
            className="space-y-2"
            data-testid="proto-state-loading"
            aria-label={c.loadingLabel}
            aria-busy="true"
          >
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-5/6" />
            <Skeleton className="h-11 w-2/3" />
          </div>
        );
      case "empty":
        return (
          <StatePanel
            testId="proto-state-empty"
            title={section === "products" ? p.emptyTitle : c.emptyTitle}
            body={section === "products" ? p.emptyBody : c.emptyBody}
            tone="muted"
          />
        );
      case "denied":
        return (
          <StatePanel
            testId="proto-state-denied"
            title={section === "products" ? p.noCompanyTitle : c.deniedTitle}
            body={section === "products" ? p.noCompanyBody : c.deniedBody}
            tone="muted"
          />
        );
      case "unavailable":
        return (
          <StatePanel
            testId="proto-state-unavailable"
            title={c.unavailableTitle}
            body={p6.customerUnavailable}

            tone="muted"
          >
            <Button
              variant="outline"
              className={CONTROL}
              onClick={() => setState("ready")}
              data-testid="proto-unavailable-retry"
            >
              <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
              {c.retry}
            </Button>
            <Button
              variant="ghost"
              className={CONTROL}
              onClick={() => {
                setSection("overview");
                setState("ready");
              }}
              data-testid="proto-unavailable-back"
            >
              {a.backLabel}
            </Button>
          </StatePanel>
        );
      case "conflict":
        return (
          <StatePanel testId="proto-state-conflict" title={c.conflictTitle} body={c.conflictBody}>
            <Button className={CONTROL} onClick={() => setState("success")}>{c.keepMine}</Button>
            <Button variant="outline" className={CONTROL} onClick={() => setState("success")}>
              {c.keepTheirs}
            </Button>
          </StatePanel>
        );
      case "saving":
        return (
          <div
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm"
            data-testid="proto-state-saving"
            aria-busy="true"
          >
            <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
            <span>{c.savingLabel}</span>
          </div>
        );
      case "success":
        return (
          <div className="space-y-3">
            <div
              className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-4"
              data-testid="proto-state-success"
              role="status"
            >
              <Check aria-hidden className="mt-0.5 h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">{c.successTitle}</p>
                <p className="text-xs text-muted-foreground">{c.successBody}</p>
              </div>
            </div>
            {renderRecords()}
          </div>
        );
      case "viewOnly":
        return (
          <div className="space-y-3">
            <div
              className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3"
              data-testid="proto-state-view-only"
            >
              <Lock aria-hidden className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{c.viewOnlyTitle}</p>
                <p className="text-xs text-muted-foreground">{c.viewOnlyBody}</p>
              </div>
            </div>
            {renderRecords()}
          </div>
        );
      default:
        return renderRecords();
    }
  };

  const sectionTitle = section === "products" ? p.pageTitle : c.sections[section];
  const sectionHint = section === "products" ? p.hint : c.sectionHints[section];

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Shared YORSO shell header */}
        <header className="border-b border-border bg-card">
          <div className="container flex min-w-0 flex-wrap items-center gap-2 py-3">
            <span className="font-heading text-lg font-bold">{c.brand}</span>

            <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
              {hideCustomerChrome ? null : (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
                  data-testid="proto-current-company"
                >
                  <Building2 aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-[10.5px] uppercase text-muted-foreground">
                      {c.currentCompany}
                    </span>
                    <span className="block truncate text-sm font-medium">
                      {company.name} · {company.countryLabel[lang]}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1" role="group" aria-label={c.language}>
                {PROTO_LANGS.map((code) => (
                  <Button
                    key={code}
                    variant={lang === code ? "default" : "outline"}
                    className={`${ICON_CONTROL} text-xs uppercase`}
                    aria-pressed={lang === code}
                    onClick={() => setLang(code)}
                    data-testid={`proto-lang-${code}`}
                  >
                    {code}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                className={ICON_CONTROL}
                aria-pressed={dark}
                aria-label={dark ? c.themeLight : c.themeDark}
                onClick={() => setDark((v) => !v)}
                data-testid="proto-theme-toggle"
              >
                {dark ? <Sun aria-hidden className="h-4 w-4" /> : <Moon aria-hidden className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Compact scenario strip: role, access scenario and state */}
        <div className="border-b border-border bg-muted/40">
          <div className="container flex min-w-0 flex-wrap items-center gap-2 py-2">
            <label className="text-xs text-muted-foreground" htmlFor="proto-role">{c.role}</label>
            <Select
              value={role}
              onValueChange={(v) => {
                const next = v as ProtoRoleKey;
                setRole(next);
                // Ручной выбор роли выбирает заранее заданного сотрудника
                // этой роли; передача владения личность не меняет.
                if (next !== "service") setCurrentEmployeeId(SELF_RECORDS[next].id);
                setEmployeesRevision((r) => r + 1);
              }}
            >
              <SelectTrigger id="proto-role" className={`${CONTROL} w-[220px]`} data-testid="proto-role-switch">
                <SelectValue aria-label={c.role} />
              </SelectTrigger>
              <SelectContent>
                {PROTO_ROLES.map((key) => (
                  <SelectItem key={key} value={key}>{c.roles[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isService ? null : (
              <>
                {isCustomerWork ? (
                  <>
                    <label className="text-xs text-muted-foreground" htmlFor="proto-scenario">
                      {p4.scenarioLabel}
                    </label>
                    <Select value={scenario} onValueChange={(v) => setScenario(v as P4Scenario)}>
                      <SelectTrigger
                        id="proto-scenario"
                        className={`${CONTROL} w-[280px]`}
                        data-testid="proto-scenario-switch"
                      >
                        <SelectValue aria-label={p4.scenarioLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        {P4_SCENARIOS.map((key) => (
                          <SelectItem key={key} value={key}>{p4.scenarios[key]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : null}

                <label className="text-xs text-muted-foreground" htmlFor="proto-state">{c.scenario}</label>
                <Select
                  value={effectiveState}
                  onValueChange={(v) => {
                    const next = v as ProtoStateKey;
                    // Safe return: remember where the user was before the session ended.
                    if (next === "signedOut") {
                      setRequestedSection(section);
                      setSignInStage("signedOut");
                    }
                    setState(next);
                  }}
                >
                  <SelectTrigger id="proto-state" className={`${CONTROL} w-[260px]`} data-testid="proto-state-switch">
                    <SelectValue aria-label={c.scenario} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStates.map((key) => (
                      <SelectItem key={key} value={key}>{c.states[key]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <p className="min-w-0 text-xs text-muted-foreground">{c.prototypeNotice}</p>
            {isCustomerWork && !isService ? (
              <p className="min-w-0 text-xs text-muted-foreground" data-testid="proto-scenario-notice">
                {p4.scenarioNotice}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={`container grid min-w-0 gap-6 py-5 ${
            hideCustomerChrome ? "" : "lg:grid-cols-[220px_minmax(0,1fr)]"
          }`}
        >
          {/* Workspace navigation */}
          {hideCustomerChrome ? null : (
            <nav aria-label={c.workspaceRoot} className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                {c.workspaceRoot}
              </p>
              <ul className="flex min-w-0 flex-wrap gap-1.5 lg:flex-col" data-testid="proto-nav">
                {PROTO_SECTIONS.map((key) => (
                  <li key={key} className="min-w-0">
                    <Button
                      variant={section === key ? "secondary" : "ghost"}
                      aria-current={section === key ? "page" : undefined}
                      className={`${CONTROL} justify-start ${section === key ? "font-semibold" : ""} lg:w-full`}
                      onClick={() => setSection(key)}
                      data-testid={`proto-nav-${key}`}
                    >
                      {c.sections[key]}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Section surface */}
          <main className="min-w-0 space-y-4">
            {isService ? (
              <ServiceReview lang={lang} />
            ) : isGate ? (
              effectiveState === "revoked" ? (
                <AccessClosedScreen
                  lang={lang}
                  onReturnToSignIn={() => {
                    setRequestedSection("employees");
                    setSignInStage("signedOut");
                    setState("signedOut");
                  }}
                />
              ) : (
                <SignInScreen
                  lang={lang}
                  stage={signInStage}
                  requestedSectionLabel={c.sections[requestedSection]}
                  onSignIn={() => setSignInStage("checking")}
                  onContinue={() => {
                    setSection(requestedSection);
                    setSignInStage("signedOut");
                    setState("ready");
                  }}
                />
              )
            ) : (
              <>
                <nav aria-label="breadcrumb">
                  <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <li>{c.breadcrumbRoot}</li>
                    <li aria-hidden>/</li>
                    <li>{c.workspaceRoot}</li>
                    <li aria-hidden>/</li>
                    <li className="font-medium text-foreground" aria-current="page">
                      {c.sections[section]}
                    </li>
                  </ol>
                </nav>

                <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="min-w-0">
                    <h1 className="font-heading text-xl font-semibold lg:text-2xl">{sectionTitle}</h1>
                    <p className="text-xs text-muted-foreground">{sectionHint}</p>
                    <p className="text-xs text-muted-foreground" data-testid="proto-updated-at">
                      {c.updatedAt}: {PROTO_UPDATED_AT[lang]}
                    </p>
                  </div>

                  {productsPrimaryAvailable ? (
                    <Button
                      className={CONTROL}
                      onClick={() => setEditingProducts(true)}
                      data-testid="proto-primary-action"
                    >
                      {p.editAction}
                    </Button>
                  ) : productsReadOnly ? (
                    <span
                      className="text-[10.5px] uppercase text-muted-foreground"
                      data-testid="proto-products-read-only"
                    >
                      {p.readOnlyLabel}
                    </span>
                  ) : null}
                </div>

                {isCustomerWork ? (
                  <CustomerWorkSection
                    lang={lang}
                    section={section}
                    scenario={scenario}
                    state={effectiveState}
                    retryLabel={c.retry}
                    onRetry={() => setState("ready")}
                    onResolveConflict={() => setState("success")}
                  />
                ) : (
                  renderBody()
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerWorkspacePrototype;
