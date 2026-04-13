import { Link } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, Sparkles, Package, Globe, Award,
  Building, MapPin, Mail, Phone, ShieldCheck, BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import analytics from "@/lib/analytics";
import { useEffect } from "react";
import confetti from "canvas-confetti";

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const RegisterReady = () => {
  const { data, setField } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/ready");
  const isSupplier = data.role === "supplier";
  const firstName = data.fullName?.split(" ")[0] || "there";

  useEffect(() => {
    if (!guardPassed) return;
    setField("completed", true);

    analytics.track("registration_complete", {
      role: data.role || "unknown",
      country: data.country,
      categories: data.categories.length,
      countries: data.countries.length,
    });

    const end = Date.now() + 1500;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#F97316", "#1E3A5F", "#22C55E", "#FBBF24"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#F97316", "#1E3A5F", "#22C55E", "#FBBF24"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [guardPassed]);

  if (!guardPassed) return null;

  const categoriesCount = data.categories.length;
  const countriesCount = data.countries.length;
  const certsCount = data.certifications.length;
  const matchCount = Math.max(12, categoriesCount * 15 + countriesCount * 8);

  const getNextSteps = () => {
    if (isSupplier) {
      const steps = ["Create your first product offer"];
      if (certsCount > 0) {
        steps.push(`Your ${certsCount} certification${certsCount > 1 ? "s" : ""} will be displayed on your profile`);
      } else {
        steps.push("Add certifications to boost buyer trust");
      }
      if (countriesCount > 0) {
        steps.push(`Buyers from your ${countriesCount} target market${countriesCount > 1 ? "s" : ""} will see your offers first`);
      } else {
        steps.push("Set target markets to reach the right buyers");
      }
      return steps;
    }

    const steps: string[] = [];
    if (categoriesCount > 0) {
      const topCat = data.categories[0];
      steps.push(`Browse ${matchCount}+ offers matching "${topCat}" and more`);
    } else {
      steps.push("Browse live offers from verified suppliers");
    }
    if (countriesCount > 0) {
      steps.push(`We'll prioritize offers from your ${countriesCount} selected origin${countriesCount > 1 ? " countries" : " country"}`);
    } else {
      steps.push("Save favorites and compare prices across 48 countries");
    }
    steps.push("Contact suppliers directly — zero commission");
    return steps;
  };

  const nextSteps = getNextSteps();

  const getWelcomeEmoji = () => {
    const map: Record<string, string> = {
      "Russia": "🇷🇺", "United States": "🇺🇸", "Germany": "🇩🇪", "Norway": "🇳🇴",
      "Japan": "🇯🇵", "China": "🇨🇳", "France": "🇫🇷", "Spain": "🇪🇸",
      "Netherlands": "🇳🇱", "United Kingdom": "🇬🇧", "Brazil": "🇧🇷", "India": "🇮🇳",
      "South Korea": "🇰🇷", "Iceland": "🇮🇸", "Chile": "🇨🇱", "Thailand": "🇹🇭",
    };
    return data.country ? map[data.country] || "🌊" : "🌊";
  };

  return (
    <RegistrationLayout hideProgress>
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>

        <motion.h1
          {...anim(0.25)}
          className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
        >
          {getWelcomeEmoji()} Welcome, {firstName}!
        </motion.h1>

        <motion.p {...anim(0.35)} className="mt-3 text-lg text-muted-foreground">
          Your {isSupplier ? "supplier" : "buyer"} profile setup
          {data.company && <> for <span className="font-medium text-foreground">{data.company}</span></>}
          {" "}is complete.
        </motion.p>

        <motion.div
          {...anim(0.4)}
          className="mt-6 rounded-2xl border border-border bg-card p-5 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="h-4.5 w-4.5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Your profile</p>
          </div>
          <div className="space-y-2">
            {data.company && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Building className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.company}</span>
                <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {isSupplier ? "Supplier" : "Buyer"}
                </span>
              </div>
            )}
            {data.country && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.country}</span>
              </div>
            )}
            {data.email && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.email}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-success ml-auto shrink-0" />
              </div>
            )}
            {data.phone && data.phoneVerified && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.phone}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-success ml-auto shrink-0" />
              </div>
            )}
          </div>
        </motion.div>

        {(categoriesCount > 0 || countriesCount > 0) && (
          <motion.div {...anim(0.48)} className="mt-4 grid grid-cols-3 gap-3">
            {categoriesCount > 0 && (
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <Package className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{categoriesCount}</p>
                <p className="text-xs text-muted-foreground">{categoriesCount === 1 ? "category" : "categories"}</p>
              </div>
            )}
            {countriesCount > 0 && (
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <Globe className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{countriesCount}</p>
                <p className="text-xs text-muted-foreground">{countriesCount === 1 ? "market" : "markets"}</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              {isSupplier && certsCount > 0 ? (
                <>
                  <Award className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{certsCount}</p>
                  <p className="text-xs text-muted-foreground">{certsCount === 1 ? "certification" : "certifications"}</p>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{matchCount}+</p>
                  <p className="text-xs text-muted-foreground">matching offers</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        <motion.div {...anim(0.55)} className="mt-4 rounded-2xl border border-border bg-card p-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-heading font-bold text-foreground">What's next for you</p>
          </div>
          <ul className="space-y-3">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...anim(0.65)} className="mt-6">
          <Link to="/offers">
            <Button size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
              {isSupplier ? "Create Your First Offer" : "Explore Offers"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        <TrustMicroText variant="users" delay={0.75} className="mt-5" />
      </div>
    </RegistrationLayout>
  );
};

export default RegisterReady;
