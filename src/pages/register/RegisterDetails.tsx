import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Building, Lock, MapPin, FileText, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { detectCountry, SEAFOOD_COUNTRIES } from "@/lib/detectCountry";
import analytics from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";

const PHONE_PREFIXES: Record<string, string> = {
  Norway: "+47", Iceland: "+354", "Faroe Islands": "+298", Denmark: "+45",
  Sweden: "+46", Finland: "+358", Russia: "+7", Canada: "+1",
  "United States": "+1", Chile: "+56", Peru: "+51", Ecuador: "+593",
  China: "+86", Japan: "+81", "South Korea": "+82", Thailand: "+66",
  Vietnam: "+84", India: "+91", Indonesia: "+62", Philippines: "+63",
  Spain: "+34", Portugal: "+351", France: "+33", Netherlands: "+31",
  Germany: "+49", Italy: "+39", Greece: "+30", Turkey: "+90", Poland: "+48",
  "United Kingdom": "+44", Ireland: "+353", Morocco: "+212", Senegal: "+221",
  Mauritania: "+222", Namibia: "+264", "South Africa": "+27",
  Mozambique: "+258", Tanzania: "+255", Kenya: "+254", Madagascar: "+261",
  Australia: "+61", "New Zealand": "+64", "Papua New Guinea": "+675",
  Mexico: "+52", Argentina: "+54", Brazil: "+55", Colombia: "+57",
  "Costa Rica": "+506", Panama: "+507", Honduras: "+504",
  "Saudi Arabia": "+966", "United Arab Emirates": "+971", Oman: "+968",
  Egypt: "+20", Israel: "+972", Iran: "+98", Pakistan: "+92",
  Bangladesh: "+880", Myanmar: "+95", Taiwan: "+886", "Sri Lanka": "+94",
};

const RegisterDetails = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const isSupplier = data.role === "supplier";

  const [fullName, setFullName] = useState(data.fullName);
  const [company, setCompany] = useState(data.company);
  const [password, setPassword] = useState(data.password);
  const [country, setCountry] = useState(data.country);
  const [vatTin, setVatTin] = useState(data.vatTin);
  const [phone, setPhone] = useState(data.phone);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(data.phoneVerified);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!country) {
      const detected = detectCountry();
      if (detected) setCountry(detected);
    }
  }, []);

  // Auto-set phone prefix when country changes
  useEffect(() => {
    if (country && !phone) {
      const prefix = PHONE_PREFIXES[country];
      if (prefix) setPhone(prefix + " ");
    }
  }, [country]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Введите полное имя";
    if (company.trim().length < 2) errs.company = "Введите название компании";
    if (password.length < 8) errs.password = "Минимум 8 символов";
    if (!country) errs.country = "Выберите страну";
    if (vatTin.trim().length < 3) errs.vatTin = "Введите VAT/TIN номер";
    if (!phone || phone.replace(/[\s+\-]/g, "").length < 7) errs.phone = "Введите номер телефона";
    if (!phoneVerified) errs.phone = "Подтвердите номер телефона";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendCode = () => {
    if (!phone || phone.replace(/[\s+\-]/g, "").length < 7) {
      setErrors((prev) => ({ ...prev, phone: "Введите корректный номер" }));
      return;
    }
    setPhoneLoading(true);
    // Mock: имитация отправки SMS
    setTimeout(() => {
      setPhoneSent(true);
      setPhoneLoading(false);
      analytics.track("phone_verification_sent", { phone });
    }, 1200);
  };

  const handleVerifyCode = () => {
    if (phoneCode.length < 4) {
      setErrors((prev) => ({ ...prev, phone: "Введите код из SMS" }));
      return;
    }
    setPhoneLoading(true);
    // Mock: любой 4+ значный код принимается
    setTimeout(() => {
      setPhoneVerified(true);
      setPhoneLoading(false);
      setErrors((prev) => ({ ...prev, phone: "" }));
      analytics.track("phone_verified", { phone });
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFields({ fullName, company, password, country, vatTin, phone, phoneVerified });
    analytics.track("registration_details_completed", { role: data.role || "unknown", country });
    navigate("/register/onboarding");
  };

  const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: "" }));

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Расскажите о себе
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Информация для настройки вашего {isSupplier ? "аккаунта поставщика" : "аккаунта покупателя"}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <User className="h-4 w-4 text-muted-foreground" /> Полное имя
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
            placeholder="Иван Петров"
            className="h-12 text-base rounded-xl"
            required
          />
          {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Building className="h-4 w-4 text-muted-foreground" /> Название компании
          </label>
          <Input
            type="text"
            value={company}
            onChange={(e) => { setCompany(e.target.value); clearError("company"); }}
            placeholder="Acme Seafood Ltd."
            className="h-12 text-base rounded-xl"
            required
          />
          {errors.company && <p className="mt-1 text-sm text-destructive">{errors.company}</p>}
        </div>

        {/* Country */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" /> Страна
            {country && <span className="text-xs font-normal text-muted-foreground ml-1">(определена автоматически)</span>}
          </label>
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); clearError("country"); }}
            className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Выберите страну...</option>
            {SEAFOOD_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.country && <p className="mt-1 text-sm text-destructive">{errors.country}</p>}
        </div>

        {/* VAT/TIN — for both roles */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" /> VAT / TIN номер
          </label>
          <Input
            type="text"
            value={vatTin}
            onChange={(e) => { setVatTin(e.target.value); clearError("vatTin"); }}
            placeholder="e.g. DE123456789"
            className="h-12 text-base rounded-xl"
          />
          {errors.vatTin && <p className="mt-1 text-sm text-destructive">{errors.vatTin}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {isSupplier
              ? "Обязательно для верификации поставщика"
              : "Необходим для оформления B2B-сделок и выставления инвойсов"}
          </p>
        </div>

        {/* Phone with verification */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Phone className="h-4 w-4 text-muted-foreground" /> Номер телефона
          </label>
          <div className="flex gap-2">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); clearError("phone"); setPhoneVerified(false); setPhoneSent(false); }}
              placeholder="+7 999 123 4567"
              className="h-12 text-base rounded-xl flex-1"
              disabled={phoneVerified}
            />
            {!phoneVerified && !phoneSent && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={phoneLoading}
                className="h-12 rounded-xl px-4 whitespace-nowrap"
              >
                {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Получить код"}
              </Button>
            )}
            {phoneVerified && (
              <div className="flex items-center gap-1.5 text-emerald-600 px-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Подтверждён</span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {phoneSent && !phoneVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <p className="text-sm text-muted-foreground mb-2">
                  Код отправлен на {phone}. Введите его ниже:
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Код из SMS"
                    className="h-12 text-base rounded-xl flex-1 tracking-widest text-center font-mono"
                    maxLength={6}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={phoneLoading || phoneCode.length < 4}
                    className="h-12 rounded-xl px-5"
                  >
                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подтвердить"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Для быстрой связи по сделкам и защиты от спам-регистраций
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Lock className="h-4 w-4 text-muted-foreground" /> Пароль
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            placeholder="Минимум 8 символов"
            className="h-12 text-base rounded-xl"
            minLength={8}
            required
          />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2 mt-2">
          Продолжить <ArrowRight className="h-5 w-5" />
        </Button>
      </form>
    </RegistrationLayout>
  );
};

export default RegisterDetails;
