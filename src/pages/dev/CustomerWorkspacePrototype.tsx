/**
 * P0 prototype surface — hidden from the user navigation, wired at
 * /dev/customer-workspace.
 *
 * Scope of this package: the shared YORSO shell, a fixed current-company indicator,
 * workspace navigation, section header with breadcrumbs and one primary action,
 * the role and state scenario switches, and the real state library.
 * P1-P7 are NOT implemented here.
 *
 * No backend, no network requests, no storage writes, no new dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronRight, Loader2, Lock, Moon, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  PROTO_COMPANY,
  PROTO_ROWS,
  PROTO_UPDATED_AT,
  type ProtoRow,
} from "./customer-workspace/data";

// Local desktop overrides: the shared Button applies sm:h-10 sm:min-h-0, so P0 pins 44px.
const CONTROL = "!h-[44px] !min-h-[44px] !min-w-[44px] text-sm";
const ICON_CONTROL = "!h-[44px] !min-h-[44px] !w-[44px] !min-w-[44px] px-0";

// Состояния, содержащие изменяющие действия (в т.ч. destructive-триггер).
const MUTATING_STATES: ProtoStateKey[] = ["conflict", "saving", "success", "destructive"];


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
  const [state, setState] = useState<ProtoStateKey>("ready");
  const [query, setQuery] = useState("");
  const [confirmedInactive, setConfirmedInactive] = useState(false);

  const c = protoCopy[lang];
  const company = PROTO_COMPANY;
  const canEdit = role === "owner" || role === "admin";

  // Утверждена только матрица «Продукции»: изменяющие действия доступны
  // Владельцу и Администратору. Менеджер и Наблюдатель всегда только читают.
  const canMutate = section === "products" && canEdit;

  // Состояния с изменяющими действиями существуют только там, где право
  // подтверждено; при смене роли/раздела состояние нормализуется.
  const availableStates = useMemo<ProtoStateKey[]>(
    () => PROTO_STATES.filter((key) => canMutate || !MUTATING_STATES.includes(key)),
    [canMutate],
  );
  const stateAllowed = availableStates.includes(state);
  const effectiveState = stateAllowed ? state : "ready";

  useEffect(() => {
    if (!stateAllowed) setState("ready");
  }, [stateAllowed]);

  const rows = useMemo<ProtoRow[]>(() => {
    const base = PROTO_ROWS[section];
    if (section === "search") {
      if (query.trim().length === 0) return [];
      return base.filter((r) => r.name[lang].toLowerCase().includes(query.trim().toLowerCase()));
    }
    return base;
  }, [section, query, lang]);

  const primaryActionLabel = c.primaryActions.products;
  const primaryAvailable = canMutate && effectiveState === "ready";

  const showTable = rows.length > 0;


  const renderBody = () => {
    if (role === "service") {
      return <StatePanel testId="proto-state-service" title={c.serviceTitle} body={c.serviceBody} tone="muted" />;
    }
    switch (effectiveState) {
      case "loading":
        return (
          <div className="space-y-2" data-testid="proto-state-loading" aria-label={c.loadingLabel} aria-busy="true">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-5/6" />
            <Skeleton className="h-11 w-2/3" />
          </div>
        );
      case "empty":
        return <StatePanel testId="proto-state-empty" title={c.emptyTitle} body={c.emptyBody} tone="muted" />;
      case "denied":
        return <StatePanel testId="proto-state-denied" title={c.deniedTitle} body={c.deniedBody} tone="muted" />;
      case "unavailable":
        return (
          <StatePanel testId="proto-state-unavailable" title={c.unavailableTitle} body={c.unavailableBody} tone="muted">
            <Button variant="outline" className={CONTROL} onClick={() => setState("ready")}>
              <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
              {c.retry}
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
      case "destructive":
        return (
          <div className="space-y-3">
            <StatePanel
              testId="proto-state-destructive"
              title={c.states.destructive}
              body={c.destructiveBody}
              tone="destructive"
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className={CONTROL}
                    data-testid="proto-destructive-trigger"
                  >
                    {c.destructiveAction}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-testid="proto-destructive-dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{c.destructiveTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{c.destructiveBody}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className={CONTROL}>{c.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      className={CONTROL}
                      onClick={() => {
                        setConfirmedInactive(true);
                        setState("success");
                      }}
                    >
                      {c.destructiveConfirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </StatePanel>
            {renderRecords()}
          </div>
        );
      default:
        return renderRecords();
    }
  };

  const renderRecords = () => {
    if (section === "overview") {
      return (
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
      );
    }

    if (section === "search" && query.trim().length === 0) {
      return (
        <StatePanel
          testId="proto-search-empty-query"
          title={c.sections.search}
          body={c.searchEmptyQuery}
          tone="muted"
        />
      );
    }

    if (!showTable) {
      return <StatePanel testId="proto-state-empty" title={c.emptyTitle} body={c.emptyBody} tone="muted" />;
    }

    return (
      <>
        {/* Wide screen: dense working table */}
        <div className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card md:block" data-testid="proto-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{c.columns.name}</TableHead>
                <TableHead className="text-xs">{c.columns.kind}</TableHead>
                <TableHead className="text-xs">{c.columns.responsible}</TableHead>
                <TableHead className="text-right text-xs">{c.columns.volume}</TableHead>
                <TableHead className="text-xs">{c.columns.status}</TableHead>
                <TableHead className="text-xs">{c.columns.updated}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="h-12">
                  <TableCell className="align-top">
                    <span className="font-medium">{r.name[lang]}</span>
                    {r.secondary ? (
                      <span className="block text-xs italic text-muted-foreground">{r.secondary}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="align-top text-sm">{r.kind[lang]}</TableCell>
                  <TableCell className="align-top text-sm">{r.responsible}</TableCell>
                  <TableCell className="align-top text-right text-sm tabular-nums">{r.volume}</TableCell>
                  <TableCell className="align-top text-sm">
                    {r.active && !(confirmedInactive && r.id === "salmon")
                      ? c.statusActive
                      : c.statusInactive}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{r.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 390px: record cards instead of the table */}
        <ul className="space-y-2 md:hidden" data-testid="proto-cards">
          {rows.map((r) => (
            <li key={r.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words font-medium">{r.name[lang]}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.active && !(confirmedInactive && r.id === "salmon") ? c.statusActive : c.statusInactive}
                </span>
              </div>
              {r.secondary ? (
                <p className="text-xs italic text-muted-foreground">{r.secondary}</p>
              ) : null}
              <p className="mt-1 text-sm">{r.kind[lang]} · {r.responsible}</p>
              <p className="text-xs text-muted-foreground">
                {r.volume !== "—" ? `${r.volume} · ` : ""}
                {c.updatedAt}: {r.updated}
              </p>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Shared YORSO shell header */}
        <header className="border-b border-border bg-card">
          <div className="container flex min-w-0 flex-wrap items-center gap-2 py-3">
            <span className="font-heading text-lg font-bold">{c.brand}</span>

            <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
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

        {/* Compact scenario strip: role and state */}
        <div className="border-b border-border bg-muted/40">
          <div className="container flex min-w-0 flex-wrap items-center gap-2 py-2">
            <label className="text-xs text-muted-foreground" htmlFor="proto-role">{c.role}</label>
            <Select value={role} onValueChange={(v) => setRole(v as ProtoRoleKey)}>
              <SelectTrigger id="proto-role" className={`${CONTROL} w-[220px]`} data-testid="proto-role-switch">
                <SelectValue aria-label={c.role} />
              </SelectTrigger>
              <SelectContent>
                {PROTO_ROLES.map((key) => (
                  <SelectItem key={key} value={key}>{c.roles[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="text-xs text-muted-foreground" htmlFor="proto-state">{c.scenario}</label>
            <Select value={effectiveState} onValueChange={(v) => setState(v as ProtoStateKey)}>
              <SelectTrigger id="proto-state" className={`${CONTROL} w-[260px]`} data-testid="proto-state-switch">
                <SelectValue aria-label={c.scenario} />
              </SelectTrigger>
              <SelectContent>
                {PROTO_STATES.map((key) => (
                  <SelectItem key={key} value={key}>{c.states[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="min-w-0 text-xs text-muted-foreground">{c.prototypeNotice}</p>
          </div>
        </div>

        <div className="container grid min-w-0 gap-6 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Workspace navigation */}
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

          {/* Section surface */}
          <main className="min-w-0 space-y-4">
            <nav aria-label="breadcrumb">
              <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <li>{c.breadcrumbRoot}</li>
                <li aria-hidden>/</li>
                <li>{c.workspaceRoot}</li>
                <li aria-hidden>/</li>
                <li className="font-medium text-foreground" aria-current="page">{c.sections[section]}</li>
              </ol>
            </nav>

            <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-3">
              <div className="min-w-0">
                <h1 className="font-heading text-xl font-semibold lg:text-2xl">
                  {section === "products" ? `${c.sections.products} · ${company.name}` : c.sections[section]}
                </h1>
                <p className="text-xs text-muted-foreground">{c.sectionHints[section]}</p>
                <p className="text-xs text-muted-foreground" data-testid="proto-updated-at">
                  {c.updatedAt}: {PROTO_UPDATED_AT[lang]}
                </p>
              </div>

              {role === "service" || !primaryAvailable ? null : (
                <Button
                  className={CONTROL}
                  onClick={() => setState(state === "ready" ? "saving" : "ready")}
                  data-testid="proto-primary-action"
                >
                  {primaryActionLabel}
                </Button>
              )}
            </div>

            {section === "search" ? (
              <div className="min-w-0 max-w-md">
                <label className="sr-only" htmlFor="proto-search">{c.sections.search}</label>
                <Input
                  id="proto-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={c.searchPlaceholder}
                  className={CONTROL}
                  data-testid="proto-search-input"
                />
              </div>
            ) : null}

            {renderBody()}
          </main>
        </div>

      </div>
    </div>
  );
};

export default CustomerWorkspacePrototype;
