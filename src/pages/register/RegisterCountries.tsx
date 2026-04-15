import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Globe } from "lucide-react";
import { SEAFOOD_COUNTRIES } from "@/lib/detectCountry";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";

const POPULAR_BUYER_MARKETS = [
  "Norway", "Chile", "Iceland", "China", "Vietnam", "Thailand",
  "India", "Indonesia", "Ecuador", "Canada", "United States", "Spain",
];

const POPULAR_SUPPLIER_MARKETS = [
  "United States", "Germany", "France", "United Kingdom", "Japan",
  "South Korea", "China", "Spain", "Italy", "Netherlands", "Brazil", "Russia",
];

const RegisterCountries = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/countries");
  const { t } = useLanguage();
  const isSupplier = data.role === "supplier";
  const [selected, setSelected] = useState<string[]>(() => {
    if (data.countries.length > 0) return data.countries;
    if (data.country && SEAFOOD_COUNTRIES.includes(data.country)) return [data.country];
    return [];
  });
  const [showAll, setShowAll] = useState(false);

  if (!guardPassed) return null;

  const popularMarkets = isSupplier ? POPULAR_SUPPLIER_MARKETS : POPULAR_BUYER_MARKETS;
  const displayList = showAll ? SEAFOOD_COUNTRIES : popularMarkets;

  const toggle = (country: string) => {
    setSelected((prev) => prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]);
  };

  const handleSubmit = () => {
    setFields({ countries: selected });
    selected.forEach((c) => { analytics.track("value_destination_selected", { country: c, role: data.role || "unknown" }); });
    analytics.track("registration_countries_completed", { role: data.role || "unknown", countriesCount: selected.length });
    navigate("/register/ready");
  };

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {isSupplier ? t.reg_whereExportTo : t.reg_whereSourceFrom}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isSupplier ? t.reg_countriesSubtitleSupplier : t.reg_countriesSubtitleBuyer}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2.5">
          {displayList.map((country) => {
            const isSelected = selected.includes(country);
            return (
              <button key={country} onClick={() => toggle(country)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {country}
              </button>
            );
          })}
        </div>

        {!showAll && (
          <button onClick={() => setShowAll(true)} className="text-sm text-primary hover:underline font-medium">
            {t.reg_showAllCountries.replace("{count}", String(SEAFOOD_COUNTRIES.length))}
          </button>
        )}

        {selected.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selected.length}</span>{" "}
            {selected.length === 1 ? t.reg_countrySelected : t.reg_countriesSelected}
          </p>
        )}

        <Button onClick={handleSubmit} size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
          {t.reg_completeSetup} <ArrowRight className="h-5 w-5" />
        </Button>

        <button onClick={() => { setFields({ countriesSkipped: true }); analytics.track("registration_countries_skipped"); navigate("/register/ready"); }}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t.reg_skipForNow}
        </button>

        <TrustMicroText variant="global" delay={0.4} className="mt-2" />
      </div>
    </RegistrationLayout>
  );
};

export default RegisterCountries;
