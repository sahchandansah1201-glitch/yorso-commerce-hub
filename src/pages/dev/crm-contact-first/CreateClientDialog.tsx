/**
 * Create client dialog. Local validation only, no network and no storage.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONTROL, FIELD, ICON_CONTROL } from "./ui";
import {
  CRM_COUNTRY_LABELS,
  type CrmCompany,
  type CrmCountryKey,
} from "./data";
import {
  CRM_LANGS,
  CRM_STAGES,
  crmCopy,
  fillCopy,
  type CrmLang,
  type CrmStage,
} from "./copy";

/** The built-in close control is hidden: a localized one is rendered instead. */
const DIALOG_CLOSE = "[&>button[type=button]]:hidden";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d][\d\s\-().]{6,30}$/;

export type CreateClientValues = {
  firstName: string;
  lastName: string;
  companyId: string;
  newCompanyName: string;
  newCompanyCountry: CrmCountryKey;
  stage: CrmStage;
  email: string;
  phone: string;
  language: CrmLang;
};

const emptyValues = (companyId: string): CreateClientValues => ({
  firstName: "",
  lastName: "",
  companyId,
  newCompanyName: "",
  newCompanyCountry: "NO",
  stage: "New",
  email: "",
  phone: "",
  language: "en",
});

export const CreateClientDialog = ({
  lang,
  open,
  companies,
  ownerName,
  onClose,
  onCreate,
}: {
  lang: CrmLang;
  open: boolean;
  companies: CrmCompany[];
  ownerName: string;
  onClose: () => void;
  onCreate: (values: CreateClientValues) => void;
}) => {
  const t = crmCopy[lang];
  const [values, setValues] = useState<CreateClientValues>(() => emptyValues(""));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues(emptyValues(""));
    setErrors({});
  }, [open]);

  const set = <K extends keyof CreateClientValues>(key: K, value: CreateClientValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const next: Record<string, string> = {};
    if (!values.firstName.trim()) next.firstName = t.err_required;
    if (!values.companyId) next.companyId = t.err_required;
    if (values.companyId === "__new" && !values.newCompanyName.trim())
      next.newCompanyName = t.err_required;
    const email = values.email.trim();
    const phone = values.phone.trim();
    if (!email && !phone) {
      next.email = t.err_channel;
      next.phone = t.err_channel;
    } else {
      if (email && !EMAIL_RE.test(email)) next.email = t.err_email;
      if (phone && !PHONE_RE.test(phone)) next.phone = t.err_phone;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    onCreate({ ...values, email, phone });
  };

  const err = (id: string, message?: string) =>
    message ? (
      <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
        {message}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent
        className={`${DIALOG_CLOSE} max-h-[92dvh] overflow-y-auto`}
        data-testid="crm-create-dialog"
      >
        <div className="absolute right-3 top-3">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className={ICON_CONTROL}
              aria-label={t.form_close}
              title={t.form_close}
              data-testid="crm-create-close"
            >
              <X aria-hidden className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{t.form_title}</DialogTitle>
          <DialogDescription>{fillCopy(t.form_ownerNote, { name: ownerName })}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="crm-f-first" className="text-xs font-medium">
              {t.form_name} <span aria-hidden className="text-destructive">*</span>
            </label>
            <Input
              id="crm-f-first"
              className="mt-1 h-[44px]"
              value={values.firstName}
              aria-invalid={!!errors.firstName || undefined}
              aria-describedby={errors.firstName ? "crm-f-first-error" : undefined}
              onChange={(e) => set("firstName", e.target.value)}
              data-testid="crm-f-first"
            />
            {err("crm-f-first", errors.firstName)}
          </div>

          <div className="min-w-0">
            <label htmlFor="crm-f-last" className="text-xs font-medium">
              {t.form_surname}
            </label>
            <Input
              id="crm-f-last"
              className="mt-1 h-[44px]"
              value={values.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              data-testid="crm-f-last"
            />
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="crm-f-company" className="text-xs font-medium">
              {t.form_company} <span aria-hidden className="text-destructive">*</span>
            </label>
            <select
              id="crm-f-company"
              className={`${FIELD} mt-1`}
              value={values.companyId}
              aria-invalid={!!errors.companyId || undefined}
              aria-describedby={errors.companyId ? "crm-f-company-error" : undefined}
              onChange={(e) => set("companyId", e.target.value)}
              data-testid="crm-f-company"
            >
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">{t.form_company_new}</option>
            </select>
            {err("crm-f-company", errors.companyId)}
          </div>

          {values.companyId === "__new" ? (
            <>
              <div className="min-w-0">
                <label htmlFor="crm-f-newcompany" className="text-xs font-medium">
                  {t.form_company_newName} <span aria-hidden className="text-destructive">*</span>
                </label>
                <Input
                  id="crm-f-newcompany"
                  className="mt-1 h-[44px]"
                  value={values.newCompanyName}
                  aria-invalid={!!errors.newCompanyName || undefined}
                  aria-describedby={errors.newCompanyName ? "crm-f-newcompany-error" : undefined}
                  onChange={(e) => set("newCompanyName", e.target.value)}
                  data-testid="crm-f-newcompany"
                />
                {err("crm-f-newcompany", errors.newCompanyName)}
              </div>
              <div className="min-w-0">
                <label htmlFor="crm-f-newcountry" className="text-xs font-medium">
                  {t.form_company_newCountry}
                </label>
                <select
                  id="crm-f-newcountry"
                  className={`${FIELD} mt-1`}
                  value={values.newCompanyCountry}
                  onChange={(e) => set("newCompanyCountry", e.target.value as CrmCountryKey)}
                  data-testid="crm-f-newcountry"
                >
                  {(Object.keys(CRM_COUNTRY_LABELS) as CrmCountryKey[]).map((code) => (
                    <option key={code} value={code}>
                      {CRM_COUNTRY_LABELS[code][lang]}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          <div className="min-w-0">
            <label htmlFor="crm-f-stage" className="text-xs font-medium">
              {t.form_stage}
            </label>
            <select
              id="crm-f-stage"
              className={`${FIELD} mt-1`}
              value={values.stage}
              onChange={(e) => set("stage", e.target.value as CrmStage)}
              data-testid="crm-f-stage"
            >
              {CRM_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="crm-f-language" className="text-xs font-medium">
              {t.form_language}
            </label>
            <select
              id="crm-f-language"
              className={`${FIELD} mt-1`}
              value={values.language}
              onChange={(e) => set("language", e.target.value as CrmLang)}
              data-testid="crm-f-language"
            >
              {CRM_LANGS.map((code) => (
                <option key={code} value={code}>
                  {code === "ru" ? t.lang_ru : code === "en" ? t.lang_en : t.lang_es}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="crm-f-email" className="text-xs font-medium">
              {t.form_email}
            </label>
            <Input
              id="crm-f-email"
              className="mt-1 h-[44px]"
              value={values.email}
              inputMode="email"
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? "crm-f-email-error" : undefined}
              onChange={(e) => set("email", e.target.value)}
              data-testid="crm-f-email"
            />
            {err("crm-f-email", errors.email)}
          </div>

          <div className="min-w-0">
            <label htmlFor="crm-f-phone" className="text-xs font-medium">
              {t.form_phone}
            </label>
            <Input
              id="crm-f-phone"
              className="mt-1 h-[44px]"
              value={values.phone}
              inputMode="tel"
              aria-invalid={!!errors.phone || undefined}
              aria-describedby={errors.phone ? "crm-f-phone-error" : undefined}
              onChange={(e) => set("phone", e.target.value)}
              data-testid="crm-f-phone"
            />
            {err("crm-f-phone", errors.phone)}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button className={CONTROL} onClick={submit} data-testid="crm-create-submit">
            {t.form_submit}
          </Button>
          <Button
            variant="outline"
            className={CONTROL}
            onClick={onClose}
            data-testid="crm-create-cancel"
          >
            {t.form_cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
