import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, Snowflake, Leaf, Thermometer, Package, MapPin, Globe, Scale,
  FileText, Truck, Anchor as AnchorIcon, Lock, ArrowRight,
} from "lucide-react";
import type { SeafoodOffer, DeliveryBasisOption } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { AccessRequestDialog } from "@/components/catalog/AccessRequestDialog";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const StockBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    "In Stock": "bg-success/10 text-success",
    Limited: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "Pre-order": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || colors["In Stock"]}`}>
      {status}
    </span>
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
          {isQualified && <StockBadge status={offer.commercial.stockStatus} />}
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground md:text-2xl leading-tight">{offer.productName}</h1>
        <p className="mt-1 text-sm italic text-muted-foreground">{offer.latinName}</p>
      </div>

      {/* Product specs grid — public */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Cut type" value={offer.cutType} />
        <SpecRow icon={<MapPin className="h-3.5 w-3.5" />} label="Origin" value={`${offer.originFlag} ${offer.origin}`} />
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Packaging" value={offer.packaging} />
        {isQualified && (
          <SpecRow icon={<Scale className="h-3.5 w-3.5" />} label="Volume capacity" value={offer.commercial.availableVolume} />
        )}
      </div>

      {/* Commercial Terms Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-foreground">Commercial Terms</h2>
          {!isQualified && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
        </div>

        {isAnonymous && (
          <div className="p-5 space-y-3 text-center">
            <p className="text-sm font-semibold text-foreground">{t.offerDetail_priceLocked_label}</p>
            <p className="text-xs text-muted-foreground">{t.offerDetail_termsLocked_hint}</p>
            <p className="text-xs text-muted-foreground">
              {t.offerDetail_basisCountAvailable.replace("{n}", String(bases.length))}
            </p>
            <Link to="/register" className="block pt-1">
              <Button className="w-full gap-2" size="sm">
                {t.offerDetail_priceLocked_anonCta} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {isRegistered && (
          <div className="p-4 space-y-4">
            {/* Indicative range only — no exact basis-level price, no volume tiers, no port/lead/payment */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">{t.offerDetail_indicativePrice}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">{offer.priceRange}</span>
                <span className="text-sm text-muted-foreground">{offer.priceUnit}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.offerDetail_termsLocked_hint}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">{t.offerDetail_termsLocked_label}</p>
              <p className="text-xs text-muted-foreground">
                {t.offerDetail_basisCountAvailable.replace("{n}", String(bases.length))}
              </p>
              <Button size="sm" variant="outline" className="w-full gap-2" disabled>
                <Lock className="h-3.5 w-3.5" /> {t.offerDetail_priceLocked_regCta}
              </Button>
            </div>
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
    </div>
  );
};

export default OfferSummary;
