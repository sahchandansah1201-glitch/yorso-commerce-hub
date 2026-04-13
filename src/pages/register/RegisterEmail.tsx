import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import SocialProofBanner from "@/components/registration/SocialProofBanner";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import analytics from "@/lib/analytics";

const RegisterEmail = () => {
  const navigate = useNavigate();
  const { data, setField } = useRegistration();
  const [email, setEmail] = useState(data.email);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid business email");
      return;
    }
    setField("email", email);
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
          Enter your business email
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We'll send a verification code to confirm your identity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="h-14 text-lg px-4 rounded-xl"
            autoFocus
            required
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
          Continue <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </form>

      <SocialProofBanner />
      <TrustMicroText variant="growth" delay={0.7} className="mt-4" />
    </RegistrationLayout>
  );
};

export default RegisterEmail;
