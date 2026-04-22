import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, ShieldCheck, Package, Globe, Users } from "lucide-react";
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
    analytics.track("hero_search_submit", { query: searchQuery });
    navigate("/offers");
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
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-accent-foreground md:text-4xl lg:text-5xl">
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
              <Button type="submit" size="lg" className="h-12 gap-1.5 px-5 font-semibold">
                {t.hero_searchBtn}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-accent-foreground/50">{t.hero_popular}</p>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" onClick={() => analytics.track("hero_primary_cta_click")}>
              <Button size="lg" className="w-full gap-2 font-semibold sm:w-auto">
                {t.hero_registerFree}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#offers" onClick={handleExploreOffers}>
              <Button variant="outline" size="lg" className="w-full gap-2 border-accent-foreground/20 bg-transparent text-accent-foreground hover:bg-accent-foreground/5 sm:w-auto">
                {t.hero_exploreLiveOffers}
              </Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-accent-foreground/60">
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
        </div>
      </div>
    </section>
  );
};

export default Hero;
