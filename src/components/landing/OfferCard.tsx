import { Button } from "@/components/ui/button";
import { Clock, Snowflake, Leaf, Thermometer } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import CertificationBadges from "@/components/CertificationBadges";

interface OfferCardProps {
  offer: SeafoodOffer;
}

const formatIcon = {
  Frozen: Snowflake,
  Fresh: Leaf,
  Chilled: Thermometer,
};

const translateFreshness = (raw: string, t: { card_listedToday: string; card_updatedAgo: string }) => {
  if (/listed today/i.test(raw)) return t.card_listedToday;
  const m = raw.match(/Updated\s+(.+?)\s+ago/i);
  if (m) return (t.card_updatedAgo as string).replace("{time}", m[1]);
  return raw;
};

const OfferCard = ({ offer }: OfferCardProps) => {
  const { t } = useLanguage();
  const FormatIcon = formatIcon[offer.format];
  const formatLabels = { Frozen: t.card_frozen, Fresh: t.card_fresh, Chilled: t.card_chilled };
  const [activeCert, setActiveCert] = useState<CertificationInfo | null>(null);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.image}
          alt={offer.productName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            <Clock className="h-3 w-3 text-primary" />
            {translateFreshness(offer.freshness, t)}
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            <span>{offer.originFlag}</span>
            {offer.origin}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">
          {offer.productName}
        </h3>
        <p className="mt-0.5 text-[11px] italic text-muted-foreground">{offer.latinName}</p>

        {offer.certifications && offer.certifications.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {offer.certifications.slice(0, 3).map((cert) => (
              <button
                key={cert}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveCert(getCertificationInfo(cert));
                }}
                className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`View details for ${cert} certification`}
              >
                <Award className="h-2.5 w-2.5 text-primary" />
                {cert}
              </button>
            ))}
          </div>
        )}

        <Dialog open={!!activeCert} onOpenChange={(open) => !open && setActiveCert(null)}>
          <DialogContent className="sm:max-w-md">
            {activeCert && (
              <>
                <DialogHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <DialogTitle className="font-heading text-lg">
                    {activeCert.fullName}
                  </DialogTitle>
                  <DialogDescription className="text-xs uppercase tracking-wide text-primary">
                    {activeCert.code}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm leading-relaxed text-foreground">
                  {activeCert.description}
                </p>
                <div className="mt-2 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Issuer: </span>
                    {activeCert.issuer}
                  </div>
                  {activeCert.website && (
                    <a
                      href={activeCert.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Official website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>


        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold text-foreground">{offer.priceRange}</span>
            <span className="text-xs text-muted-foreground">{t.card_perKg}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="mt-3 w-full text-xs font-semibold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {t.card_viewOffer}
        </Button>
      </div>
    </div>
  );
};

export default OfferCard;
