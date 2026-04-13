import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Building2, ShoppingCart } from "lucide-react";
import analytics from "@/lib/analytics";

const roleCards = [
  {
    role: "buyer" as const,
    icon: ShoppingCart,
    title: "I'm a Buyer",
    subtitle: "Source seafood from verified suppliers",
    features: [
      "Access 2,000+ verified offers",
      "Compare prices across 48 countries",
      "Contact suppliers directly — zero commission",
    ],
  },
  {
    role: "supplier" as const,
    icon: Building2,
    title: "I'm a Supplier",
    subtitle: "Reach qualified buyers worldwide",
    features: [
      "Year-round visibility for your products",
      "Direct contact with verified buyers",
      "Zero commission on all deals",
    ],
  },
];

const RegisterChoose = () => {
  const navigate = useNavigate();
  const { setField } = useRegistration();

  const handleChoose = (role: "buyer" | "supplier") => {
    setField("role", role);
    analytics.track("registration_role_selected", { role });
    navigate("/register/email");
  };

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Join YORSO
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Choose how you'll use the platform. It takes under 3 minutes.
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
    </RegistrationLayout>
  );
};

export default RegisterChoose;
