import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import SocialProofBanner from "@/components/registration/SocialProofBanner";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import analytics from "@/lib/analytics";

const RegisterVerify = () => {
  const navigate = useNavigate();
  const { data } = useRegistration();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pasted.split("").forEach((ch, i) => {
      if (i < 6) newCode[i] = ch;
    });
    setCode(newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length < 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    analytics.track("registration_email_verified", { role: data.role || "unknown" });
    navigate("/register/details");
  };

  const maskedEmail = data.email
    ? data.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "your email";

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <ShieldCheck className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Check your inbox
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{maskedEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 rounded-xl border border-input bg-background text-center text-2xl font-bold text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
          Verify & Continue <ArrowRight className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => analytics.track("registration_resend_code")}
            className="text-sm text-primary hover:underline font-medium"
          >
            Didn't receive the code? Resend
          </button>
        </div>
      </form>

      <SocialProofBanner variant="strip" />
      <TrustMicroText variant="security" delay={0.6} className="mt-4" />
    </RegistrationLayout>
  );
};

export default RegisterVerify;
