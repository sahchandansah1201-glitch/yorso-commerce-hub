import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, ShieldCheck, Package, Globe, Users, ChevronRight } from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";

const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const subtitle = t.hero_subtitle
    .replace("{suppliers}", marketplaceStats.verifiedSuppliers.toString())
    .replace("{countries}", marketplaceStats.countries.toString());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    analytics.track("hero_search_submit", { query: q });
    navigate(q ? `/offers?q=${encodeURIComponent(q)}` : "/offers");
  };

  const handleExploreOffers = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    analytics.track("hero_secondary_cta_click");
    const target = document.getElementById("offers");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("yorso:highlight-offers"));
    }, 450);
  };

  return (
    <section className="relative overflow-hidden bg-accent pb-14 pt-20 md:pb-20 md:pt-28">
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 data-testid="page-title" className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-accent-foreground md:text-4xl lg:text-5xl">
            {t.hero_title1}
            <span className="block text-primary">{t.hero_title2}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-accent-foreground/70 md:text-lg">
            {subtitle}
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-lg">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.hero_searchPlaceholder}
                  className="h-12 rounded-lg border-accent-foreground/20 bg-accent-foreground/5 pl-10 text-sm text-accent-foreground placeholder:text-accent-foreground/40 focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-5 font-semibold">
                {t.hero_searchBtn}
              </Button>
            </div>
            <p className="mt-2 text-xs text-accent-foreground/50">{t.hero_popular}</p>
          </form>

          {/*
           * Secondary CTA: scroll down to live offers. This is the natural
           * next step for a buyer who hasn't searched yet — they should see
           * the product before being asked to register.
           */}
          <div className="mt-6 flex justify-center">
            <a
              href="#offers"
              onClick={handleExploreOffers}
              className="inline-flex h-11 items-center gap-1.5 rounded-md border border-accent-foreground/25 bg-transparent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t.hero_exploreLiveOffers}
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-accent-foreground/60 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.totalOffers.toLocaleString()} {t.hero_liveOffers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.verifiedSuppliers} {t.hero_verifiedSuppliers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.countries} {t.hero_countries}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.activeBuyers.toLocaleString()}+ {t.hero_activeBuyers}</span>
            </div>
          </div>

          {/*
           * Tertiary registration line. Registration is presented as a
           * mechanism (needed for exact prices and supplier contacts),
           * not as the primary action. Buyer reaches it naturally after
           * scanning offers and hitting an access wall.
           */}
          <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-accent-foreground/55">
            <Link
              to="/register"
              onClick={() => analytics.track("hero_primary_cta_click")}
              className="font-semibold text-accent-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              {t.hero_registerFree}
            </Link>
            <span className="ml-1.5">{t.hero_registerHint}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
