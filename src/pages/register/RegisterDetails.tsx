import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Building, Lock, MapPin, FileText, Phone, CheckCircle2, Loader2, XCircle } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { detectCountry, detectCountryByIP, SEAFOOD_COUNTRIES } from "@/lib/detectCountry";
import analytics from "@/lib/analytics";
import { authApi, getErrorMessage } from "@/lib/api-contracts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import CountryPhoneInput from "@/components/registration/CountryPhoneInput";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { useLanguage } from "@/i18n/LanguageContext";

const RegisterDetails = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/details");
  const { t } = useLanguage();
  const isSupplier = data.role === "supplier";

  const [fullName, setFullName] = useState(data.fullName);
  const [company, setCompany] = useState(data.company);
  const [password, setPassword] = useState(data.password);
  const [country, setCountry] = useState(data.country);
  const [vatTin, setVatTin] = useState(data.vatTin);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(data.phoneVerified);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppCountdown, setWhatsAppCountdown] = useState(30);
  const whatsAppTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!country) {
      const detected = detectCountry();
      if (detected) { setCountry(detected); return; }
      detectCountryByIP().then((c) => { if (c) setCountry(c); });
    }
  }, []);

  useEffect(() => {
    if (phoneSent && !phoneVerified) {
      setShowWhatsApp(false);
      setWhatsAppCountdown(30);
      whatsAppTimerRef.current = setInterval(() => {
        setWhatsAppCountdown((prev) => {
          if (prev <= 1) { if (whatsAppTimerRef.current) clearInterval(whatsAppTimerRef.current); setShowWhatsApp(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (whatsAppTimerRef.current) clearInterval(whatsAppTimerRef.current); };
  }, [phoneSent, phoneVerified]);

  if (!guardPassed) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = t.reg_enterFullName;
    if (company.trim().length < 2) errs.company = t.reg_enterCompanyName;
    if (password.length < 8) errs.password = t.reg_minChars;
    if (!country) errs.country = t.reg_selectCountryErr;
    if (vatTin.trim().length < 3) errs.vatTin = t.reg_enterValidVat;
    if (!phoneNumber || phoneNumber.replace(/[\s\-()]/g, "").length < 5) errs.phone = t.reg_enterPhoneNumber;
    if (!phoneVerified) errs.phone = t.reg_verifyPhoneNumber;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/[\s\-()]/g, "").length < 5) {
      setErrors((prev) => ({ ...prev, phone: t.reg_enterValidPhone }));
      return;
    }
    setPhoneLoading(true);
    setCodeError(false);
    const result = await authApi.requestPhoneVerification({ sessionId: "sess_mock", phone: phoneNumber, method: "sms" });
    setPhoneLoading(false);
    if (!result.ok) {
      const err = result as import("@/lib/api-contracts").ApiError;
      toast.error(t.reg_couldNotContinue, { description: err.message });
      return;
    }
    setPhoneSent(true);
    toast.success(t.reg_codeSentToast, { description: t.reg_codeSentToastDesc });
    analytics.track("phone_verification_sent", { phone: phoneNumber });
  };

  const handleWhatsAppVerify = async () => {
    setPhoneLoading(true);
    analytics.track("phone_whatsapp_verify_started", { phone: phoneNumber });
    const result = await authApi.requestPhoneVerification({ sessionId: "sess_mock", phone: phoneNumber, method: "whatsapp" });
    setPhoneLoading(false);
    if (!result.ok) {
      const err = result as import("@/lib/api-contracts").ApiError;
      toast.error(t.reg_couldNotContinue, { description: err.message });
      return;
    }
    // Mock: WhatsApp auto-verifies
    setPhoneVerified(true);
    setCodeError(false);
    setErrors((prev) => ({ ...prev, phone: "" }));
    toast.success(t.reg_phoneVerifiedWhatsApp, { description: t.reg_phoneVerifiedWhatsAppDesc });
    analytics.track("phone_whatsapp_verified", { phone: phoneNumber });
  };

  const handleVerifyCode = async () => {
    if (phoneCode.length < 4) {
      setErrors((prev) => ({ ...prev, phone: t.reg_enterCodeFromSms }));
      return;
    }
    setPhoneLoading(true);
    setCodeError(false);
    const result = await authApi.verifyPhone({ sessionId: "sess_mock", phone: phoneNumber, code: phoneCode });
    setPhoneLoading(false);
    if (!result.ok) {
      setCodeError(true);
      const err = result as import("@/lib/api-contracts").ApiError;
      toast.error(t.reg_invalidCode, { description: err.message });
      return;
    }
    setPhoneVerified(true);
    setCodeError(false);
    setErrors((prev) => ({ ...prev, phone: "" }));
    toast.success(t.reg_phoneVerified, { description: t.reg_phoneVerifiedDesc });
    analytics.track("phone_verified", { phone: phoneNumber });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const result = await authApi.submitDetails({ sessionId: "sess_mock", fullName, company, country, vatTin, password });
    setSubmitting(false);

    if (!result.ok) {
      const err = result as { code: string; message: string; field?: string };
      if (err.field) setErrors((prev) => ({ ...prev, [err.field!]: getErrorMessage(err.code) }));
      toast.error(t.reg_couldNotContinue, { description: err.message });
      return;
    }

    setFields({ fullName, company, password, country, vatTin, phone: phoneNumber, phoneVerified });
    analytics.track("registration_details_completed", { role: data.role || "unknown", country });
    navigate("/register/onboarding");
  };

  const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: "" }));

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {t.reg_tellAboutYourself}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isSupplier ? t.reg_detailsSubtitleSupplier : t.reg_detailsSubtitleBuyer}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <User className="h-4 w-4 text-muted-foreground" /> {t.reg_fullName}
          </label>
          <Input type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }} placeholder="John Smith" className="h-12 text-base rounded-xl" required />
          {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Building className="h-4 w-4 text-muted-foreground" /> {t.reg_companyName}
          </label>
          <Input type="text" value={company} onChange={(e) => { setCompany(e.target.value); clearError("company"); }} placeholder="Acme Seafood Ltd." className="h-12 text-base rounded-xl" required />
          {errors.company && <p className="mt-1 text-sm text-destructive">{errors.company}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" /> {t.reg_country}
            {country && <span className="text-xs font-normal text-muted-foreground ml-1">{t.reg_autoDetected}</span>}
          </label>
          <select value={country} onChange={(e) => { setCountry(e.target.value); clearError("country"); }} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="">{t.reg_selectCountry}</option>
            {SEAFOOD_COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          {errors.country && <p className="mt-1 text-sm text-destructive">{errors.country}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" /> {t.reg_vatTin}
          </label>
          <Input type="text" value={vatTin} onChange={(e) => { setVatTin(e.target.value); clearError("vatTin"); }} placeholder={t.reg_vatPlaceholder} className="h-12 text-base rounded-xl" />
          {errors.vatTin && <p className="mt-1 text-sm text-destructive">{errors.vatTin}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{isSupplier ? t.reg_vatDescSupplier : t.reg_vatDescBuyer}</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Phone className="h-4 w-4 text-muted-foreground" /> {t.reg_phoneNumber}
          </label>

          <div className="space-y-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <CountryPhoneInput phone={phoneNumber} onPhoneChange={(val) => { setPhoneNumber(val); clearError("phone"); setPhoneVerified(false); setPhoneSent(false); setCodeError(false); }} onCountryChange={(name) => { setCountry(name); clearError("country"); }} countryName={country} disabled={phoneVerified} placeholderText={t.signin_phoneLabel} />
              </div>
              {phoneVerified && (
                <div className="flex items-center gap-1.5 text-emerald-600 h-12 px-3 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">{t.reg_verified}</span>
                </div>
              )}
            </div>

            {!phoneVerified && !phoneSent && (
              <Button type="button" variant="outline" onClick={handleSendCode} disabled={phoneLoading} className="h-12 rounded-xl w-full">
                {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t.reg_sendCode}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {phoneSent && !phoneVerified && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">{t.reg_codeSentEnter}</p>
                <div className="flex gap-2">
                  <Input type="text" value={phoneCode} onChange={(e) => { setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(false); }} placeholder={t.reg_smsCode} className={`h-12 text-base rounded-xl flex-1 tracking-widest text-center font-mono ${codeError ? "border-destructive ring-destructive" : ""}`} maxLength={6} autoFocus />
                  <Button type="button" onClick={handleVerifyCode} disabled={phoneLoading || phoneCode.length < 4} className="h-12 rounded-xl px-5">
                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.reg_verify}
                  </Button>
                </div>
                {codeError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> {t.reg_invalidCodeRetry}
                  </motion.p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <button type="button" onClick={handleSendCode} disabled={phoneLoading} className="text-xs text-primary hover:underline">{t.reg_resendCode}</button>
                  {!showWhatsApp && whatsAppCountdown > 0 && <span className="text-xs text-muted-foreground">WhatsApp in {whatsAppCountdown}s</span>}
                </div>

                <AnimatePresence>
                  {showWhatsApp && !phoneVerified && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">{t.reg_or}</span></div>
                      </div>
                      <Button type="button" variant="outline" onClick={handleWhatsAppVerify} disabled={phoneLoading} className="mt-3 h-12 rounded-xl w-full gap-2 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800">
                        {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WhatsAppIcon className="h-5 w-5" />}
                        {t.reg_verifyViaWhatsApp}
                      </Button>
                      <p className="mt-1.5 text-xs text-muted-foreground text-center">{t.reg_whatsAppCodeDesc}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {errors.phone && !codeError && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{t.reg_phoneDesc}</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Lock className="h-4 w-4 text-muted-foreground" /> {t.reg_password}
          </label>
          <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError("password"); }} placeholder={t.reg_passwordPlaceholder} className="h-12 text-base rounded-xl" minLength={8} required />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2 mt-2" disabled={submitting}>
          {submitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> {t.reg_saving}</>) : (<>{t.reg_continue} <ArrowRight className="h-5 w-5" /></>)}
        </Button>

        <TrustMicroText variant="privacy" delay={0.4} className="mt-3" />
      </form>
    </RegistrationLayout>
  );
};

export default RegisterDetails;
