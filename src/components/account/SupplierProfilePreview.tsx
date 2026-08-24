import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompanyProfile } from "@/data/mockAccount";
import { getCertificationInfo, sortCertificationCodes } from "@/data/certifications";

const focalToObjectPosition = (f: CompanyProfile["coverFocalPoint"]) =>
  f === "top" ? "center top" : f === "bottom" ? "center bottom" : "center center";

export const SupplierProfilePreview = ({
  company,
  resolveMediaSrc = (value) => value,
}: {
  company: CompanyProfile;
  resolveMediaSrc?: (value: string) => string;
}) => {
  const { t, lang } = useLanguage();
  const certificates = sortCertificationCodes(company.certificates);
  return (
    <Card data-testid="account-supplier-preview">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">{t.account_supplier_preview_title}</CardTitle>
        <p className="text-xs text-muted-foreground">{t.account_supplier_preview_note}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <div
            className="relative w-full bg-muted/40"
            style={{ aspectRatio: "5 / 2" }}
          >
            {company.coverImageUrl ? (
              <img
                src={resolveMediaSrc(company.coverImageUrl)}
                alt={company.coverAlt || company.tradeName}
                className="h-full w-full object-cover"
                style={{ objectPosition: focalToObjectPosition(company.coverFocalPoint) }}
                data-testid="account-supplier-preview-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {t.account_supplier_preview_emptyCover}
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="-mt-8 mb-3 flex items-end gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-card">
                {company.logoImageUrl ? (
                  <img
                    src={resolveMediaSrc(company.logoImageUrl)}
                    alt={company.logoAlt || company.tradeName}
                    className="h-full w-full"
                    style={{ objectFit: company.logoFit }}
                    data-testid="account-supplier-preview-logo"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    {t.account_supplier_preview_emptyLogo}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-heading text-base font-semibold">
                  {company.tradeName || t.account_value_notSpecified}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {company.country || t.account_value_notSpecified}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {company.description || t.account_value_notSpecified}
            </p>
            {certificates.length > 0 ? (
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t.account_company_certificates}
                </p>
                <div className="flex flex-wrap gap-1" data-testid="account-supplier-preview-certificates">
                  {certificates.map((cert) => {
                    const info = getCertificationInfo(cert, lang);
                    return (
                      <Badge key={cert} variant="outline" className="gap-1 text-[11px]">
                        {info.logo ? (
                          <span aria-hidden className="inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-sm">
                            <img
                              src={info.logo}
                              alt=""
                              className="h-full w-full object-contain"
                              style={{ transform: `scale(${info.logoScale ?? 1})` }}
                            />
                          </span>
                        ) : null}
                        {info.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {company.paymentTerms.length > 0 ? (
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t.account_company_paymentTerms}
                </p>
                <ul
                  className="space-y-0.5 text-xs text-muted-foreground"
                  data-testid="account-supplier-preview-paymentTerms"
                >
                  {company.paymentTerms.map((term) => (
                    <li key={term}>• {term}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierProfilePreview;
