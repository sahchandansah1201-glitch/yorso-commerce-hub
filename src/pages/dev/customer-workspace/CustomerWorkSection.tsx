/**
 * P4 — Customer work: companies, contacts, tasks, notes and unified search.
 *
 * Actions come from the prototype access scenario only. The role selector never
 * changes what is offered here. Absent actions are removed, not disabled.
 * All data is deterministic in-memory demo data: no storage, no network.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, Lock, RotateCcw } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProtoLang, ProtoSectionKey, ProtoStateKey } from "./copy";
import {
  P4_SORTS,
  protoP4Copy,
  type P4Scenario,
  type P4SortKey,
  type P4TabKey,
} from "./copy-p4";
import { P4_ALL_RECORDS, P4_DELETED, p4RelatedFor, type P4Record } from "./data-p4";
import { ImportWizard } from "./ImportWizard";
import { CONTROL } from "./ui";


export type P4SectionKey = Extract<
  ProtoSectionKey,
  "companies" | "contacts" | "tasks" | "notes" | "search"
>;

export const P4_SECTIONS: P4SectionKey[] = [
  "companies",
  "contacts",
  "tasks",
  "notes",
  "search",
];

export const isP4Section = (key: ProtoSectionKey): key is P4SectionKey =>
  (P4_SECTIONS as ProtoSectionKey[]).includes(key);

const PAGE_SIZE = 2;

const Panel = ({
  title,
  body,
  tone = "neutral",
  testId,
  children,
}: {
  title: string;
  body: string;
  tone?: "neutral" | "muted";
  testId: string;
  children?: React.ReactNode;
}) => (
  <div
    data-testid={testId}
    className={`min-w-0 rounded-lg border p-4 ${
      tone === "muted" ? "border-border bg-muted/40" : "border-border bg-card"
    }`}
  >
    <h3 className="font-heading text-base font-semibold">{title}</h3>
    <p className="mt-1 max-w-prose text-sm text-muted-foreground">{body}</p>
    {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
  </div>
);

const RecordCard = ({
  lang,
  record,
  pool,
  canEdit,
  onBack,
  onOpen,
  onEdited,
}: {
  lang: ProtoLang;
  record: P4Record;
  /** Все текущие записи: связи учитывают изменённые, созданные и восстановленные. */
  pool: P4Record[];
  canEdit: boolean;
  onBack: () => void;
  onOpen: (id: string) => void;
  onEdited: (id: string, title: string) => void;
}) => {
  const t = protoP4Copy[lang];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record.title[lang]);

  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [canEdit]);

  useEffect(() => {
    setDraft(record.title[lang]);
    setEditing(false);
  }, [record, lang]);

  const related = p4RelatedFor(record, pool);
  const company = pool.find((c) => c.kind === "company" && c.id === record.companyId);
  const tabs: P4TabKey[] =
    record.kind === "company"
      ? ["overview", "contacts", "tasks", "notes", "related"]
      : ["overview", "tasks", "notes", "related"];

  const listFor = (tab: P4TabKey): P4Record[] => {
    if (tab === "contacts") return related.filter((r) => r.kind === "contact");
    if (tab === "tasks") return related.filter((r) => r.kind === "task");
    if (tab === "notes") return related.filter((r) => r.kind === "note");
    return related;
  };

  const RelatedList = ({ items }: { items: P4Record[] }) =>
    items.length === 0 ? (
      <p className="text-sm text-muted-foreground">{t.noRelated}</p>
    ) : (
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={`${r.kind}-${r.id}`} className="min-w-0">
            <Button
              variant="outline"
              className={`${CONTROL} w-full justify-between`}
              onClick={() => onOpen(r.id)}
              data-testid={`proto-p4-related-${r.id}`}
            >
              <span className="min-w-0 truncate">{r.title[lang]}</span>
              <ChevronRight aria-hidden className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="min-w-0 space-y-3" data-testid="proto-p4-record">
      <Button variant="ghost" className={CONTROL} onClick={onBack} data-testid="proto-p4-record-back">
        {t.back}
      </Button>

      <div className="min-w-0 rounded-lg border border-border bg-card p-4">
        <p className="text-[10.5px] uppercase text-muted-foreground">{t.kinds[record.kind]}</p>
        <h2 className="font-heading text-lg font-semibold" data-testid="proto-p4-record-title">
          {record.title[lang]}
        </h2>
        <p className="text-sm text-muted-foreground">{record.subtitle[lang]}</p>

        {canEdit ? (
          <div className="mt-3 border-t border-border/60 pt-3">
            {editing ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="proto-p4-record-edit-input">
                  {t.titleField}
                </label>
                <Input
                  id="proto-p4-record-edit-input"
                  className={`${CONTROL} max-w-xs`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  data-testid="proto-p4-record-edit-input"
                />
                <Button
                  className={CONTROL}
                  onClick={() => {
                    onEdited(record.id, draft);
                    setEditing(false);
                  }}
                  data-testid="proto-p4-record-edit-save"
                >
                  {t.save}
                </Button>
                <Button
                  variant="outline"
                  className={CONTROL}
                  onClick={() => {
                    setDraft(record.title[lang]);
                    setEditing(false);
                  }}
                >
                  {t.cancel}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className={CONTROL}
                onClick={() => setEditing(true)}
                data-testid="proto-p4-record-edit"
              >
                {t.editTitleAction}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="overview" className="min-w-0">
        <TabsList className="flex h-auto min-w-0 flex-wrap gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className={CONTROL} data-testid={`proto-p4-tab-${tab}`}>
              {t.tabs[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="min-w-0 rounded-lg border border-border bg-card p-4">
          <h3 className="font-heading text-sm font-semibold">{t.mainDetails}</h3>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ...(company ? [{ label: t.companyField, value: company.title[lang] }] : []),
              { label: t.responsible, value: record.responsible[lang] },
              { label: t.updated, value: record.updatedLabel[lang] },
              ...record.details.map((d) => ({ label: d.label[lang], value: d.value[lang] })),
            ].map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-[10.5px] uppercase text-muted-foreground">{f.label}</dt>
                <dd className="min-w-0 break-words text-sm">{f.value}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        {tabs
          .filter((tab) => tab !== "overview")
          .map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="min-w-0 rounded-lg border border-border bg-card p-4"
            >
              <RelatedList items={listFor(tab)} />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
};

export const CustomerWorkSection = ({
  lang,
  section,
  scenario,
  state,
  retryLabel,
  onRetry,
  onResolveConflict,
}: {
  lang: ProtoLang;
  section: P4SectionKey;
  scenario: P4Scenario;
  state: ProtoStateKey;
  retryLabel: string;
  onRetry: () => void;
  onResolveConflict: () => void;
}) => {
  const t = protoP4Copy[lang];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<P4SortKey>("updatedDesc");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [created, setCreated] = useState<P4Record[]>([]);
  // Локальная правка названия: recordId -> язык -> текст. Правка на одном
  // языке никогда не переносится в другой язык.
  const [titles, setTitles] = useState<
    Record<string, Partial<Record<ProtoLang, string>>>
  >({});
  const [restored, setRestored] = useState<P4Record[]>([]);
  const [dialog, setDialog] = useState<null | "create" | "import" | "export" | "deleted">(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const canCreateEdit = scenario === "createEdit";

  // Permission revocation closes stale forms and dialogs immediately.
  useEffect(() => {
    setDialog(null);
    setRestoreId(null);
    setNotice(null);
  }, [scenario, section]);

  useEffect(() => {
    setOpenId(null);
    setPage(0);
  }, [section]);

  /** Все текущие записи компании: базовые, созданные и восстановленные. */
  const allRecords = useMemo(
    () =>
      [...created, ...restored, ...P4_ALL_RECORDS].map((r) => {
        const edits = titles[r.id];
        return edits ? { ...r, title: { ...r.title, ...edits } } : r;
      }),
    [created, restored, titles],
  );

  /** Записи текущего раздела. */
  const records = useMemo(() => {
    if (section === "search") return allRecords;
    const kind = kindOf(section);
    return allRecords.filter((r) => r.kind === kind);
  }, [allRecords, section]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = records.filter((r) => {
      if (filter === "active" && !r.active) return false;
      if (filter === "inactive" && r.active) return false;
      if (q.length === 0) return true;
      return (
        r.title[lang].toLowerCase().includes(q) || r.subtitle[lang].toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "titleAsc") return a.title[lang].localeCompare(b.title[lang]);
      if (sort === "titleDesc") return b.title[lang].localeCompare(a.title[lang]);
      return b.updated.localeCompare(a.updated); // ISO: машинная сортировка
    });
    return list;
  }, [records, query, filter, sort, lang]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const openRecord = useMemo(
    () => (openId ? allRecords.find((r) => r.id === openId) ?? null : null),
    [openId, allRecords],
  );

  // Право в P4 задаёт только сценарий доступа.
  if (scenario === "denied") {
    return <Panel testId="proto-p4-denied" title={t.deniedTitle} body={t.deniedBody} tone="muted" />;
  }

  if (state === "unavailable") {
    return (
      <Panel testId="proto-p4-unavailable" title={t.unavailableTitle} body={t.unavailableBody} tone="muted">
        <Button variant="outline" className={CONTROL} onClick={onRetry} data-testid="proto-p4-retry">
          <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      </Panel>
    );
  }

  if (state === "loading") {
    return (
      <div
        className="space-y-2"
        data-testid="proto-p4-loading"
        aria-label={t.loadingLabel}
        aria-busy="true"
      >
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-2/3" />
      </div>
    );
  }

  if (state === "empty") {
    return <Panel testId="proto-p4-empty" title={t.emptyTitle} body={t.emptyBody} tone="muted" />;
  }

  if (state === "emptySearch") {
    return (
      <Panel testId="proto-p4-empty-search" title={t.emptySearchTitle} body={t.emptySearchBody} tone="muted" />
    );
  }

  if (state === "validating" || state === "saving") {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm"
        data-testid={state === "validating" ? "proto-p4-validating" : "proto-p4-saving"}
        aria-busy="true"
      >
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
        <span>{state === "validating" ? t.validating : t.savingLabel}</span>
      </div>
    );
  }

  if (state === "conflict") {
    return (
      <Panel testId="proto-p4-conflict" title={t.conflictTitle} body={t.conflictBody}>
        <Button className={CONTROL} onClick={onResolveConflict}>{t.keepMine}</Button>
        <Button variant="outline" className={CONTROL} onClick={onResolveConflict}>
          {t.keepTheirs}
        </Button>
      </Panel>
    );
  }

  const createLabel =
    section === "companies"
      ? t.actions.createCompany
      : section === "contacts"
        ? t.actions.addContact
        : section === "tasks"
          ? t.actions.createTask
          : section === "notes"
            ? t.actions.addNote
            : null;

  const menuEntries: { key: "import" | "export" | "deleted"; label: string }[] = [];
  if (section === "companies" || section === "contacts") {
    if (scenario === "import") menuEntries.push({ key: "import", label: t.actions.importEntry });
    if (scenario === "export") menuEntries.push({ key: "export", label: t.actions.exportEntry });
    if (scenario === "deleted") menuEntries.push({ key: "deleted", label: t.actions.openDeleted });
  }

  return (
    <div className="min-w-0 space-y-3">
      {state === "success" ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3"
          role="status"
          data-testid="proto-p4-success"
        >
          <Check aria-hidden className="mt-0.5 h-4 w-4 text-success" />
          <div>
            <p className="text-sm font-medium">{t.successTitle}</p>
            <p className="text-xs text-muted-foreground">{t.successBody}</p>
          </div>
        </div>
      ) : null}

      {scenario === "view" ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3"
          data-testid="proto-p4-view-only"
        >
          <Lock aria-hidden className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t.viewOnlyTitle}</p>
            <p className="text-xs text-muted-foreground">{t.viewOnlyBody}</p>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="text-sm text-muted-foreground" role="status" data-testid="proto-p4-notice">
          {notice}
        </p>
      ) : null}

      {openRecord ? (
        <RecordCard
          lang={lang}
          record={openRecord}
          pool={allRecords}
          canEdit={canCreateEdit}
          onBack={() => setOpenId(null)}
          onOpen={(id) => setOpenId(id)}
          onEdited={(id, title) => {
            setTitles((prev) => {
              const edits: Partial<Record<ProtoLang, string>> = {
                ...prev[id],
                [lang]: title,
              };
              return { ...prev, [id]: edits };
            });
            setNotice(t.successBody);
          }}
        />
      ) : (
        <>
          {/* List controls */}
          <div className="flex min-w-0 flex-wrap items-end gap-2">
            <div className="min-w-0">
              <label className="sr-only" htmlFor="proto-p4-search">{t.searchLabel}</label>
              <Input
                id="proto-p4-search"
                className={`${CONTROL} w-[240px] max-w-full`}
                value={query}
                placeholder={t.searchPlaceholder}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                data-testid="proto-p4-search"
              />
            </div>

            <div className="min-w-0">
              <label className="sr-only" htmlFor="proto-p4-filter">{t.filters}</label>
              <Select
                value={filter}
                onValueChange={(v) => {
                  setFilter(v as "all" | "active" | "inactive");
                  setPage(0);
                }}
              >
                <SelectTrigger id="proto-p4-filter" className={`${CONTROL} w-[180px]`} data-testid="proto-p4-filter">
                  <SelectValue aria-label={t.filters} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.filterAll}</SelectItem>
                  <SelectItem value="active">{t.filterActive}</SelectItem>
                  <SelectItem value="inactive">{t.filterInactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="sr-only" htmlFor="proto-p4-sort">{t.sort}</label>
              <Select value={sort} onValueChange={(v) => setSort(v as P4SortKey)}>
                <SelectTrigger id="proto-p4-sort" className={`${CONTROL} w-[200px]`} data-testid="proto-p4-sort">
                  <SelectValue aria-label={t.sort} />
                </SelectTrigger>
                <SelectContent>
                  {P4_SORTS.map((key) => (
                    <SelectItem key={key} value={key}>{t.sorts[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canCreateEdit && createLabel ? (
              <Button
                className={CONTROL}
                onClick={() => {
                  setDraftTitle("");
                  setDialog("create");
                }}
                data-testid="proto-p4-create"
              >
                {createLabel}
              </Button>
            ) : null}

            {menuEntries.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={CONTROL} data-testid="proto-p4-list-actions">
                    {t.listActions}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuEntries.map((entry) => (
                    <DropdownMenuItem
                      key={entry.key}
                      onSelect={() => setDialog(entry.key)}
                      data-testid={`proto-p4-menu-${entry.key}`}
                    >
                      {entry.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground" data-testid="proto-p4-count">
            {t.resultCount}: {filtered.length}
          </p>

          {filtered.length === 0 ? (
            <Panel
              testId="proto-p4-empty-search"
              title={t.emptySearchTitle}
              body={t.emptySearchBody}
              tone="muted"
            />
          ) : (
            <>
              <div
                className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card md:block"
                data-testid="proto-p4-table"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t.titleField}</TableHead>
                      <TableHead className="text-xs">{t.kinds.company}</TableHead>
                      <TableHead className="text-xs">{t.responsible}</TableHead>
                      <TableHead className="text-xs">{t.status}</TableHead>
                      <TableHead className="text-xs">{t.updated}</TableHead>
                      <TableHead className="text-xs" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((r) => (
                      <TableRow key={`${r.kind}-${r.id}`} className="h-12">
                        <TableCell className="align-top">
                          <span className="font-medium">{r.title[lang]}</span>
                          <span className="block text-xs text-muted-foreground">{r.subtitle[lang]}</span>
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {allRecords.find((c) => c.kind === "company" && c.id === r.companyId)
                            ?.title[lang] ?? t.kinds[r.kind]}
                        </TableCell>
                        <TableCell className="align-top text-sm">{r.responsible[lang]}</TableCell>
                        <TableCell className="align-top text-sm">
                          {r.active ? t.filterActive : t.filterInactive}
                        </TableCell>
                        <TableCell className="align-top text-xs text-muted-foreground">
                          {r.updatedLabel[lang]}
                        </TableCell>
                        <TableCell className="align-top">
                          <Button
                            variant="outline"
                            className={CONTROL}
                            onClick={() => setOpenId(r.id)}
                            data-testid={`proto-p4-open-${r.id}`}
                          >
                            {t.open}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="space-y-2 md:hidden" data-testid="proto-p4-cards">
                {pageItems.map((r) => (
                  <li key={`${r.kind}-${r.id}`} className="min-w-0 rounded-lg border border-border bg-card p-3">
                    <p className="min-w-0 break-words font-medium">{r.title[lang]}</p>
                    <p className="text-xs text-muted-foreground">{r.subtitle[lang]}</p>
                    <p className="mt-1 text-sm">
                      {r.responsible[lang]} · {r.active ? t.filterActive : t.filterInactive}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.updated}: {r.updatedLabel[lang]}
                    </p>
                    <div className="mt-3 border-t border-border/60 pt-3">
                      <Button
                        variant="outline"
                        className={CONTROL}
                        onClick={() => setOpenId(r.id)}
                        data-testid={`proto-p4-open-mobile-${r.id}`}
                      >
                        {t.open}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className={CONTROL}
                  disabled={safePage === 0}
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  data-testid="proto-p4-prev"
                >
                  {t.previous}
                </Button>
                <span className="text-xs text-muted-foreground" data-testid="proto-p4-page">
                  {t.pageOf} {safePage + 1} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  className={CONTROL}
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                  data-testid="proto-p4-next"
                >
                  {t.next}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Create a record */}
      <Dialog open={dialog === "create"} onOpenChange={(open) => setDialog(open ? "create" : null)}>
        <DialogContent
        className="[&>button[type=button]]:h-11 [&>button[type=button]]:w-11 [&>button[type=button]]:min-h-11 [&>button[type=button]]:min-w-11 [&>button[type=button]]:inline-flex [&>button[type=button]]:items-center [&>button[type=button]]:justify-center"
        data-testid="proto-p4-create-dialog"
      >
          <DialogHeader>
            <DialogTitle>{createLabel ?? t.createTitle}</DialogTitle>
            <DialogDescription>{t.createHint}</DialogDescription>
          </DialogHeader>
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-p4-create-title">
            {t.titleField}
          </label>
          <Input
            id="proto-p4-create-title"
            className={CONTROL}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            data-testid="proto-p4-create-input"
          />
          <DialogFooter>
            <Button variant="outline" className={CONTROL} onClick={() => setDialog(null)}>
              {t.cancel}
            </Button>
            <Button
              className={CONTROL}
              onClick={() => {
                const title = draftTitle.trim();
                if (title.length > 0) {
                  const kind = kindOf(section);
                  setCreated((prev) => [
                    {
                      id: `new-${kind}-${prev.length + 1}`,
                      kind,
                      title: { ru: title, en: title, es: title },
                      subtitle: { ru: "Новая запись", en: "New record", es: "Nuevo registro" },
                      responsible: { ru: "—", en: "—", es: "—" },
                      active: true,
                      updated: "2026-09-06T21:00",
                      updatedLabel: { ru: "06.09.2026 21:00", en: "06.09.2026 21:00", es: "06.09.2026 21:00" },
                      // Дочерние записи создаются в текущей компании; компания
                      // остаётся корневой записью без родителя.
                      companyId: kind === "company" ? undefined : "bergen",
                      details: [],
                    },
                    ...prev,
                  ]);
                  setNotice(t.successBody);
                }
                setDialog(null);
              }}
              data-testid="proto-p4-create-save"
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-screen data transfer wizard; unmounts when access changes. */}
      {dialog === "import" ? (
        <ImportWizard lang={lang} onClose={() => setDialog(null)} />
      ) : null}


      {/* Export entry point only */}
      <Dialog open={dialog === "export"} onOpenChange={(open) => setDialog(open ? "export" : null)}>
        <DialogContent
        className="[&>button[type=button]]:h-11 [&>button[type=button]]:w-11 [&>button[type=button]]:min-h-11 [&>button[type=button]]:min-w-11 [&>button[type=button]]:inline-flex [&>button[type=button]]:items-center [&>button[type=button]]:justify-center"
        data-testid="proto-p4-export-dialog"
      >
          <DialogHeader>
            <DialogTitle>{t.exportTitle}</DialogTitle>
            <DialogDescription>{t.exportBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className={CONTROL} onClick={() => setDialog(null)}>{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deleted records: review and restore */}
      <Dialog open={dialog === "deleted"} onOpenChange={(open) => setDialog(open ? "deleted" : null)}>
        <DialogContent
        className="[&>button[type=button]]:h-11 [&>button[type=button]]:w-11 [&>button[type=button]]:min-h-11 [&>button[type=button]]:min-w-11 [&>button[type=button]]:inline-flex [&>button[type=button]]:items-center [&>button[type=button]]:justify-center"
        data-testid="proto-p4-deleted-dialog"
      >
          <DialogHeader>
            <DialogTitle>{t.deletedTitle}</DialogTitle>
            <DialogDescription>{t.deletedBody}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {P4_DELETED.filter((r) => !restored.some((x) => x.id === r.id)).map((r) => {
              // Дочернюю запись нельзя восстановить без родительской компании.
              const parentMissing =
                Boolean(r.companyId) &&
                !allRecords.some((c) => c.kind === "company" && c.id === r.companyId);
              const parentTitle =
                P4_DELETED.find((c) => c.kind === "company" && c.id === r.companyId)?.title[lang] ??
                "";
              return (
                <li
                  key={r.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{r.title[lang]}</span>
                    <span className="block text-xs text-muted-foreground">{t.kinds[r.kind]}</span>
                    {parentMissing ? (
                      <span
                        className="block text-xs text-muted-foreground"
                        data-testid={`proto-p4-restore-blocked-${r.id}`}
                      >
                        {t.restoreBlocked.replace("{company}", parentTitle)}
                      </span>
                    ) : null}
                  </span>
                  {parentMissing ? null : (
                    <Button
                      variant="outline"
                      className={CONTROL}
                      onClick={() => setRestoreId(r.id)}
                      data-testid={`proto-p4-restore-${r.id}`}
                    >
                      {t.actions.restore}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button className={CONTROL} onClick={() => setDialog(null)}>{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreId !== null} onOpenChange={(open) => (open ? null : setRestoreId(null))}>
        <AlertDialogContent data-testid="proto-p4-restore-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.restoreTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.restoreBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={CONTROL}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={CONTROL}
              onClick={() => {
                const record = P4_DELETED.find((r) => r.id === restoreId);
                if (record) setRestored((prev) => [{ ...record, active: true }, ...prev]);
                setRestoreId(null);
                setNotice(t.restored);
              }}
              data-testid="proto-p4-restore-confirm"
            >
              {t.restoreConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function kindOf(section: P4SectionKey): P4Record["kind"] {
  switch (section) {
    case "companies":
      return "company";
    case "contacts":
      return "contact";
    case "tasks":
      return "task";
    case "notes":
      return "note";
    case "search":
      return "company";
  }
}
