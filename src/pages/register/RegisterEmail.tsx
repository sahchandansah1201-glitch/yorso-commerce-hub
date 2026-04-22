import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import SocialProofBanner from "@/components/registration/SocialProofBanner";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, Loader2 } from "lucide-react";
import analytics from "@/lib/analytics";
import { authApi, getErrorMessage } from "@/lib/api-contracts";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

const RegisterEmail = () => {
  const navigate = useNavigate();
  const { data, setField } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/email");
  const { t } = useLanguage();
  const [email, setEmail] = useState(data.email);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!guardPassed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError(t.reg_emailInvalid);
      return;
    }

    setLoading(true);
    setError("");

    const result = await authApi.startRegistration({
      email,
      role: (data.role as "buyer" | "supplier") || "buyer",
    });

    setLoading(false);

    if (!result.ok) {
      setError(getErrorMessage(result.code));
      toast.error(t.reg_couldNotContinue, { description: result.message });
      analytics.track("api_error", { endpoint: "auth/register/start", code: result.code, ...(result.field ? { field: result.field } : {}) });
      return;
    }

    setField("email", email);
    setField("sessionId", result.data.sessionId);
    analytics.track("registration_email_submitted", { role: data.role || "unknown" });
    navigate("/register/verify");
  };

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {t.reg_enterEmail}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t.reg_emailSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder={t.reg_emailPlaceholder}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="h-14 text-lg px-4 rounded-xl"
            autoFocus
            required
            disabled={loading}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2" disabled={loading}>
          {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> {t.reg_checking}</>) : (<>{t.reg_continue} <ArrowRight className="h-5 w-5" /></>)}
        </Button>

        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          {t.reg_byContAgreeTo}{" "}
          <a href="/terms" className="underline hover:text-foreground">{t.reg_terms}</a>
          {" "}{t.reg_and}{" "}
          <a href="/privacy" className="underline hover:text-foreground">{t.reg_privacyPolicy}</a>.
        </p>
      </form>

      <SocialProofBanner />
      <TrustMicroText variant="growth" delay={0.7} className="mt-4" />
    </RegistrationLayout>
  );
};

export default RegisterEmail;
