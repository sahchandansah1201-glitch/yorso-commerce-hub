import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OfferCard from "./OfferCard";
import { mockOffers } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";

const LiveOffers = () => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const firstRow = mockOffers.slice(0, 4);
  const extraRows = mockOffers.slice(4, 8);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    analytics.track("live_offers_expand_toggle", { expanded: next });
  };

  return (
    <section id="offers" className="bg-background py-12 md:py-16">
      <div className="container">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span className="text-sm font-medium text-primary">{t.offers_liveMarketplace}</span>
            </div>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {t.offers_title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.offers_subtitle}</p>
          </div>
          <Link
            to="/offers"
            onClick={() => analytics.track("live_offers_view_all_click")}
            className="hidden md:block"
          >
            <Button variant="ghost" className="gap-1 text-sm font-medium text-primary hover:text-primary">
              {t.offers_viewAll}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* First row — always visible */}
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {firstRow.map((offer) => (
            <div key={offer.id} className="min-w-[280px] snap-start sm:min-w-0">
              <Link
                to={`/offers/${offer.id}`}
                onClick={() => analytics.track("live_offer_card_click", { offerId: offer.id, product: offer.productName })}
              >
                <OfferCard offer={offer} />
              </Link>
            </div>
          ))}
        </div>

        {/* Expandable extra rows */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
                {extraRows.map((offer) => (
                  <div key={offer.id} className="min-w-[280px] snap-start sm:min-w-0">
                    <Link
                      to={`/offers/${offer.id}`}
                      onClick={() => analytics.track("live_offer_card_click", { offerId: offer.id, product: offer.productName })}
                    >
                      <OfferCard offer={offer} />
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show more / Show less toggle */}
        {extraRows.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={toggleExpanded}
              className="gap-1.5 font-semibold"
            >
              {expanded ? t.offers_showLess : t.offers_showMore}
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="mt-4 text-center md:hidden">
          <Link to="/offers" onClick={() => analytics.track("live_offers_view_all_click")}>
            <Button variant="outline" className="gap-1 font-semibold">
              {t.offers_viewAllMobile}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LiveOffers;
