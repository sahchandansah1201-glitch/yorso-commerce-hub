import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, Snowflake, Leaf, Thermometer, Package, MapPin, Globe, Scale,
  FileText, FileCheck, Truck, Anchor as AnchorIcon, Lock, ArrowRight,
} from "lucide-react";
import type { SeafoodOffer, DeliveryBasisOption } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { AccessRequestDialog } from "@/components/catalog/AccessRequestDialog";
import CertificationBadges from "@/components/CertificationBadges";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const STOCK_LABELS: Record<string, { label: string; cls: string; dot: string }> = {
  "In Stock": {
    label: "В наличии",
    cls: "bg-success/10 text-success",
    dot: "bg-success",
  },
  Limited: {
    label: "Ограниченно",
    cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  "Pre-order": {
    label: "Под заказ",
    cls: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  "Out of Stock": {
    label: "Нет в наличии",
    cls: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

const StockBadge = ({ status }: { status: string }) => {
  const meta = STOCK_LABELS[status] || STOCK_LABELS["In Stock"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
};

/**
 * Схематический индикатор объёма партии на складе.
 * Точные количества — конфиденциальная информация поставщика,
 * поэтому показываем только уровень: low / medium / high.
 */
const CapacityMeter = ({ status }: { status: string }) => {
  // Эвристика по статусу/описанию из mock-данных. Шкала 1..5.
  const level: 1 | 2 | 3 | 4 | 5 =
    status === "Pre-order"
      ? 1
      : /small/i.test(status)
        ? 2
        : /limited/i.test(status)
          ? 3
          : /high|large/i.test(status)
            ? 5
            : 4;

  const labels = {
    1: "Под заказ",
    2: "Малый объём",
    3: "Ограниченный объём",
    4: "Средний объём",
    5: "Большой объём",
  } as const;

  const barColor =
    level <= 2 ? "bg-orange-500" : level === 3 ? "bg-primary" : "bg-success";

  return (
    <div
      className="inline-flex items-end gap-1"
      role="img"
      aria-label={`Уровень запасов: ${labels[level]}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`w-1.5 rounded-sm transition-colors ${
            i <= level ? barColor : "bg-muted"
          }`}
          style={{ height: `${6 + i * 3}px` }}
        />
      ))}
    </div>
  );
};


const SpecRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 py-1">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

interface Props {
  offer: SeafoodOffer;
  accessLevel?: AccessLevel;
}

const OfferSummary = ({ offer, accessLevel = "qualified_unlocked" }: Props) => {
  const { t } = useLanguage();
  const FormatIcon = formatIcon[offer.format];
  const bases = offer.deliveryBasisOptions;
  const defaultBasis = bases.find((b) => b.isDefault) || bases[0];
  const [selectedBasis, setSelectedBasis] = useState<DeliveryBasisOption>(defaultBasis);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);

  const isAnonymous = accessLevel === "anonymous_locked";
  const isRegistered = accessLevel === "registered_locked";
  const isQualified = accessLevel === "qualified_unlocked";

  return (
    <div className="space-y-5">
      {/* Product identity — public */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <FormatIcon className="h-3 w-3" /> {offer.format}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {offer.freshness}
          </span>
          <StockBadge status={offer.commercial.stockStatus} />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground md:text-2xl leading-tight">{offer.productName}</h1>
        <p className="mt-1 text-sm italic text-muted-foreground">{offer.latinName}</p>
      </div>

      {/* Product specs grid — public. Уровень запасов размещён под Origin
          (правая колонка), чтобы оставаться рядом со страновым контекстом. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Cut type" value={offer.cutType} />
        <SpecRow icon={<MapPin className="h-3.5 w-3.5" />} label="Origin" value={`${offer.originFlag} ${offer.origin}`} />
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Packaging" value={offer.packaging} />
        <div className="flex items-start gap-2 py-1">
          <Scale className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[11px] text-muted-foreground">Уровень запасов</p>
            <div className="mt-1">
              <CapacityMeter
                status={
                  isQualified
                    ? offer.commercial.availableVolume
                    : offer.commercial.stockStatus
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product certifications — public, помогают оценить соответствие до запроса доступа */}
      {offer.certifications && offer.certifications.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5 inline-flex items-center gap-1">
            <FileCheck className="h-3 w-3" /> Сертификаты соответствия
          </p>
          <CertificationBadges certifications={offer.certifications} size="sm" />
        </div>
      )}

      {/* Commercial Terms Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-foreground">Commercial Terms</h2>
          {!isQualified && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
        </div>

        {!isQualified && (
          <div className="p-4 space-y-4">
            {/* Delivery basis selector — buyers must feel that price depends on basis.
                Codes & ports are public; exact per-basis price stays hidden. */}
            {bases.length > 1 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-2">Базис поставки</p>
                <div className="flex flex-wrap gap-1.5">
                  {bases.map((b) => {
                    const active =
                      selectedBasis.code === b.code &&
                      selectedBasis.shipmentPort === b.shipmentPort;
                    return (
                      <button
                        key={b.code + b.shipmentPort}
                        type="button"
                        onClick={() => setSelectedBasis(b)}
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left ${
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                        }`}
                      >
                        <span className="font-semibold">{b.code}</span>
                        <span className="ml-1 text-[11px] opacity-70">
                          {b.shipmentPort.split(",")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Indicative price + volume tiers — compact layout per design.
                Top: overall range. Then min-partition span. Then per-tier rows
                "price · volume". Exact basis price stays gated. */}
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-heading text-2xl font-bold text-foreground">
                  {selectedBasis.priceRange || offer.priceRange}
                </span>
                <span className="text-sm text-muted-foreground border-b border-dotted border-muted-foreground/50">
                  {selectedBasis.priceUnit || offer.priceUnit}
                </span>
                <span className="text-[11px] text-muted-foreground">({selectedBasis.code})</span>
              </div>

              {offer.volumeBreaks && offer.volumeBreaks.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Мин. партия:{" "}
                    <span className="font-bold">
                      {offer.volumeBreaks[0].minQty}
                      {offer.volumeBreaks.length > 1 && (
                        <> – {offer.volumeBreaks[offer.volumeBreaks.length - 1].minQty}</>
                      )}
                    </span>
                  </p>

                  {offer.volumeBreaks.length > 1 && (
                    <ul className="mt-2 space-y-0.5">
                      {offer.volumeBreaks.slice(1).map((vb, i) => (
                        <li
                          key={i}
                          className="flex items-baseline gap-2 text-sm text-foreground"
                        >
                          <span className="font-semibold">{vb.priceRange}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{vb.minQty}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden />
                {isAnonymous
                  ? "Цена и поставщик — после регистрации"
                  : "Точная цена и поставщик — после получения доступа"}
              </p>
            </div>

            {/* CTA — differs by access state */}
            {isAnonymous ? (
              <Link to="/register" className="block">
                <Button className="w-full gap-2" size="sm">
                  {t.offerDetail_priceLocked_anonCta} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={() => setAccessDialogOpen(true)}
              >
                <Lock className="h-3.5 w-3.5" /> {t.offerDetail_priceLocked_regCta}
              </Button>
            )}
          </div>
        )}

        {isQualified && (
          <div className="p-4 space-y-4">
            {/* Delivery basis selector */}
            {bases.length > 1 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-2">Delivery Basis</p>
                <div className="flex flex-wrap gap-1.5">
                  {bases.map((b) => (
                    <button
                      key={b.code + b.shipmentPort}
                      onClick={() => setSelectedBasis(b)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        selectedBasis.code === b.code && selectedBasis.shipmentPort === b.shipmentPort
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                      }`}
                    >
                      <span className="font-semibold">{b.code}</span>
                      <span className="ml-1 text-[11px] opacity-70">{b.shipmentPort.split(",")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Price ({selectedBasis.code})</p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">{selectedBasis.priceRange}</span>
                <span className="text-sm text-muted-foreground">{selectedBasis.priceUnit}</span>
              </div>
              {selectedBasis.note && (
                <p className="mt-1 text-xs text-muted-foreground">{selectedBasis.note}</p>
              )}
            </div>

            {/* Terms grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <SpecRow icon={<AnchorIcon className="h-3.5 w-3.5" />} label="Shipment port" value={selectedBasis.shipmentPort} />
              <SpecRow icon={<Scale className="h-3.5 w-3.5" />} label="MOQ" value={offer.moq.replace("MOQ: ", "")} />
              <SpecRow icon={<FileText className="h-3.5 w-3.5" />} label="Payment" value={offer.commercial.paymentTerms} />
              <SpecRow icon={<Truck className="h-3.5 w-3.5" />} label="Lead time" value={selectedBasis.leadTime} />
              <SpecRow icon={<Globe className="h-3.5 w-3.5" />} label="Incoterm" value={selectedBasis.code} />
            </div>

            {/* Volume breaks */}
            {offer.volumeBreaks && offer.volumeBreaks.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Volume pricing</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      {offer.volumeBreaks.map((vb, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                          <td className="px-3 py-1.5 text-muted-foreground">{vb.minQty}</td>
                          <td className="px-3 py-1.5 font-semibold text-foreground text-right">{vb.priceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Availability indicators — only when fully unlocked */}
      {isQualified && (
        <div className="flex flex-wrap gap-3 text-xs">
          {offer.sampleAvailable && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-success">
              ✓ Sample available
            </span>
          )}
          {offer.inspectionAvailable && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-success">
              ✓ Pre-shipment inspection
            </span>
          )}
        </div>
      )}

      {isRegistered && (
        <AccessRequestDialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen} />
      )}
    </div>
  );
};

export default OfferSummary;
