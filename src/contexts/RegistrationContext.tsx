import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "buyer" | "supplier" | null;

interface RegistrationData {
  role: UserRole;
  email: string;
  fullName: string;
  company: string;
  password: string;
  country: string;
  vatTin: string;
  phone: string;
  phoneVerified: boolean;
  // Onboarding
  categories: string[];
  certifications: string[];
  countries: string[];
  volume: string;
}

interface RegistrationContextType {
  data: RegistrationData;
  setField: <K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) => void;
  setFields: (fields: Partial<RegistrationData>) => void;
  reset: () => void;
}

const defaultData: RegistrationData = {
  role: null,
  email: "",
  fullName: "",
  company: "",
  password: "",
  country: "",
  vatTin: "",
  phone: "",
  phoneVerified: false,
  categories: [],
  certifications: [],
  countries: [],
  volume: "",
};

const RegistrationContext = createContext<RegistrationContextType | null>(null);

export const useRegistration = () => {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be inside RegistrationProvider");
  return ctx;
};

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<RegistrationData>(defaultData);

  const setField = <K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const setFields = (fields: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const reset = () => setData(defaultData);

  return (
    <RegistrationContext.Provider value={{ data, setField, setFields, reset }}>
      {children}
    </RegistrationContext.Provider>
  );
};
