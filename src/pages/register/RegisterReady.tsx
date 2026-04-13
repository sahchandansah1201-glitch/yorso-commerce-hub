import { Link } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Package, Globe, Award } from "lucide-react";
import { motion } from "framer-motion";
import analytics from "@/lib/analytics";
import { useEffect } from "react";

const RegisterReady = () => {
  const { data } = useRegistration();
  const isSupplier = data.role === "supplier";

  useEffect(() => {
    analytics.track("registration_complete", { role: data.role || "unknown" });
  }, []);

  const buyerNextSteps = [
    "Browse live offers from verified suppliers",
    "Save favorites and compare prices",
    "Contact suppliers directly — zero commission",
  ];

  const supplierNextSteps = [
    "Create your first product offer",
    "Complete your company profile for verification",
    "Start receiving buyer inquiries",
  ];

  const nextSteps = isSupplier ? supplierNextSteps : buyerNextSteps;

  // Personalized stats
  const categoriesCount = data.categories.length;
  const countriesCount = data.countries.length;
  const hasCerts = data.certifications.length > 0;

  // Mock personalized match count based on selections
  const matchCount = Math.max(12, categoriesCount * 15 + countriesCount * 8);

  return (
    <RegistrationLayout hideProgress>
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
        >
          You're all set, {data.fullName?.split(" ")[0] || "there"}!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3 text-lg text-muted-foreground"
        >
          Your {isSupplier ? "supplier" : "buyer"} account at <span className="font-medium text-foreground">{data.company || "YORSO"}</span> is ready.
        </motion.p>

        {/* Personalized stats */}
        {(categoriesCount > 0 || countriesCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 grid grid-cols-3 gap-3"
          >
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
              {isSupplier && hasCerts ? (
                <>
                  <Award className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{data.certifications.length}</p>
                  <p className="text-xs text-muted-foreground">{data.certifications.length === 1 ? "certification" : "certifications"}</p>
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

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl border border-border bg-card p-6 text-left"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-heading font-bold text-foreground">What's next</p>
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-8"
        >
          <Link to="/offers">
            <Button size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
              {isSupplier ? "Create Your First Offer" : "Explore Offers"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </RegistrationLayout>
  );
};

export default RegisterReady;
