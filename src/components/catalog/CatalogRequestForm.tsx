import { useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
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
  supplierCountry: string;
  volume: string;
  destination: string;
  timing: string;
  notes: string;
};

const empty: FormState = {
  product: "",
  latin: "",
  format: "",
  origin: "",
  supplierCountry: "",
  volume: "",
  destination: "",
  timing: "",
  notes: "",
};

/**
 * Empty-state structured procurement request form.
 * Frontend-only: persists to sessionStorage and surfaces a credible
 * "submitted for review" success state. No backend call.
 */
export const CatalogRequestForm = ({ initialProduct = "" }: Props) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>({ ...empty, product: initialProduct });
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit = form.product.trim().length > 1 && form.volume.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    submitProductRequest({
      product: form.product.trim(),
      latin: form.latin.trim() || undefined,
      format: form.format.trim() || undefined,
      origin: form.origin.trim() || undefined,
      supplierCountry: form.supplierCountry.trim() || undefined,
      volume: form.volume.trim(),
      destination: form.destination.trim() || undefined,
      timing: form.timing.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    analytics.track("catalog_product_request_submit", {
      product: form.product.trim(),
      hasOrigin: !!form.origin,
      hasDestination: !!form.destination,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
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
            setForm(empty);
            setSubmitted(false);
          }}
        >
          {t.catalog_reqForm_success_new}
        </Button>
      </div>
    );
  }

  const optionalTag = (
    <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
      ({t.catalog_reqForm_optional})
    </span>
  );

  return (
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
          <Label htmlFor="rq-supplier-country" className="text-xs">
            {t.catalog_reqForm_supplierCountry}
            {optionalTag}
          </Label>
          <Input
            id="rq-supplier-country"
            value={form.supplierCountry}
            onChange={(e) => update("supplierCountry", e.target.value)}
            placeholder={t.catalog_reqForm_supplierCountryPh}
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

        <div className="space-y-1.5">
          <Label htmlFor="rq-timing" className="text-xs">
            {t.catalog_reqForm_timing}
            {optionalTag}
          </Label>
          <Input
            id="rq-timing"
            value={form.timing}
            onChange={(e) => update("timing", e.target.value)}
            placeholder={t.catalog_reqForm_timingPh}
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
            rows={3}
          />
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
  );
};

export default CatalogRequestForm;
