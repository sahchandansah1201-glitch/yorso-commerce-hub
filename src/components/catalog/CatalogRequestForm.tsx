import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { submitProductRequest, useProductRequests } from "@/lib/catalog-requests";
import analytics from "@/lib/analytics";

type Props = {
  /** Optional initial product hint, e.g. from current search query. */
  initialProduct?: string;
};

type FormState = {
  product: string;
  latin: string;
  format: string;
  origin: string;
  volume: string;
  destination: string;
  notes: string;
};

const empty: FormState = {
  product: "",
  latin: "",
  format: "",
  origin: "",
  volume: "",
  destination: "",
  notes: "",
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Empty-state structured procurement request form.
 * Frontend-only: persists to sessionStorage and surfaces a credible
 * "submitted for review" success state. No backend call.
 */
export const CatalogRequestForm = ({ initialProduct = "" }: Props) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>({ ...empty, product: initialProduct });
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<{ name: string; dataUrl: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittedList = useProductRequests();
  const productDirtyRef = useRef(false);

  // Keep `product` aligned with the live search query while the user has not
  // manually edited the field. This handles the empty-results case where the
  // buyer keeps refining the catalog search and we want the request form to
  // reflect the latest query without overriding user input.
  useEffect(() => {
    if (productDirtyRef.current) return;
    setForm((prev) => (prev.product === initialProduct ? prev : { ...prev, product: initialProduct }));
  }, [initialProduct]);

  const update = <K extends keyof FormState>(key: K, value: string) => {
    if (key === "product") productDirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const acceptFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError(t.catalog_reqForm_photoTooLarge);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t.catalog_reqForm_photoTooLarge);
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto({ name: file.name, dataUrl: String(reader.result ?? "") });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSubmit = form.product.trim().length > 1 && form.volume.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    submitProductRequest({
      product: form.product.trim(),
      latin: form.latin.trim() || undefined,
      format: form.format.trim() || undefined,
      origin: form.origin.trim() || undefined,
      volume: form.volume.trim(),
      destination: form.destination.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    analytics.track("catalog_product_request_submit", {
      product: form.product.trim(),
      hasOrigin: !!form.origin,
      hasDestination: !!form.destination,
    });
    setSubmitted(true);
  };

  const submittedHistory = submittedList.length > 0 && (
    <section
      className="rounded-lg border border-border bg-card/60 p-4"
      data-testid="catalog-request-form-history"
    >
      <header className="mb-3 flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {t.catalog_reqForm_submitted_title}
          </h4>
          <p className="text-xs text-muted-foreground">{t.catalog_reqForm_submitted_subtitle}</p>
        </div>
      </header>
      <ul className="space-y-2">
        {submittedList.map((r) => {
          const meta = [r.format, r.origin, r.destination]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={r.id}
              className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{r.product}</span>
                <span className="text-muted-foreground">{r.volume}</span>
              </div>
              {meta && <p className="mt-0.5 text-muted-foreground">{meta}</p>}
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.catalog_reqForm_submitted_at}: {new Date(r.submittedAt).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );

  if (submitted) {
    return (
      <div className="space-y-5">
        <div
          className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center"
          data-testid="catalog-request-form-success"
        >
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <h3 className="mt-3 font-heading text-base font-bold text-foreground">
            {t.catalog_reqForm_success_title}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            {t.catalog_reqForm_success_body}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 font-semibold"
            onClick={() => {
              productDirtyRef.current = false;
              setForm({ ...empty, product: initialProduct });
              setPhoto(null);
              setPhotoError(null);
              setSubmitted(false);
            }}
          >
            {t.catalog_reqForm_success_new}
          </Button>
        </div>
        {submittedHistory}
      </div>
    );
  }

  const optionalTag = (
    <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
      ({t.catalog_reqForm_optional})
    </span>
  );

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card p-5 sm:p-6"
        data-testid="catalog-request-form"
      >
      <div className="mb-4">
        <h3 className="font-heading text-base font-bold text-foreground">{t.catalog_reqForm_title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.catalog_reqForm_subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="rq-product" className="text-xs">
            {t.catalog_reqForm_product}
          </Label>
          <Input
            id="rq-product"
            required
            value={form.product}
            onChange={(e) => update("product", e.target.value)}
            placeholder={t.catalog_reqForm_productPh}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rq-latin" className="text-xs">
            {t.catalog_reqForm_latin}
            {optionalTag}
          </Label>
          <Input
            id="rq-latin"
            value={form.latin}
            onChange={(e) => update("latin", e.target.value)}
            placeholder={t.catalog_reqForm_latinPh}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rq-format" className="text-xs">
            {t.catalog_reqForm_format}
            {optionalTag}
          </Label>
          <Input
            id="rq-format"
            value={form.format}
            onChange={(e) => update("format", e.target.value)}
            placeholder={t.catalog_reqForm_formatPh}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rq-origin" className="text-xs">
            {t.catalog_reqForm_origin}
            {optionalTag}
          </Label>
          <Input
            id="rq-origin"
            value={form.origin}
            onChange={(e) => update("origin", e.target.value)}
            placeholder={t.catalog_reqForm_originPh}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rq-volume" className="text-xs">
            {t.catalog_reqForm_volume}
          </Label>
          <Input
            id="rq-volume"
            required
            value={form.volume}
            onChange={(e) => update("volume", e.target.value)}
            placeholder={t.catalog_reqForm_volumePh}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rq-destination" className="text-xs">
            {t.catalog_reqForm_destination}
            {optionalTag}
          </Label>
          <Input
            id="rq-destination"
            value={form.destination}
            onChange={(e) => update("destination", e.target.value)}
            placeholder={t.catalog_reqForm_destinationPh}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="rq-notes" className="text-xs">
            {t.catalog_reqForm_notes}
            {optionalTag}
          </Label>
          <Textarea
            id="rq-notes"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder={t.catalog_reqForm_notesPh}
            rows={2}
            className="min-h-[60px]"
          />
        </div>

        {/* Photo upload — frontend-only, helps suppliers understand the request */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="rq-photo" className="text-xs">
            {t.catalog_reqForm_photo}
            {optionalTag}
          </Label>
          <p className="text-[11px] text-muted-foreground">{t.catalog_reqForm_photoHint}</p>
          <input
            ref={fileInputRef}
            id="rq-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoChange}
          />
          {photo ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
              <img
                src={photo.dataUrl}
                alt={photo.name}
                className="h-16 w-16 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{photo.name}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removePhoto}
                className="gap-1 text-xs text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" /> {t.catalog_reqForm_photoRemove}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" /> {t.catalog_reqForm_photoAdd}
            </Button>
          )}
          {photoError && (
            <p className="text-[11px] text-destructive">{photoError}</p>
          )}
        </div>
      </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="font-semibold"
            data-testid="catalog-request-form-submit"
          >
            {t.catalog_reqForm_submit}
          </Button>
        </div>
      </form>
      {submittedHistory}
    </div>
  );
};

export default CatalogRequestForm;
