import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { EditableCard } from "./EditableCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CompanyProfile } from "@/data/mockAccount";

interface Props {
  company: CompanyProfile;
  onSave: (next: CompanyProfile) => void;
}

type Draft = Pick<
  CompanyProfile,
  | "logoImageUrl"
  | "logoAlt"
  | "logoFit"
  | "coverImageUrl"
  | "coverAlt"
  | "coverFocalPoint"
>;

const focalToObjectPosition = (f: Draft["coverFocalPoint"]) =>
  f === "top" ? "center top" : f === "bottom" ? "center bottom" : "center center";

export const CompanyMediaCard = ({ company, onSave }: Props) => {
  const { t } = useLanguage();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const initial: Draft = {
    logoImageUrl: company.logoImageUrl,
    logoAlt: company.logoAlt,
    logoFit: company.logoFit,
    coverImageUrl: company.coverImageUrl,
    coverAlt: company.coverAlt,
    coverFocalPoint: company.coverFocalPoint,
  };

  return (
    <EditableCard<Draft>
      title={t.account_company_media_title}
      description={t.account_company_media_desc}
      testId="account-card-company-media"
      initial={initial}
      onSave={(d) => onSave({ ...company, ...d })}
      renderView={(v) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.account_company_media_logo}
            </p>
            <div className="aspect-square w-32 overflow-hidden rounded-md border bg-muted/40">
              {v.logoImageUrl ? (
                <img
                  src={v.logoImageUrl}
                  alt={v.logoAlt || t.account_company_media_logo}
                  className="h-full w-full"
                  style={{ objectFit: v.logoFit }}
                  data-testid="account-media-logo-preview"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                  {t.account_supplier_preview_emptyLogo}
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.account_company_media_cover}
            </p>
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted/40">
              {v.coverImageUrl ? (
                <img
                  src={v.coverImageUrl}
                  alt={v.coverAlt || t.account_company_media_cover}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: focalToObjectPosition(v.coverFocalPoint) }}
                  data-testid="account-media-cover-preview"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                  {t.account_supplier_preview_emptyCover}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      renderEdit={({ draft, setDraft }) => {
        const onPickFile = (key: "logoImageUrl" | "coverImageUrl") => (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            setDraft({ ...draft, [key]: String(reader.result ?? "") });
          };
          reader.readAsDataURL(file);
        };

        return (
          <div className="space-y-6">
            {/* Logo */}
            <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <div className="aspect-square w-32 overflow-hidden rounded-md border bg-muted/40">
                {draft.logoImageUrl ? (
                  <img
                    src={draft.logoImageUrl}
                    alt={draft.logoAlt}
                    className="h-full w-full"
                    style={{ objectFit: draft.logoFit }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                    {t.account_supplier_preview_emptyLogo}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t.account_company_media_logo}</Label>
                <p className="text-[11px] text-muted-foreground">{t.account_company_media_logoHelp}</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickFile("logoImageUrl")}
                    data-testid="account-media-logo-file"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>
                    {t.account_company_media_choose}
                  </Button>
                  {draft.logoImageUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDraft({ ...draft, logoImageUrl: "" })}
                    >
                      {t.account_company_media_clear}
                    </Button>
                  ) : null}
                </div>
                <Input
                  placeholder={t.account_company_media_useUrl}
                  value={draft.logoImageUrl}
                  onChange={(e) => setDraft({ ...draft, logoImageUrl: e.target.value })}
                  data-testid="account-media-logo-url"
                />
                <Input
                  placeholder={t.account_company_media_logoAlt}
                  value={draft.logoAlt}
                  onChange={(e) => setDraft({ ...draft, logoAlt: e.target.value })}
                />
                <div>
                  <Label className="text-xs">{t.account_company_media_logoFit}</Label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={draft.logoFit}
                    onChange={(e) =>
                      setDraft({ ...draft, logoFit: e.target.value as Draft["logoFit"] })
                    }
                  >
                    <option value="contain">{t.account_company_media_fit_contain}</option>
                    <option value="cover">{t.account_company_media_fit_cover}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cover */}
            <div className="space-y-2">
              <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted/40">
                {draft.coverImageUrl ? (
                  <img
                    src={draft.coverImageUrl}
                    alt={draft.coverAlt}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: focalToObjectPosition(draft.coverFocalPoint) }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                    {t.account_supplier_preview_emptyCover}
                  </div>
                )}
              </div>
              <Label className="text-xs">{t.account_company_media_cover}</Label>
              <p className="text-[11px] text-muted-foreground">{t.account_company_media_coverHelp}</p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile("coverImageUrl")}
                  data-testid="account-media-cover-file"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => coverInputRef.current?.click()}>
                  {t.account_company_media_choose}
                </Button>
                {draft.coverImageUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setDraft({ ...draft, coverImageUrl: "" })}
                  >
                    {t.account_company_media_clear}
                  </Button>
                ) : null}
              </div>
              <Input
                placeholder={t.account_company_media_useUrl}
                value={draft.coverImageUrl}
                onChange={(e) => setDraft({ ...draft, coverImageUrl: e.target.value })}
                data-testid="account-media-cover-url"
              />
              <Input
                placeholder={t.account_company_media_coverAlt}
                value={draft.coverAlt}
                onChange={(e) => setDraft({ ...draft, coverAlt: e.target.value })}
              />
              <div>
                <Label className="text-xs">{t.account_company_media_focal}</Label>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={draft.coverFocalPoint}
                  onChange={(e) =>
                    setDraft({ ...draft, coverFocalPoint: e.target.value as Draft["coverFocalPoint"] })
                  }
                >
                  <option value="center">{t.account_company_media_focal_center}</option>
                  <option value="top">{t.account_company_media_focal_top}</option>
                  <option value="bottom">{t.account_company_media_focal_bottom}</option>
                </select>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export default CompanyMediaCard;
