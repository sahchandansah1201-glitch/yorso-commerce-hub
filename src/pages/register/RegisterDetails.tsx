import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Building, Lock, MapPin, FileText } from "lucide-react";
import { detectCountry, SEAFOOD_COUNTRIES } from "@/lib/detectCountry";
import analytics from "@/lib/analytics";

const RegisterDetails = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const isSupplier = data.role === "supplier";

  const [fullName, setFullName] = useState(data.fullName);
  const [company, setCompany] = useState(data.company);
  const [password, setPassword] = useState(data.password);
  const [country, setCountry] = useState(data.country);
  const [vatTin, setVatTin] = useState(data.vatTin);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!country) {
      const detected = detectCountry();
      if (detected) setCountry(detected);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Please enter your full name";
    if (company.trim().length < 2) errs.company = "Please enter your company name";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!country) errs.country = "Please select your country";
    if (isSupplier && vatTin.trim().length < 3) errs.vatTin = "Please enter your VAT/TIN number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFields({ fullName, company, password, country, vatTin });
    analytics.track("registration_details_completed", { role: data.role || "unknown", country });
    navigate("/register/onboarding");
  };

  const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: "" }));

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Tell us about yourself
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Basic info to set up your {isSupplier ? "supplier" : "buyer"} account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <User className="h-4 w-4 text-muted-foreground" /> Full Name
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
            placeholder="John Smith"
            className="h-12 text-base rounded-xl"
            required
          />
          {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Building className="h-4 w-4 text-muted-foreground" /> Company Name
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

        {/* Country (auto-detected) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" /> Country
            {country && <span className="text-xs font-normal text-muted-foreground ml-1">(auto-detected)</span>}
          </label>
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); clearError("country"); }}
            className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select country...</option>
            {SEAFOOD_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.country && <p className="mt-1 text-sm text-destructive">{errors.country}</p>}
        </div>

        {/* VAT/TIN — only for suppliers */}
        {isSupplier && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" /> VAT / TIN Number
            </label>
            <Input
              type="text"
              value={vatTin}
              onChange={(e) => { setVatTin(e.target.value); clearError("vatTin"); }}
              placeholder="e.g. DE123456789"
              className="h-12 text-base rounded-xl"
            />
            {errors.vatTin && <p className="mt-1 text-sm text-destructive">{errors.vatTin}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Required for supplier verification</p>
          </div>
        )}

        {/* Password */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
            <Lock className="h-4 w-4 text-muted-foreground" /> Create Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            placeholder="Min 8 characters"
            className="h-12 text-base rounded-xl"
            minLength={8}
            required
          />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2 mt-2">
          Continue <ArrowRight className="h-5 w-5" />
        </Button>
      </form>
    </RegistrationLayout>
  );
};

export default RegisterDetails;
