import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import analytics from "@/lib/analytics";
import { authApi, getErrorMessage, isApiError } from "@/lib/api-contracts";
import { toast } from "sonner";
import { useState as useReactState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getCategoryLabel, getCertificationLabel, getVolumeLabel } from "@/i18n/onboarding-labels";

const BUYER_CATEGORIES = [
  "Salmon & Trout", "Shrimp & Prawns", "White Fish (Cod, Haddock, Pollock)",
  "Tuna & Swordfish", "Crab & Lobster", "Squid & Octopus",
  "Mussels & Scallops", "Surimi & Value-Added", "Other",
];

const SUPPLIER_CATEGORIES = [
  "Wild Catch", "Aquaculture / Farming", "Processing & Value-Added",
  "Trading & Distribution", "Cold Storage & Logistics", "Other",
];

const BUYER_VOLUMES = ["< 10 tons/month", "10–50 tons/month", "50–200 tons/month", "200+ tons/month"];
const SUPPLIER_VOLUMES = ["< 50 tons/month", "50–200 tons/month", "200–1000 tons/month", "1000+ tons/month"];

const CERTIFICATIONS = [
  "MSC", "ASC", "HACCP", "BRC", "IFS", "GlobalG.A.P.",
  "BAP", "ISO 22000", "EU Approved", "FDA Registered", "Other",
];

const RegisterOnboarding = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/onboarding");
  const { t, lang } = useLanguage();
  const isSupplier = data.role === "supplier";

  const categories = isSupplier ? SUPPLIER_CATEGORIES : BUYER_CATEGORIES;
  const volumes = isSupplier ? SUPPLIER_VOLUMES : BUYER_VOLUMES;

  const [selected, setSelected] = useState<string[]>(data.categories);
  const [volume, setVolume] = useState(data.volume);
  const [certs, setCerts] = useState<string[]>(data.certifications);
  const [submitting, setSubmitting] = useReactState(false);

  if (!guardPassed) return null;

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((c) => c !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await authApi.submitOnboarding({
      sessionId: data.sessionId, categories: selected, volume, certifications: certs,
    });
    setSubmitting(false);

    if (isApiError(result)) {
      toast.error(t.reg_couldNotSave, { description: getErrorMessage(result.code) });
      analytics.track("api_error", { endpoint: "auth/register/onboarding", code: result.code });
      if (result.code === "VERIFICATION_FAILED") navigate("/register/email");
      return;
    }

    setFields({ categories: selected, volume, certifications: certs });
    analytics.track("registration_onboarding_completed", {
      role: data.role || "unknown", categoriesCount: selected.length, volume, certificationsCount: certs.length,
    });
    navigate("/register/countries");
  };

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {isSupplier ? t.reg_whatDoYouOffer : t.reg_whatDoYouSource}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isSupplier ? t.reg_onboardingSubtitleSupplier : t.reg_onboardingSubtitleBuyer}
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {isSupplier ? t.reg_businessType : t.reg_productCategories}{" "}
            <span className="text-muted-foreground font-normal">{t.reg_selectAllApply}</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const isSelected = selected.includes(cat);
              return (
                <button key={cat} onClick={() => toggleItem(cat, selected, setSelected)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {isSupplier && (
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              {t.reg_certifications}{" "}
              <span className="text-muted-foreground font-normal">{t.reg_selectAllApply}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CERTIFICATIONS.map((cert) => {
                const isSelected = certs.includes(cert);
                return (
                  <button key={cert} onClick={() => toggleItem(cert, certs, setCerts)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {cert}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {isSupplier ? t.reg_monthlyVolumeSupplier : t.reg_monthlyVolumeBuyer}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {volumes.map((v) => (
              <button key={v} onClick={() => setVolume(v)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${volume === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
          {submitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> {t.reg_saving}</>) : (<>{t.reg_continue} <ArrowRight className="h-5 w-5" /></>)}
        </Button>

        <button onClick={() => { setFields({ onboardingSkipped: true }); analytics.track("registration_onboarding_skipped"); navigate("/register/countries"); }}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t.reg_skipForNow}
        </button>

        <TrustMicroText variant="verified" delay={0.4} className="mt-2" />
      </div>
    </RegistrationLayout>
  );
};

export default RegisterOnboarding;
