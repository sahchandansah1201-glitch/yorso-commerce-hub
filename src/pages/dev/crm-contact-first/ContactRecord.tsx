/**
 * Contact record: header, quick channels, main details with edit mode,
 * company context, tags, and Activity / Tasks / Notes segments.
 * In-memory only.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTROL, FIELD } from "./ui";
import { CopyValueButton, type CrmPerms } from "./ContactsList";
import {
  CRM_COUNTRY_LABELS,
  employeeName,
  formatDate,
  type CrmActivityType,
  type CrmCompany,
  type CrmContact,
  type CrmEmployee,
} from "./data";
import { CRM_STAGES, crmCopy, fillCopy, type CrmLang, type CrmStage } from "./copy";

const ACTIVITY_TYPES: CrmActivityType[] = ["created", "stage", "email", "call", "note", "task"];

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm font-medium">{value || "—"}</dd>
  </div>
);

export const ContactRecord = ({
  lang,
  contact,
  company,
  perms,
  extraEmployees,
  onBack,
  onChange,
}: {
  lang: CrmLang;
  contact: CrmContact;
  company?: CrmCompany;
  perms: CrmPerms;
  extraEmployees: CrmEmployee[];
  onBack: () => void;
  onChange: (updater: (c: CrmContact) => CrmContact) => void;
}) => {
  const t = crmCopy[lang];
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({
    jobTitle: contact.jobTitle ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    stage: contact.stage,
    language: contact.language,
  });
  const [activityType, setActivityType] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  // Право на изменение может исчезнуть: черновик тогда закрывается.
  useEffect(() => {
    if (!perms.canEdit) setEditing(false);
  }, [perms.canEdit]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const startEdit = () => {
    setDraft({
      jobTitle: contact.jobTitle ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      stage: contact.stage,
      language: contact.language,
    });
    setEditing(true);
  };

  const save = () => {
    onChange((c) => ({
      ...c,
      jobTitle: draft.jobTitle.trim() || undefined,
      email: draft.email.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      stage: draft.stage,
      language: draft.language,
    }));
    setEditing(false);
    setSaved(true);
  };

  const activityLabel = (type: CrmActivityType, stage?: CrmStage) => {
    if (type === "created") return t.a_created;
    if (type === "stage") return fillCopy(t.a_stage, { stage: stage ?? contact.stage });
    if (type === "email") return t.a_email;
    if (type === "call") return t.a_call;
    if (type === "note") return t.a_note;
    return t.a_task;
  };

  const activity = useMemo(
    () =>
      [...contact.activity]
        .filter((e) => !activityType || e.type === activityType)
        .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [contact.activity, activityType],
  );

  const languageLabel =
    contact.language === "ru" ? t.lang_ru : contact.language === "en" ? t.lang_en : t.lang_es;

  return (
    <div className="min-w-0 space-y-4" data-testid="crm-record">
      <Button
        variant="outline"
        className={CONTROL}
        onClick={onBack}
        data-testid="crm-record-back"
      >
        <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
        {t.rec_back}
      </Button>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-xl font-semibold break-words" data-testid="crm-record-name">
          {contact.firstName} {contact.lastName}
        </h2>
        <p className="mt-1 break-words text-sm text-muted-foreground">
          {company?.name}
          {contact.jobTitle ? ` · ${contact.jobTitle}` : ""}
        </p>
        <p className="mt-1 text-sm" data-testid="crm-record-stage">
          {t.rec_stage}: {contact.stage}
        </p>
        {!contact.active ? (
          <p className="mt-1 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
            {t.badge_inactive}
          </p>
        ) : null}
        {!perms.canEdit ? (
          <p
            className="mt-1 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground"
            data-testid="crm-record-viewonly"
          >
            {t.badge_viewOnly}
          </p>
        ) : null}

        <div className="mt-3 space-y-1 border-t border-border/60 pt-3">
          {contact.email ? (
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <span className="break-all text-sm">{contact.email}</span>
              <CopyValueButton
                value={contact.email}
                label={`${t.act_copy_email}: ${contact.email}`}
                copiedLabel={t.act_copied}
                testId="crm-record-copy-email"
              />
              {perms.canReachOut ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-primary underline"
                  data-testid="crm-record-mail"
                >
                  {t.act_email}
                </a>
              ) : null}
            </div>
          ) : null}
          {contact.phone ? (
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <span className="break-all text-sm">{contact.phone}</span>
              <CopyValueButton
                value={contact.phone}
                label={`${t.act_copy_phone}: ${contact.phone}`}
                copiedLabel={t.act_copied}
                testId="crm-record-copy-phone"
              />
              {perms.canReachOut ? (
                <a
                  href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                  className="text-sm text-primary underline"
                  data-testid="crm-record-call"
                >
                  {t.act_call}
                </a>
              ) : null}
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {t.rec_owner}: {employeeName(contact.ownerId, extraEmployees)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-base font-semibold">{t.rec_details}</h3>
          {perms.canEdit && !editing ? (
            <Button
              variant="outline"
              className={CONTROL}
              onClick={startEdit}
              data-testid="crm-record-edit"
            >
              {t.rec_edit}
            </Button>
          ) : null}
        </div>

        {saved ? (
          <p className="mt-2 text-xs text-success" role="status" data-testid="crm-record-saved">
            {t.rec_saved}
          </p>
        ) : null}

        {editing ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="crm-e-job" className="text-xs font-medium">
                {t.rec_jobTitle}
              </label>
              <Input
                id="crm-e-job"
                className="mt-1 h-[44px]"
                value={draft.jobTitle}
                onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
                data-testid="crm-e-job"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="crm-e-stage" className="text-xs font-medium">
                {t.rec_stage}
              </label>
              <select
                id="crm-e-stage"
                className={`${FIELD} mt-1`}
                value={draft.stage}
                onChange={(e) => setDraft({ ...draft, stage: e.target.value as CrmStage })}
                data-testid="crm-e-stage"
              >
                {CRM_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="crm-e-email" className="text-xs font-medium">
                {t.rec_email}
              </label>
              <Input
                id="crm-e-email"
                className="mt-1 h-[44px]"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                data-testid="crm-e-email"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="crm-e-phone" className="text-xs font-medium">
                {t.rec_phone}
              </label>
              <Input
                id="crm-e-phone"
                className="mt-1 h-[44px]"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                data-testid="crm-e-phone"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="crm-e-language" className="text-xs font-medium">
                {t.rec_language}
              </label>
              <select
                id="crm-e-language"
                className={`${FIELD} mt-1`}
                value={draft.language}
                onChange={(e) => setDraft({ ...draft, language: e.target.value as CrmLang })}
                data-testid="crm-e-language"
              >
                <option value="ru">{t.lang_ru}</option>
                <option value="en">{t.lang_en}</option>
                <option value="es">{t.lang_es}</option>
              </select>
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
              <Button className={CONTROL} onClick={save} data-testid="crm-record-save">
                {t.rec_save}
              </Button>
              <Button
                variant="outline"
                className={CONTROL}
                onClick={() => setEditing(false)}
                data-testid="crm-record-cancel"
              >
                {t.rec_cancel}
              </Button>
            </div>
          </div>
        ) : (
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label={t.rec_jobTitle} value={contact.jobTitle ?? ""} />
            <Field label={t.rec_stage} value={contact.stage} />
            <Field label={t.rec_email} value={contact.email ?? ""} />
            <Field label={t.rec_phone} value={contact.phone ?? ""} />
            <Field label={t.rec_language} value={languageLabel} />
            <Field label={t.rec_owner} value={employeeName(contact.ownerId, extraEmployees)} />
          </dl>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-heading text-base font-semibold">{t.rec_company}</h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label={t.rec_company} value={company?.name ?? ""} />
          <Field
            label={t.rec_country}
            value={company ? CRM_COUNTRY_LABELS[company.country][lang] : ""}
          />
        </dl>
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t.rec_tags}
          </p>
          <div className="mt-1 flex flex-wrap gap-2" data-testid="crm-record-tags">
            {contact.tags.length ? (
              contact.tags.map((tg) => (
                <span
                  key={tg.en}
                  className="rounded-md border border-border px-2 py-1 text-xs"
                >
                  {tg[lang]}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="activity" className="min-w-0">
        <TabsList>
          <TabsTrigger value="activity" data-testid="crm-tab-activity">
            {t.tab_activity}
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="crm-tab-tasks">
            {t.tab_tasks}
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="crm-tab-notes">
            {t.tab_notes}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="min-w-0 max-w-xs">
              <label htmlFor="crm-activity-filter" className="text-xs font-medium">
                {t.act_filter}
              </label>
              <select
                id="crm-activity-filter"
                className={`${FIELD} mt-1`}
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                data-testid="crm-activity-filter"
              >
                <option value="">{t.act_all}</option>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {activityLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-3 space-y-2" data-testid="crm-activity-list">
              {activity.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2 text-sm last:border-0"
                >
                  <span className="min-w-0 break-words">
                    {activityLabel(event.type, event.stage)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.at, lang)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">{t.act_demoNote}</p>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-3">
          <div className="rounded-lg border border-border bg-card p-4">
            {perms.canEdit ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor="crm-task-title" className="text-xs font-medium">
                    {t.task_placeholder}
                  </label>
                  <Input
                    id="crm-task-title"
                    className="mt-1 h-[44px]"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    data-testid="crm-task-input"
                  />
                </div>
                <Button
                  className={CONTROL}
                  disabled={!taskTitle.trim()}
                  onClick={() => {
                    const title = taskTitle.trim();
                    if (!title) return;
                    onChange((c) => ({
                      ...c,
                      tasks: [...c.tasks, { id: `${c.id}-t-${c.tasks.length + 1}`, title, done: false }],
                      activity: [
                        ...c.activity,
                        {
                          id: `${c.id}-act-t-${c.activity.length + 1}`,
                          type: "task",
                          at: new Date().toISOString(),
                        },
                      ],
                    }));
                    setTaskTitle("");
                  }}
                  data-testid="crm-task-add"
                >
                  {t.task_add}
                </Button>
              </div>
            ) : null}
            <ul className="mt-3 space-y-2" data-testid="crm-task-list">
              {contact.tasks.length ? (
                contact.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-sm last:border-0"
                  >
                    <span className="min-w-0 break-words">{task.title}</span>
                    {task.done ? (
                      <span className="text-xs text-success">{t.task_completed}</span>
                    ) : perms.canEdit ? (
                      <Button
                        variant="outline"
                        className={CONTROL}
                        onClick={() =>
                          onChange((c) => ({
                            ...c,
                            tasks: c.tasks.map((x) =>
                              x.id === task.id ? { ...x, done: true } : x,
                            ),
                          }))
                        }
                        data-testid={`crm-task-done-${task.id}`}
                      >
                        <Check aria-hidden className="mr-2 h-4 w-4" />
                        {t.task_complete}
                      </Button>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">{t.task_empty}</li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-3">
          <div className="rounded-lg border border-border bg-card p-4">
            {perms.canEdit ? (
              <div className="space-y-2">
                <label htmlFor="crm-note-text" className="text-xs font-medium">
                  {t.note_placeholder}
                </label>
                <Textarea
                  id="crm-note-text"
                  value={noteText}
                  rows={3}
                  onChange={(e) => setNoteText(e.target.value)}
                  data-testid="crm-note-input"
                />
                <Button
                  className={CONTROL}
                  disabled={!noteText.trim()}
                  onClick={() => {
                    const text = noteText.trim();
                    if (!text) return;
                    const at = new Date().toISOString();
                    onChange((c) => ({
                      ...c,
                      notes: [{ id: `${c.id}-n-${c.notes.length + 1}`, text, at }, ...c.notes],
                      activity: [
                        ...c.activity,
                        { id: `${c.id}-act-n-${c.activity.length + 1}`, type: "note", at },
                      ],
                    }));
                    setNoteText("");
                  }}
                  data-testid="crm-note-add"
                >
                  {t.note_add}
                </Button>
              </div>
            ) : null}
            <ul className="mt-3 space-y-2" data-testid="crm-note-list">
              {contact.notes.length ? (
                contact.notes.map((note) => (
                  <li
                    key={note.id}
                    className="border-b border-border/60 pb-2 text-sm last:border-0"
                  >
                    <p className="break-words">{note.text}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(note.at, lang)}</p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">{t.note_empty}</li>
              )}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
