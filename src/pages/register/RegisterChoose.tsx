import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Building2, ShoppingCart } from "lucide-react";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";

const RegisterChoose = () => {
  const navigate = useNavigate();
  const { setField } = useRegistration();
  const { t } = useLanguage();

  const roleCards = [
    {
      role: "buyer" as const,
      icon: ShoppingCart,
      title: t.reg_imBuyer,
      subtitle: t.reg_buyerSubtitle,
      features: t.reg_buyerFeatures,
    },
    {
      role: "supplier" as const,
      icon: Building2,
      title: t.reg_imSupplier,
      subtitle: t.reg_supplierSubtitle,
      features: t.reg_supplierFeatures,
    },
  ];

  const handleChoose = (role: "buyer" | "supplier") => {
    setField("role", role);
    setField("startedAt", Date.now());
    analytics.track("registration_role_selected", { role, step: 1 });
    navigate("/register/email");
  };

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {t.reg_joinYorso}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t.reg_chooseSubtitle}
        </p>
      </div>

      <div className="space-y-4">
        {roleCards.map(({ role, icon: Icon, title, subtitle, features }) => (
          <button
            key={role}
            onClick={() => handleChoose(role)}
            className="group w-full rounded-2xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-heading text-xl font-bold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                <ul className="mt-3 space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        ))}
      </div>

      <TrustMicroText variant="users" delay={0.6} className="mt-8" />
    </RegistrationLayout>
  );
};

export default RegisterChoose;
