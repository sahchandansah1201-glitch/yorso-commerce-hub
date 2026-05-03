/**
 * Account form validators (frontend-first).
 * Pure functions, no zod/runtime dep, returning a localized message key when invalid.
 *
 * Each helper takes the translations object so callers stay i18n-aware.
 */
import type { translations } from "@/i18n/translations";

type T = (typeof translations)["en"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// E.164-friendly: optional +, then 7-15 digits; spaces / dashes / parentheses allowed in input
const PHONE_RE = /^\+?[\d][\d\s\-().]{6,30}$/;

export const validateEmail = (raw: string, t: T, required = true): string | undefined => {
  const v = raw.trim();
  if (!v) return required ? t.account_validation_required : undefined;
  if (v.length > 254) return t.account_validation_email_long;
  if (!EMAIL_RE.test(v)) return t.account_validation_email;
  return undefined;
};

export const validatePhone = (raw: string, t: T, required = false): string | undefined => {
  const v = raw.trim();
  if (!v) return required ? t.account_validation_required : undefined;
  if (v.length > 32) return t.account_validation_phone_long;
  if (!PHONE_RE.test(v)) return t.account_validation_phone;
  // count digits — must be 7..15 per E.164
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return t.account_validation_phone;
  return undefined;
};

export const validateName = (raw: string, t: T, required = true): string | undefined => {
  const v = raw.trim();
  if (!v) return required ? t.account_validation_required : undefined;
  if (v.length > 100) return t.account_validation_name_long;
  return undefined;
};

export const validateUrl = (raw: string, t: T): string | undefined => {
  const v = raw.trim();
  if (!v) return undefined;
  try {
    const u = new URL(v);
    if (!/^https?:$/.test(u.protocol)) return t.account_validation_url;
    return undefined;
  } catch {
    return t.account_validation_url;
  }
};

export const validateLanguage = (
  raw: string,
  t: T,
): string | undefined => {
  if (raw === "en" || raw === "ru" || raw === "es") return undefined;
  return t.account_validation_language;
};

export const validateText = (raw: string, t: T, max = 2000): string | undefined => {
  if (raw.length > max) return t.account_validation_text_long;
  return undefined;
};

export const validateYear = (raw: number | undefined, t: T): string | undefined => {
  if (!raw) return undefined;
  const now = new Date().getFullYear();
  if (!Number.isFinite(raw) || raw < 1800 || raw > now) return t.account_validation_year;
  return undefined;
};
