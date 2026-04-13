import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Building, Lock } from "lucide-react";
import analytics from "@/lib/analytics";

const RegisterDetails = () => {
  const navigate = useNavigate();
  const { data, setFields } = useRegistration();
  const [fullName, setFullName] = useState(data.fullName);
  const [company, setCompany] = useState(data.company);
  const [password, setPassword] = useState(data.password);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Please enter your full name";
    if (company.trim().length < 2) errs.company = "Please enter your company name";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFields({ fullName, company, password });
    analytics.track("registration_details_completed", { role: data.role || "unknown" });
    navigate("/register/onboarding");
  };

  const fields = [
    { key: "fullName", label: "Full Name", icon: User, value: fullName, setter: setFullName, placeholder: "John Smith", type: "text" },
    { key: "company", label: "Company Name", icon: Building, value: company, setter: setCompany, placeholder: "Acme Seafood Ltd.", type: "text" },
    { key: "password", label: "Create Password", icon: Lock, value: password, setter: setPassword, placeholder: "Min 8 characters", type: "password" },
  ];

  return (
    <RegistrationLayout>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Tell us about yourself
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Basic info to set up your {data.role === "supplier" ? "supplier" : "buyer"} account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map(({ key, label, icon: Icon, value, setter, placeholder, type }) => (
          <div key={key}>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </label>
            <Input
              type={type}
              value={value}
              onChange={(e) => {
                setter(e.target.value);
                setErrors((prev) => ({ ...prev, [key]: "" }));
              }}
              placeholder={placeholder}
              className="h-12 text-base rounded-xl"
              minLength={type === "password" ? 8 : undefined}
              required
            />
            {errors[key] && <p className="mt-1 text-sm text-destructive">{errors[key]}</p>}
          </div>
        ))}

        <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2 mt-2">
          Continue <ArrowRight className="h-5 w-5" />
        </Button>
      </form>
    </RegistrationLayout>
  );
};

export default RegisterDetails;
