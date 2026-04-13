import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration, RegistrationData } from "@/contexts/RegistrationContext";

type StepRequirement = {
  /** Fields that must be truthy/non-empty for this step */
  required: (keyof RegistrationData)[];
  /** Redirect target if requirements not met */
  redirectTo: string;
};

const STEP_REQUIREMENTS: Record<string, StepRequirement> = {
  "/register/email": {
    required: ["role"],
    redirectTo: "/register",
  },
  "/register/verify": {
    required: ["role", "email"],
    redirectTo: "/register/email",
  },
  "/register/details": {
    required: ["role", "email", "emailVerified"],
    redirectTo: "/register/verify",
  },
  "/register/onboarding": {
    required: ["role", "email", "emailVerified", "fullName", "company"],
    redirectTo: "/register/details",
  },
  "/register/countries": {
    required: ["role", "email", "emailVerified", "fullName", "company"],
    redirectTo: "/register/details",
  },
  "/register/ready": {
    required: ["role", "email", "emailVerified", "fullName", "company"],
    redirectTo: "/register/details",
  },
};

function isFieldValid(data: RegistrationData, field: keyof RegistrationData): boolean {
  const val = data[field];
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return true; // arrays are optional
  return val !== null && val !== undefined;
}

/**
 * Guards a registration step. Redirects to the earliest valid step
 * if required data is missing. Returns true if guard passed.
 */
export function useRegistrationGuard(path: string): boolean {
  const navigate = useNavigate();
  const { data } = useRegistration();

  const req = STEP_REQUIREMENTS[path];

  const isValid = req
    ? req.required.every((field) => isFieldValid(data, field))
    : true;

  useEffect(() => {
    if (req && !isValid) {
      // Find the earliest step that would accept current data
      navigate(req.redirectTo, { replace: true });
    }
  }, [isValid, req, navigate]);

  return isValid;
}
