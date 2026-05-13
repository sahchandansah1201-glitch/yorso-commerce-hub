import { z } from "zod";

export const accountRoleSchema = z.enum(["buyer", "supplier", "both"]);
export const companyPublicationStatusSchema = z.enum(["draft", "review", "published", "blocked"]);
export const buyerQualificationStatusSchema = z.enum(["not_started", "pending", "qualified", "rejected"]);

export const companyMediaSchema = z.object({
  logoObjectKey: z.string().min(1).nullable(),
  coverObjectKey: z.string().min(1).nullable(),
  logoAlt: z.string().max(160).nullable(),
  coverAlt: z.string().max(160).nullable(),
  logoFit: z.enum(["contain", "cover"]),
  coverFocalX: z.number().min(0).max(1),
  coverFocalY: z.number().min(0).max(1),
});

export const companyProfileSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string().min(2).max(180),
  tradeName: z.string().min(2).max(120),
  accountRole: accountRoleSchema,
  countryCode: z.string().length(2),
  website: z.string().url().nullable(),
  yearFounded: z.number().int().min(1800).max(2100).nullable(),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().min(5).max(40).nullable(),
  messengerHandle: z.string().max(80).nullable(),
  description: z.string().max(1200).nullable(),
  productFocus: z.array(z.string().min(1)).max(20),
  certificates: z.array(z.string().min(1)).max(30),
  paymentTerms: z.array(z.string().min(1)).max(20),
  publicationStatus: companyPublicationStatusSchema,
  buyerQualificationStatus: buyerQualificationStatusSchema,
  media: companyMediaSchema,
  updatedAt: z.string().datetime(),
});

export const companyProfileUpdateSchema = companyProfileSchema
  .omit({ id: true, updatedAt: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one company profile field must be provided.",
  });

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(5).max(40).nullable(),
  preferredLanguage: z.enum(["en", "ru", "es"]),
  timezone: z.string().min(1).max(80),
  updatedAt: z.string().datetime(),
});

export const userProfileUpdateSchema = userProfileSchema
  .omit({ id: true, updatedAt: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one user profile field must be provided.",
  });

export type AccountRole = z.infer<typeof accountRoleSchema>;
export type BuyerQualificationStatus = z.infer<typeof buyerQualificationStatusSchema>;
export type CompanyMedia = z.infer<typeof companyMediaSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type CompanyProfileUpdate = z.infer<typeof companyProfileUpdateSchema>;
export type CompanyPublicationStatus = z.infer<typeof companyPublicationStatusSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
