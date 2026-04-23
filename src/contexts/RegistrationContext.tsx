/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type UserRole = "buyer" | "supplier" | null;

export interface RegistrationData {
  role: UserRole;
  sessionId: string;
  email: string;
  emailVerified: boolean;
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
  // Flow metadata
  onboardingSkipped: boolean;
  countriesSkipped: boolean;
  completed: boolean;
  // Funnel timing (epoch ms; 0 = not yet measured)
  startedAt: number;
  emailSubmittedAt: number;
}

interface RegistrationContextType {
  data: RegistrationData;
  setField: <K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) => void;
  setFields: (fields: Partial<RegistrationData>) => void;
  reset: () => void;
}

const STORAGE_KEY = "yorso_registration";

const defaultData: RegistrationData = {
  role: null,
  sessionId: "",
  email: "",
  emailVerified: false,
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
  onboardingSkipped: false,
  countriesSkipped: false,
  completed: false,
  startedAt: 0,
  emailSubmittedAt: 0,
};

function loadFromStorage(): RegistrationData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    // Validate shape — if stale/corrupted, discard
    if (typeof parsed !== "object" || parsed === null) return defaultData;
    if (parsed.completed) return defaultData; // completed flows should start fresh
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}

function saveToStorage(data: RegistrationData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — silent fail
  }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

const RegistrationContext = createContext<RegistrationContextType | null>(null);

export const useRegistration = () => {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be inside RegistrationProvider");
  return ctx;
};

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<RegistrationData>(loadFromStorage);

  const setField = useCallback(<K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) => {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      saveToStorage(next);
      return next;
    });
  }, []);

  const setFields = useCallback((fields: Partial<RegistrationData>) => {
    setData((prev) => {
      const next = { ...prev, ...fields };
      saveToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setData(defaultData);
    clearStorage();
  }, []);

  return (
    <RegistrationContext.Provider value={{ data, setField, setFields, reset }}>
      {children}
    </RegistrationContext.Provider>
  );
};
