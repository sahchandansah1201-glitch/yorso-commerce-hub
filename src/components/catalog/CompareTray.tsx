import { useState } from "react";
import { Scale, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import type { SeafoodOffer } from "@/data/mockOffers";
import { getOfferPriceDetail, getDocumentReadiness, getLandedCostEstimate } from "@/data/mockProcurement";
import { cn } from "@/lib/utils";

interface Props {
  offers: SeafoodOffer[];
  onRemove: (offerId: string) => void;
  onClear: () => void;
  max?: number;
}

const Cell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn("border-b border-border/60 px-3 py-2 align-top text-[12px]", className)}>{children}</td>
);

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <th className="border-b border-border bg-muted/40 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </th>
);

export const CompareTray = ({ offers, onRemove, onClear, max = 5 }: Props) => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const [open, setOpen] = useState(false);

  if (offers.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur"
      data-testid="catalog-compare-tray"
    >
      <div className="container flex flex-wrap items-center gap-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Scale className="h-4 w-4 text-primary" aria-hidden />
          {t.catalog_compare_trayTitle.replace("{count}", String(offers.length)).replace("{max}", String(max))}
        </span>

        <ul className="flex flex-1 flex-wrap items-center gap-1.5">
          {offers.map((o) => (
            <li
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[11px] text-foreground"
            >
              <span className="max-w-[160px] truncate">{o.productName}</span>
              <button
                type="button"
                aria-label={t.catalog_compare_remove}
                onClick={() => onRemove(o.id)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-xs"
          >
            {t.catalog_compare_clear}
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                size="sm"
                className="text-xs font-semibold"
                disabled={offers.length < 2}
                data-testid="catalog-compare-open"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                {t.catalog_compare_open}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.catalog_compare_sheetTitle}</SheetTitle>
                <SheetDescription>{t.catalog_compare_sheetSubtitle}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <HeaderCell>{t.catalog_compare_col_attribute}</HeaderCell>
                      {offers.map((o) => (
                        <HeaderCell key={o.id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={o.image}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            <span className="line-clamp-2 text-[11px] font-semibold text-foreground">
                              {o.productName}
                            </span>
                          </div>
                        </HeaderCell>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Origin */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_origin}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>
                          {o.originFlag} {o.origin}
                        </Cell>
                      ))}
                    </tr>
                    {/* Supplier country */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_supplierCountry}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>
                          {o.supplier.countryFlag} {o.supplier.country}
                        </Cell>
                      ))}
                    </tr>
                    {/* Format / cut */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_format}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>{o.format} · {o.cutType.split(",")[0]}</Cell>
                      ))}
                    </tr>
                    {/* Price */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_price}</Cell>
                      {offers.map((o) => {
                        const d = getOfferPriceDetail(o);
                        if (level === "qualified_unlocked" && d.unitPrice > 0) {
                          return (
                            <Cell key={o.id}>
                              <span className="font-semibold text-foreground">
                                {d.currency} {d.unitPrice.toFixed(2)}
                              </span>
                              <span className="ml-1 text-muted-foreground">/kg</span>
                            </Cell>
                          );
                        }
                        return (
                          <Cell key={o.id}>
                            <span className="text-muted-foreground">
                              {d.currency} {d.floor.toFixed(2)}–{d.ceiling.toFixed(2)} /kg
                            </span>
                          </Cell>
                        );
                      })}
                    </tr>
                    {/* MOQ */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_moq}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>{o.moq}</Cell>
                      ))}
                    </tr>
                    {/* Incoterms / port */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_logistics}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>
                          {o.commercial.incoterm} · {o.commercial.shipmentPort?.split(",")[0] ?? "—"}
                        </Cell>
                      ))}
                    </tr>
                    {/* Payment */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_payment}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>{o.commercial.paymentTerms.split(",")[0]}</Cell>
                      ))}
                    </tr>
                    {/* Certifications */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_certifications}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>
                          {(o.certifications ?? []).join(", ") || "—"}
                        </Cell>
                      ))}
                    </tr>
                    {/* Document readiness */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_docs}</Cell>
                      {offers.map((o) => {
                        const docs = getDocumentReadiness(o);
                        const ready = docs.filter((d) => d.status !== "pending").length;
                        return (
                          <Cell key={o.id}>
                            <span className="font-semibold text-foreground">
                              {ready}/{docs.length}
                            </span>{" "}
                            <span className="text-muted-foreground">{t.catalog_compare_docsReady}</span>
                          </Cell>
                        );
                      })}
                    </tr>
                    {/* 30d move */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_move30}</Cell>
                      {offers.map((o) => {
                        const d = getOfferPriceDetail(o);
                        return (
                          <Cell key={o.id}>
                            <span
                              className={cn(
                                "font-semibold",
                                d.d30.dir === "up"
                                  ? "text-primary"
                                  : d.d30.dir === "down"
                                    ? "text-destructive"
                                    : "text-foreground",
                              )}
                            >
                              {d.d30.pct > 0 ? "+" : ""}
                              {d.d30.pct.toFixed(1)}%
                            </span>
                          </Cell>
                        );
                      })}
                    </tr>
                    {/* Landed cost estimate */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_landed}</Cell>
                      {offers.map((o) => {
                        const lc = getLandedCostEstimate(o, level);
                        if (lc.numericVisible && lc.totalPerKg > 0) {
                          return (
                            <Cell key={o.id}>
                              <span className="font-semibold text-foreground">
                                {lc.currency} {lc.totalPerKg.toFixed(2)}
                              </span>
                              <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                                {t.catalog_panel_landed_estimateBadge}
                              </span>
                            </Cell>
                          );
                        }
                        return (
                          <Cell key={o.id}>
                            <span className="text-muted-foreground">
                              {lc.currency} {lc.rangeLow.toFixed(2)}–{lc.rangeHigh.toFixed(2)}
                            </span>
                            <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                              {t.catalog_panel_landed_estimateBadge}
                            </span>
                          </Cell>
                        );
                      })}
                    </tr>
                    {/* Access state */}
                    <tr>
                      <Cell className="font-semibold text-foreground">{t.catalog_compare_row_access}</Cell>
                      {offers.map((o) => (
                        <Cell key={o.id}>
                          <span className="text-muted-foreground">
                            {level === "qualified_unlocked"
                              ? t.catalog_compare_accessFull
                              : level === "registered_locked"
                                ? t.catalog_compare_accessPartial
                                : t.catalog_compare_accessRestricted}
                          </span>
                        </Cell>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                {t.catalog_compare_disclaimer}
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default CompareTray;
