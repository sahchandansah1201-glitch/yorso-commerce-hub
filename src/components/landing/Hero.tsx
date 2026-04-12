import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Package,
  Globe,
  Users,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";
import { cn } from "@/lib/utils";

type PainKey = "fraud" | "backup" | "prices" | "compliance";

interface PainState {
  label: string;
  icon: React.ElementType;
  message: string;
  proof: string;
  secondaryCta: string;
  secondaryLink: string;
}

const painStates: Record<PainKey, PainState> = {
  fraud: {
    label: "Avoid Supplier Fraud",
    icon: AlertTriangle,
    message:
      "Every supplier on YORSO passes a multi-step verification — business licenses, facility audits, and trade references. You see real company identities and direct contacts. No anonymity, no bait-and-switch.",
    proof: `${marketplaceStats.verifiedSuppliers} verified suppliers · Direct identity & contacts · Multi-step audit process`,
    secondaryCta: "See Verified Offers",
    secondaryLink: "/offers",
  },
  backup: {
    label: "Find Backup Suppliers Fast",
    icon: RefreshCw,
    message:
      "When your primary supplier fails mid-season, you need alternatives overnight — not in weeks. Browse active offers across ${countries} countries and contact verified suppliers directly, with no intermediary delays.",
    proof: `${marketplaceStats.totalOffers.toLocaleString()} live offers · ${marketplaceStats.countries} countries · New listings daily`,
    secondaryCta: "Explore Live Offers",
    secondaryLink: "/offers",
  },
  prices: {
    label: "Compare Real Wholesale Prices",
    icon: BarChart3,
    message:
      "Stop negotiating blind. See real wholesale price ranges across origins and suppliers. Benchmark your current costs, identify savings, and negotiate from a position of market knowledge.",
    proof: `${marketplaceStats.totalOffers.toLocaleString()} live offers · ${marketplaceStats.activeBuyers.toLocaleString()}+ active buyers · Transparent price ranges`,
    secondaryCta: "Compare Offers",
    secondaryLink: "/offers",
  },
  compliance: {
    label: "Pass Compliance Checks",
    icon: ClipboardCheck,
    message:
      "Supplier verification includes HACCP, BRC, IFS certifications, export documentation checks, and trade sanctions screening. Build a supplier shortlist your compliance team will approve the first time.",
    proof: "HACCP · BRC · IFS · Export docs verified · Sanctions screening",
    secondaryCta: "See How Verification Works",
    secondaryLink: "/about",
  },
};

// Fix template literal in backup message
painStates.backup.message = `When your primary supplier fails mid-season, you need alternatives overnight — not in weeks. Browse active offers across ${marketplaceStats.countries} countries and contact verified suppliers directly, with no intermediary delays.`;

const painKeys: PainKey[] = ["fraud", "backup", "prices", "compliance"];

const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePain, setActivePain] = useState<PainKey>("fraud");

  const current = painStates[activePain];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("hero_search_submit", { query: searchQuery });
    navigate("/offers");
  };

  const handlePainSelect = (key: PainKey) => {
    setActivePain(key);
    analytics.track("hero_pain_tab_click", { pain: key });
  };

  return (
    <section className="relative overflow-hidden bg-accent pb-14 pt-20 md:pb-20 md:pt-28">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Stable H1 */}
          <h1 className="font-heading text-2xl font-extrabold leading-[1.15] tracking-tight text-accent-foreground sm:text-3xl md:text-4xl lg:text-[2.75rem]">
            Verified Suppliers. Transparent Prices.
            <span className="block text-primary">Full Control Over Your Sourcing.</span>
          </h1>

          {/* Stable supporting line */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-accent-foreground/70 md:text-lg">
            Source wholesale seafood from verified suppliers worldwide with direct contacts, real market visibility, and zero hidden commissions.
          </p>

          {/* Search box */}
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

          {/* Pain selector */}
          <div className="mx-auto mt-10 max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground/50">
              What are you trying to solve today?
            </p>

            {/* Pain tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {painKeys.map((key) => {
                const pain = painStates[key];
                const Icon = pain.icon;
                const isActive = activePain === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePainSelect(key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-accent-foreground shadow-sm"
                        : "border-accent-foreground/10 bg-accent-foreground/5 text-accent-foreground/60 hover:border-accent-foreground/20 hover:text-accent-foreground/80"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-accent-foreground/40")} />
                    {pain.label}
                  </button>
                );
              })}
            </div>

            {/* Pain content — only this changes */}
            <div className="mt-6 rounded-xl border border-accent-foreground/10 bg-accent-foreground/[0.03] px-6 py-5">
              <p className="text-sm leading-relaxed text-accent-foreground/80 md:text-base">
                {current.message}
              </p>
              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {current.proof}
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" onClick={() => analytics.track("hero_primary_cta_click")}>
              <Button size="lg" className="w-full gap-2 font-semibold sm:w-auto">
                {t.hero_registerFree}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              to={current.secondaryLink}
              onClick={() => analytics.track("hero_secondary_cta_click", { pain: activePain })}
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 border-accent-foreground/20 bg-transparent text-accent-foreground hover:bg-accent-foreground/5 sm:w-auto"
              >
                {current.secondaryCta}
              </Button>
            </Link>
          </div>

          {/* Proof rail */}
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
