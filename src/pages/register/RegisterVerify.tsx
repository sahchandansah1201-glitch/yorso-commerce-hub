import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import SocialProofBanner from "@/components/registration/SocialProofBanner";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import analytics from "@/lib/analytics";
import { authApi, getErrorMessage, isApiError } from "@/lib/api-contracts";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

const RegisterVerify = () => {
  const navigate = useNavigate();
  const { data, setField } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/verify");
  const { t } = useLanguage();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const attemptsRef = useRef(0);
  const resendCountRef = useRef(0);
  const lastResendAtRef = useRef<number | null>(null);
  /** Set when the user resends; cleared after the next verify attempt emits an outcome. */
  const pendingResendRef = useRef<{ resendIndex: number; resendAt: number } | null>(null);

  if (!guardPassed) return null;

  const submitCode = async (full: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    attemptsRef.current += 1;
    const enteredCodeLength = full.length;
    const result = await authApi.verifyEmail({ sessionId: data.sessionId, code: full });
    setLoading(false);
    submittingRef.current = false;

    if (isApiError(result)) {
      setError(getErrorMessage(result.code));
      toast.error(t.reg_verificationFailed, { description: result.message });
      analytics.track("api_error", { endpoint: "auth/register/verify-email", code: result.code });
      const allowedReasons = ["INVALID_CODE", "CODE_EXPIRED", "TOO_MANY_ATTEMPTS", "VERIFICATION_FAILED", "SERVER_ERROR", "NETWORK_ERROR"] as const;
      type FailReason = typeof allowedReasons[number] | "UNKNOWN";
      const reason: FailReason = (allowedReasons as readonly string[]).includes(result.code)
        ? (result.code as FailReason)
        : "UNKNOWN";
      analytics.track("registration_email_verification_failed", {
        role: data.role || "unknown",
        step: 3,
        sessionId: data.sessionId,
        reason,
        attempt: attemptsRef.current,
        elapsedMs: data.emailSubmittedAt > 0 ? Date.now() - data.emailSubmittedAt : null,
        enteredCodeLength,
        isResend: resendCountRef.current > 0,
      });
      if (reason === "TOO_MANY_ATTEMPTS" || result.code === "RATE_LIMITED") {
        analytics.track("registration_verification_blocked", {
          role: data.role || "unknown",
          step: 3,
          sessionId: data.sessionId,
          reason: reason === "TOO_MANY_ATTEMPTS" ? "TOO_MANY_ATTEMPTS" : "RATE_LIMITED",
          attempt: attemptsRef.current,
          retryAfterSec: typeof result.retryAfterSec === "number" ? result.retryAfterSec : null,
        });
      }
      if (pendingResendRef.current) {
        const { resendIndex, resendAt } = pendingResendRef.current;
        pendingResendRef.current = null;
        analytics.track("registration_resend_outcome", {
          role: data.role || "unknown",
          step: 3,
          sessionId: data.sessionId,
          resendIndex,
          outcome: "failed",
          reason,
          msFromResendToAttempt: Date.now() - resendAt,
          enteredCodeLength,
        });
      }
      if (result.code === "VERIFICATION_FAILED") setTimeout(() => navigate("/register/email"), 1500);
      return;
    }

    setField("emailVerified", true);
    const verificationLatencyMs = data.emailSubmittedAt > 0 ? Date.now() - data.emailSubmittedAt : null;
    analytics.track("registration_email_verified", {
      role: data.role || "unknown",
      step: 3,
      sessionId: data.sessionId,
      verificationLatencyMs,
      isResend: resendCountRef.current > 0,
      attempt: attemptsRef.current,
    });
    if (pendingResendRef.current) {
      const { resendIndex, resendAt } = pendingResendRef.current;
      pendingResendRef.current = null;
      analytics.track("registration_resend_outcome", {
        role: data.role || "unknown",
        step: 3,
        sessionId: data.sessionId,
        resendIndex,
        outcome: "succeeded",
        reason: null,
        msFromResendToAttempt: Date.now() - resendAt,
        enteredCodeLength,
      });
    }
    navigate("/register/details");
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    // Auto-submit when all 6 digits filled
    if (value && newCode.every(d => d !== "")) {
      submitCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pasted.split("").forEach((ch, i) => { if (i < 6) newCode[i] = ch; });
    setCode(newCode);
    // Auto-submit if pasted full code
    if (newCode.every(d => d !== "")) {
      submitCode(newCode.join(""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length < 6) { setError(t.reg_enterFullCode); return; }
    submitCode(full);
  };

  const handleResend = () => {
    const now = Date.now();
    resendCountRef.current += 1;
    const resendIndex = resendCountRef.current;
    // If a previous resend never produced a verify attempt (user resent twice in a row),
    // emit its outcome as "abandoned"-style failed with reason=null so we never lose it.
    if (pendingResendRef.current) {
      const prev = pendingResendRef.current;
      analytics.track("registration_resend_outcome", {
        role: data.role || "unknown",
        step: 3,
        sessionId: data.sessionId,
        resendIndex: prev.resendIndex,
        outcome: "failed",
        reason: null,
        msFromResendToAttempt: null,
        enteredCodeLength: 0,
      });
    }
    analytics.track("registration_resend_code", {
      role: data.role || "unknown",
      step: 3,
      sessionId: data.sessionId,
      resendIndex,
      attemptsBeforeResend: attemptsRef.current,
      msSinceEmailSubmitted: data.emailSubmittedAt > 0 ? now - data.emailSubmittedAt : null,
      msSinceLastResend: lastResendAtRef.current !== null ? now - lastResendAtRef.current : null,
    });
    lastResendAtRef.current = now;
    pendingResendRef.current = { resendIndex, resendAt: now };
    toast.success(t.reg_codeResent, { description: t.reg_codeResentDesc });
  };

  const maskedEmail = data.email ? data.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "your email";

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <ShieldCheck className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {t.reg_checkInbox}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t.reg_codeSentTo} <span className="font-medium text-foreground">{maskedEmail}</span>
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
              className="h-14 w-12 rounded-xl border border-input bg-background text-center text-2xl font-bold text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
              autoFocus={i === 0}
              disabled={loading}
            />
          ))}
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2" disabled={loading}>
          {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> {t.reg_verifying}</>) : (<>{t.reg_verifyAndContinue} <ArrowRight className="h-5 w-5" /></>)}
        </Button>

        <div className="text-center space-y-2">
          <button type="button" onClick={handleResend} className="text-sm text-primary hover:underline font-medium" disabled={loading}>
            {t.reg_didntReceive}
          </button>
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                setField("emailVerified", true);
                analytics.track("registration_email_verified", {
                  role: data.role || "unknown",
                  step: 3,
                  sessionId: data.sessionId,
                  verificationLatencyMs: null,
                  isResend: false,
                  attempt: 0,
                });
                navigate("/register/details");
              }}
              className="block mx-auto text-xs text-muted-foreground/50 hover:text-muted-foreground underline"
            >
              Skip verification (Dev)
            </button>
          )}
        </div>
      </form>

      <SocialProofBanner variant="strip" />
      <TrustMicroText variant="security" delay={0.6} className="mt-4" />
    </RegistrationLayout>
  );
};

export default RegisterVerify;
