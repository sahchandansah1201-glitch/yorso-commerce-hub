import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import analytics from "@/lib/analytics";

const BUYER_CATEGORIES = [
  "Salmon & Trout", "Shrimp & Prawns", "White Fish (Cod, Haddock, Pollock)",
  "Tuna & Swordfish", "Crab & Lobster", "Squid & Octopus",
  "Mussels & Scallops", "Surimi & Value-Added", "Other",
];

const SUPPLIER_CATEGORIES = [
  "Wild Catch", "Aquaculture / Farming", "Processing & Value-Added",
  "Trading & Distribution", "Cold Storage & Logistics", "Other",
];

const VOLUMES = [
  "< 10 tons/month", "10–50 tons/month", "50–200 tons/month", "200+ tons/month",
];

const RegisterOnboarding = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const isBuyer = data.role !== "supplier";

  const categories = isBuyer ? BUYER_CATEGORIES : SUPPLIER_CATEGORIES;
  const [selected, setSelected] = useState<string[]>(data.categories);
  const [volume, setVolume] = useState(data.volume);

  const toggleCategory = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = () => {
    setFields({ categories: selected, volume });
    analytics.track("registration_onboarding_completed", {
      role: data.role || "unknown",
      categoriesCount: selected.length,
      volume,
    });
    navigate("/register/ready");
  };

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {isBuyer ? "What do you source?" : "What do you offer?"}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isBuyer
            ? "Select categories you're interested in. We'll show you relevant offers."
            : "Select your business type so buyers can find you easily."}
        </p>
      </div>

      <div className="space-y-8">
        {/* Categories */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {isBuyer ? "Product categories" : "Business type"}{" "}
            <span className="text-muted-foreground font-normal">(select all that apply)</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const isSelected = selected.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`
                    inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all
                    ${isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }
                  `}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {isBuyer ? "Monthly sourcing volume" : "Monthly production capacity"}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {VOLUMES.map((v) => (
              <button
                key={v}
                onClick={() => setVolume(v)}
                className={`
                  rounded-xl border px-4 py-3 text-sm font-medium transition-all
                  ${volume === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }
                `}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full h-14 text-base font-semibold rounded-xl gap-2"
        >
          Complete Setup <ArrowRight className="h-5 w-5" />
        </Button>

        <button
          onClick={() => {
            analytics.track("registration_onboarding_skipped");
            navigate("/register/ready");
          }}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now — I'll set this up later
        </button>
      </div>
    </RegistrationLayout>
  );
};

export default RegisterOnboarding;
