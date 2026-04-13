import { Link } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import analytics from "@/lib/analytics";
import { useEffect } from "react";

const RegisterReady = () => {
  const { data } = useRegistration();
  const isBuyer = data.role !== "supplier";

  useEffect(() => {
    analytics.track("registration_complete", { role: data.role || "unknown" });
  }, []);

  const nextSteps = isBuyer
    ? [
        "Browse live offers from verified suppliers",
        "Save favorites and compare prices",
        "Contact suppliers directly — zero commission",
      ]
    : [
        "Create your first product offer",
        "Complete your company profile",
        "Start receiving buyer inquiries",
      ];

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
          Your {isBuyer ? "buyer" : "supplier"} account is ready. Here's what you can do next:
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 rounded-2xl border border-border bg-card p-6 text-left"
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
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Link to="/offers">
            <Button size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
              {isBuyer ? "Explore Offers" : "Create Your First Offer"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </RegistrationLayout>
  );
};

export default RegisterReady;
