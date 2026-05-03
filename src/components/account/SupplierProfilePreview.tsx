import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompanyProfile } from "@/data/mockAccount";

const focalToObjectPosition = (f: CompanyProfile["coverFocalPoint"]) =>
  f === "top" ? "center top" : f === "bottom" ? "center bottom" : "center center";

export const SupplierProfilePreview = ({ company }: { company: CompanyProfile }) => {
  const { t } = useLanguage();
  return (
    <Card data-testid="account-supplier-preview">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">{t.account_supplier_preview_title}</CardTitle>
        <p className="text-xs text-muted-foreground">{t.account_supplier_preview_note}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <div className="relative aspect-video w-full bg-muted/40">
            {company.coverImageUrl ? (
              <img
                src={company.coverImageUrl}
                alt={company.coverAlt || company.tradeName}
                className="h-full w-full object-cover"
                style={{ objectPosition: focalToObjectPosition(company.coverFocalPoint) }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {t.account_supplier_preview_emptyCover}
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="-mt-12 mb-3 flex items-end gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-card">
                {company.logoImageUrl ? (
                  <img
                    src={company.logoImageUrl}
                    alt={company.logoAlt || company.tradeName}
                    className="h-full w-full"
                    style={{ objectFit: company.logoFit }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    {t.account_supplier_preview_emptyLogo}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-heading text-lg font-semibold">
                  {company.tradeName || t.account_value_notSpecified}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {company.country || t.account_value_notSpecified}
                </p>
              </div>
            </div>
            {company.productFocus.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1">
                {company.productFocus.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[11px]">
                    {p}
                  </Badge>
                ))}
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {company.description || t.account_value_notSpecified}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierProfilePreview;
