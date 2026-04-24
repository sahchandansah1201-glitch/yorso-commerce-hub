import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { detectCountry, detectCountryByIP } from "@/lib/detectCountry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Mail, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import CountryPhoneInput from "@/components/registration/CountryPhoneInput";
import analytics from "@/lib/analytics";
import { authApi, getErrorMessage, isApiError } from "@/lib/api-contracts";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import Header from "@/components/landing/Header";

type LoginMethod = "email" | "phone";
type View = "login" | "forgot";

/**
 * Returns a safe in-app redirect path. Rejects external URLs, protocol-relative
 * paths, and anything that doesn't start with a single "/".
 */
const sanitizeRedirect = (raw: string | null): string => {
  if (!raw) return "/workspace";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/workspace";
  return raw;
};

const SignIn = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn, isSignedIn } = useBuyerSession();
  const [searchParams] = useSearchParams();
  const redirectTo = useMemo(
    () => sanitizeRedirect(searchParams.get("redirect")),
    [searchParams],
  );

  // If already signed in, skip the form entirely.
  useEffect(() => {
    if (isSignedIn) navigate(redirectTo, { replace: true });
  }, [isSignedIn, redirectTo, navigate]);

  const [method, setMethod] = useState<LoginMethod>("email");
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => detectCountry());

  // Enhance with IP-based detection if timezone/language didn't match
  useEffect(() => {
    if (!phoneCountry) {
      detectCountryByIP().then((c) => {
        if (c) setPhoneCountry(c);
      });
    }
    // Run-once IP detection on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [signinLoading, setSigninLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !emailPassword) { toast.error(t.signin_fillAll); return; }
    setSigninLoading(true);
    const result = await authApi.signIn({ method: "email", identifier: email, password: emailPassword });
    setSigninLoading(false);
    if (isApiError(result)) {
      toast.error(t.signin_signInFailed, { description: getErrorMessage(result.code) });
      analytics.track("api_error", { endpoint: "auth/signin", code: result.code });
      return;
    }
    analytics.track("signin_email", { email });
    signIn({ identifier: email, method: "email" });
    analytics.track("workspace_session_started", { method: "email" });
    toast.success(t.signin_signedIn, { description: t.signin_welcomeBack });
    navigate(redirectTo);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/[\s\-()]/g, "");
    if (digits.length < 5 || !phonePassword) { toast.error(t.signin_enterPhonePassword); return; }
    setSigninLoading(true);
    const result = await authApi.signIn({ method: "phone", identifier: phoneNumber, password: phonePassword });
    setSigninLoading(false);
    if (isApiError(result)) {
      toast.error(t.signin_signInFailed, { description: getErrorMessage(result.code) });
      analytics.track("api_error", { endpoint: "auth/signin", code: result.code });
      return;
    }
    analytics.track("signin_phone", { phone: phoneNumber });
    signIn({ identifier: phoneNumber, method: "phone" });
    analytics.track("workspace_session_started", { method: "phone" });
    toast.success(t.signin_signedIn, { description: t.signin_welcomeBack });
    navigate(redirectTo);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error(t.signin_enterEmail); return; }
    setForgotLoading(true);
    const result = await authApi.requestPasswordReset({ email: forgotEmail });
    setForgotLoading(false);
    if (isApiError(result)) {
      toast.error(t.signin_couldNotSendLink, { description: getErrorMessage(result.code) });
      analytics.track("api_error", { endpoint: "auth/password/reset", code: result.code });
      return;
    }
    analytics.track("forgot_password", { email: forgotEmail });
    setForgotSent(true);
    toast.success(t.signin_emailSentToast, { description: t.signin_emailSentToastDesc });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex flex-1 justify-center px-4 pt-8 pb-12 md:pt-16">
        <div className="w-full max-w-md">
          {view === "login" ? (
            <>
              <Link to="/"><Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {t.signin_back}</Button></Link>

              <h1 className="font-heading text-2xl font-bold text-foreground">{t.signin_title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.signin_subtitle}</p>

              <div className="mt-6 flex rounded-xl border border-border bg-muted/40 p-1">
                <button type="button" onClick={() => setMethod("email")} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${method === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  <Mail className="h-4 w-4" /> {t.signin_email}
                </button>
                <button type="button" onClick={() => setMethod("phone")} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${method === "phone" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  <Phone className="h-4 w-4" /> {t.signin_phone}
                </button>
              </div>

              <form onSubmit={method === "email" ? handleEmailSubmit : handlePhoneSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {method === "email" ? t.signin_emailLabel : t.signin_phoneLabel}
                  </label>
                  <div className="h-12">
                    {method === "email" ? (
                      <Input className="h-12 text-base rounded-xl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.signin_emailPlaceholder} required />
                    ) : (
                      <CountryPhoneInput phone={phoneNumber} onPhoneChange={setPhoneNumber} onCountryChange={setPhoneCountry} countryName={phoneCountry} disabled={false} placeholderText={t.signin_phoneLabel} />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between h-5 mb-1">
                    <label className="text-sm font-medium text-foreground">{t.signin_passwordLabel}</label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setView("forgot"); }}
                      className={`text-xs font-medium text-primary hover:underline transition-opacity ${method === "email" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >{t.signin_forgotPassword}</button>
                  </div>
                  <Input className="h-12 text-base rounded-xl" type="password" value={method === "email" ? emailPassword : phonePassword} onChange={(e) => method === "email" ? setEmailPassword(e.target.value) : setPhonePassword(e.target.value)} placeholder={t.signin_passwordPlaceholder} required />
                </div>
                <Button type="submit" disabled={signinLoading} className="w-full h-14 gap-2 font-semibold rounded-xl" size="lg">{t.signin_signInBtn} <ArrowRight className="h-5 w-5" /></Button>
              </form>

              {method === "phone" && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t.signin_or}</span></div>
                  </div>
                  <Button type="button" onClick={() => { if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 7) { toast.error(t.signin_enterValidPhone); return; } analytics.track("signin_whatsapp", { phone: phoneNumber }); signIn({ identifier: phoneNumber, method: "whatsapp" }); analytics.track("workspace_session_started", { method: "whatsapp" }); toast.success(t.signin_codeSentWhatsApp, { description: t.signin_checkWhatsApp }); setTimeout(() => navigate(redirectTo), 1500); }} className="w-full h-12 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    <WhatsAppIcon className="h-5 w-5" /> {t.signin_getCodeWhatsApp}
                  </Button>
                </>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {t.signin_noAccount}{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">{t.signin_register}</Link>
              </p>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground" onClick={() => { setView("login"); setForgotSent(false); }}>
                <ArrowLeft className="h-4 w-4" /> {t.signin_backToSignIn}
              </Button>

              <h1 className="font-heading text-2xl font-bold text-foreground">{t.signin_resetPassword}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.signin_resetSubtitle}</p>

              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                {t.signin_resetDemoHint}
              </div>

              {forgotSent ? (
                <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Mail className="h-6 w-6 text-primary" /></div>
                  <h2 className="font-heading text-lg font-semibold text-foreground">{t.signin_emailSent}</h2>
                  <p className="text-sm text-muted-foreground">
                    Check <span className="font-medium text-foreground">{forgotEmail}</span> {t.signin_checkEmailInstructions}
                  </p>
                  <Button variant="outline" className="mt-2 rounded-xl" onClick={() => { setView("login"); setForgotSent(false); }}>{t.signin_backToSignIn}</Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t.signin_emailLabel}</label>
                    <Input className="mt-1 h-12 text-base rounded-xl" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder={t.signin_emailPlaceholder} required autoFocus />
                  </div>
                  <Button type="submit" disabled={forgotLoading} className="w-full h-14 gap-2 font-semibold rounded-xl" size="lg">{t.signin_sendResetLink} <ArrowRight className="h-5 w-5" /></Button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignIn;
