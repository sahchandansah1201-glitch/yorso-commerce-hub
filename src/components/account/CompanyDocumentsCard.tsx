import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAccountApiClient,
  fileToAccountUploadPayload,
  type CompanyDocument,
} from "@/lib/account-api";
import {
  createLocalCompanyDocument,
  listLocalCompanyDocuments,
} from "@/lib/account-documents-store";
import type { CompanyProfile } from "@/data/mockAccount";

type DocumentType = CompanyDocument["documentType"];
type DocumentVisibility = CompanyDocument["visibility"];

const DOCUMENT_TYPES: DocumentType[] = [
  "business_license",
  "facility_approval",
  "haccp",
  "msc",
  "asc",
  "brc",
  "ifs",
  "health_certificate",
  "origin_certificate",
  "packing_list",
  "other",
];

const VISIBILITY: DocumentVisibility[] = ["private", "buyer_qualified", "public_teaser"];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const documentTypeLabel = (type: DocumentType, t: ReturnType<typeof useLanguage>["t"]) => ({
  business_license: t.account_company_doc_type_business_license,
  facility_approval: t.account_company_doc_type_facility_approval,
  haccp: t.account_company_doc_type_haccp,
  msc: t.account_company_doc_type_msc,
  asc: t.account_company_doc_type_asc,
  brc: t.account_company_doc_type_brc,
  ifs: t.account_company_doc_type_ifs,
  health_certificate: t.account_company_doc_type_health_certificate,
  origin_certificate: t.account_company_doc_type_origin_certificate,
  packing_list: t.account_company_doc_type_packing_list,
  other: t.account_company_doc_type_other,
}[type]);

const visibilityLabel = (visibility: DocumentVisibility, t: ReturnType<typeof useLanguage>["t"]) => ({
  private: t.account_company_doc_visibility_private,
  buyer_qualified: t.account_company_doc_visibility_buyer,
  public_teaser: t.account_company_doc_visibility_teaser,
}[visibility]);

const statusLabel = (status: CompanyDocument["status"], t: ReturnType<typeof useLanguage>["t"]) => ({
  draft: t.account_company_doc_status_draft,
  uploaded: t.account_company_doc_status_uploaded,
  review: t.account_company_doc_status_review,
  approved: t.account_company_doc_status_approved,
  rejected: t.account_company_doc_status_rejected,
  expired: t.account_company_doc_status_expired,
}[status]);

export const CompanyDocumentsCard = ({ company }: { company: CompanyProfile }) => {
  const { t } = useLanguage();
  const client = useMemo(() => createAccountApiClient(), []);
  const [documents, setDocuments] = useState<CompanyDocument[]>(() => listLocalCompanyDocuments());
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("haccp");
  const [visibility, setVisibility] = useState<DocumentVisibility>("buyer_qualified");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!client.enabled) {
      setDocuments(listLocalCompanyDocuments());
      return () => {
        active = false;
      };
    }

    client
      .listCompanyDocuments()
      .then((next) => {
        if (active) setDocuments(next);
      })
      .catch(() => {
        if (active) setError(t.account_company_documents_loadError);
      });

    return () => {
      active = false;
    };
  }, [client, t.account_company_documents_loadError]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setFile(event.target.files?.[0] ?? null);
  };

  const resetForm = () => {
    setTitle("");
    setDocumentType("haccp");
    setVisibility("buyer_qualified");
    setExpiresAt("");
    setFile(null);
  };

  const createDocument = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t.account_company_documents_titleRequired);
      return;
    }
    if (!file) {
      setError(t.account_company_documents_fileRequired);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const upload = await fileToAccountUploadPayload(file);
      const payload = {
        title: trimmedTitle,
        documentType,
        visibility,
        expiresAt: expiresAt || null,
        file: upload,
      };
      const document = client.enabled
        ? await client.createCompanyDocument(payload)
        : createLocalCompanyDocument({ companyId: company.id, ...payload });
      setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
      resetForm();
    } catch {
      setError(t.account_company_documents_uploadError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card data-testid="account-company-documents">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">
              {t.account_company_documents_title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t.account_company_documents_desc}
            </p>
          </div>
          <Badge variant={client.enabled ? "default" : "outline"} data-testid="account-company-documents-mode">
            {client.enabled ? t.account_company_documents_apiMode : t.account_company_documents_localMode}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[minmax(0,1.2fr)_180px_180px]">
          <div className="space-y-1">
            <Label htmlFor="account-company-document-title" className="text-xs">
              {t.account_company_documents_field_title}
            </Label>
            <Input
              id="account-company-document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              data-testid="account-company-document-title"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-company-document-type" className="text-xs">
              {t.account_company_documents_field_type}
            </Label>
            <select
              id="account-company-document-type"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as DocumentType)}
              data-testid="account-company-document-type"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {documentTypeLabel(type, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-company-document-visibility" className="text-xs">
              {t.account_company_documents_field_visibility}
            </Label>
            <select
              id="account-company-document-visibility"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as DocumentVisibility)}
              data-testid="account-company-document-visibility"
            >
              {VISIBILITY.map((item) => (
                <option key={item} value={item}>
                  {visibilityLabel(item, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-company-document-file" className="text-xs">
              {t.account_company_documents_field_file}
            </Label>
            <Input
              id="account-company-document-file"
              type="file"
              onChange={onFileChange}
              data-testid="account-company-document-file"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-company-document-expires" className="text-xs">
              {t.account_company_documents_field_expires}
            </Label>
            <Input
              id="account-company-document-expires"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              data-testid="account-company-document-expires"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={createDocument}
              disabled={loading}
              data-testid="account-company-document-save"
            >
              {loading ? t.account_company_documents_uploading : t.account_company_documents_upload}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert" data-testid="account-company-documents-error">
            {error}
          </p>
        ) : null}

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {t.account_company_documents_empty}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                data-testid="account-company-document-row"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{document.title}</p>
                    <Badge variant="secondary">{statusLabel(document.status, t)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {documentTypeLabel(document.documentType, t)} / {visibilityLabel(document.visibility, t)} / {document.fileName} / {formatSize(document.sizeBytes)}
                  </p>
                  {document.expiresAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.account_company_documents_expiresOn}: {document.expiresAt}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-end">
                  {client.enabled ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={client.fileUrl(document.fileAssetId)}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="account-company-document-download"
                      >
                        {t.account_company_documents_download}
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="outline">{t.account_company_documents_localOnly}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyDocumentsCard;
