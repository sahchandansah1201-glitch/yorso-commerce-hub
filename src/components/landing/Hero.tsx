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
  CheckCircle2,
  Clock,
  BarChart3,
  FileCheck2,
} from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type PainKey = "fraud" | "backup" | "prices" | "compliance";

interface PainState {
  label: string;
  icon: React.ReactNode;
  message: string;
  proof: string;
  secondaryCTA: string;
  secondaryLink: string;
  proofItems: { icon: React.ReactNode; text: string }[];
}

const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePain, setActivePain] = useState<PainKey>("fraud");

  const painStates: Record<PainKey, PainState> = {
    fraud: {
      label: "Avoid Supplier Fraud",
      icon: <ShieldCheck className="h-4 w-4" />,
      message:
        "Every supplier on YORSO passes a multi-step verification — business licenses, export docs, facility certifications. You see real company identities and direct contacts, not anonymous middlemen. No pay-to-play badges.",
      proof: "380 verified suppliers · Multi-step audit process · Direct supplier identity",
      secondaryCTA: "See Verified Offers",
      secondaryLink: "/offers",
      proofItems: [
        { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: "380 verified suppliers" },
        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: "Multi-step audit" },
        { icon: <Users className="h-3.5 w-3.5" />, text: "Direct contacts only" },
      ],
    },
    backup: {
      label: "Find Backup Suppliers Fast",
      icon: <Clock className="h-4 w-4" />,
      message:
        "When your primary supplier fails mid-season, you need alternatives overnight — not next quarter. Browse verified suppliers across 48 countries with live availability, and reduce your single-source risk before it becomes a crisis.",
      proof: "1,247 live offers · 48 countries · New listings added daily",
      secondaryCTA: "Explore Live Offers",
      secondaryLink: "/offers",
      proofItems: [
        { icon: <Package className="h-3.5 w-3.5" />, text: "1,247 live offers" },
        { icon: <Globe className="h-3.5 w-3.5" />, text: "48 countries" },
        { icon: <Clock className="h-3.5 w-3.5" />, text: "New listings daily" },
      ],
    },
    prices: {
      label: "Compare Real Wholesale Prices",
      icon: <BarChart3 className="h-4 w-4" />,
      message:
        "Stop overpaying because you lack market visibility. Compare transparent price ranges from multiple origins, benchmark against real wholesale data, and walk into negotiations with leverage — not guesswork.",
      proof: "1,247 live offers · 2,100+ active buyers · Transparent price ranges",
      secondaryCTA: "Compare Offers",
      secondaryLink: "/offers",
      proofItems: [
        { icon: <Package className="h-3.5 w-3.5" />, text: "1,247 live offers" },
        { icon: <Users className="h-3.5 w-3.5" />, text: "2,100+ active buyers" },
        { icon: <BarChart3 className="h-3.5 w-3.5" />, text: "Transparent prices" },
      ],
    },
    compliance: {
      label: "Pass Compliance Checks",
      icon: <FileCheck2 className="h-4 w-4" />,
      message:
        "Supplier certifications, export documentation, and traceability data — verified before you even start a conversation. HACCP, BRC, MSC, ASC, and export compliance checks are part of our standard verification process.",
      proof: "HACCP · BRC · MSC · ASC · Export docs verified",
      secondaryCTA: "See How Verification Works",
      secondaryLink: "/about",
      proofItems: [
        { icon: <FileCheck2 className="h-3.5 w-3.5" />, text: "HACCP / BRC / MSC / ASC" },
        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: "Export docs verified" },
        { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: "Pre-verified suppliers" },
      ],
    },
  };

  const currentPain = painStates[activePain];

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
    <section className="relative overflow-hidden bg-accent pb-16 pt-20 md:pb-24 md:pt-28">
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

          {/* Stable subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-accent-foreground/70 sm:text-base md:text-lg">
            Source wholesale seafood from verified suppliers worldwide with direct
            contacts, real market visibility, and zero hidden commissions.
          </p>

          {/* Pain selector */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-accent-foreground/40">
              What are you trying to solve today?
            </p>
            <div className="flex flex-nowrap justify-center gap-2 overflow-x-auto pb-1 sm:flex-wrap">
              {(Object.keys(painStates) as PainKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handlePainSelect(key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-200 sm:text-sm",
                    activePain === key
                      ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                      : "border-accent-foreground/10 bg-accent-foreground/[0.03] text-accent-foreground/60 hover:border-accent-foreground/20 hover:text-accent-foreground/80"
                  )}
                >
                  {painStates[key].icon}
                  <span className="whitespace-nowrap">{painStates[key].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pain-specific content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePain}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6"
            >
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-accent-foreground/65">
                {currentPain.message}
              </p>

              {/* Inline proof row */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-accent-foreground/50">
                {currentPain.proofItems.map((item, i) => (
                  <span key={i} className="flex items-center gap-1 text-primary/70">
                    {item.icon}
                    <span className="text-accent-foreground/55">{item.text}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Search box — always visible */}
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

          {/* CTAs — primary constant, secondary pain-driven */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" onClick={() => analytics.track("hero_primary_cta_click")}>
              <Button size="lg" className="w-full gap-2 font-semibold sm:w-auto">
                Register Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePain}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={currentPain.secondaryLink}
                  onClick={() =>
                    analytics.track("hero_secondary_cta_click", { pain: activePain })
                  }
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 border-accent-foreground/20 bg-transparent text-accent-foreground hover:bg-accent-foreground/5 sm:w-auto"
                  >
                    {currentPain.secondaryCTA}
                  </Button>
                </Link>
              </motion.div>
            </AnimatePresence>
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
