import { z } from "zod";

export const authEmailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const authPasswordSchema = z.string().min(8).max(200);

export const authSignInSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
});

export const authPasswordResetRequestSchema = z.object({
  email: authEmailSchema,
  redirectTo: z.string().trim().url().max(500).optional(),
});

export const authPasswordResetTokenSchema = z.string().trim().min(32).max(512).regex(/^[A-Za-z0-9._~:-]+$/);

export const authPasswordResetCompleteSchema = z.object({
  token: authPasswordResetTokenSchema,
  password: authPasswordSchema,
});

export const authRegistrationRoleSchema = z.enum(["buyer", "supplier"]);
export const authRegistrationDeliveryPurposeSchema = z.enum(["email_verification", "phone_verification"]);
export const authRegistrationDeliveryChannelSchema = z.enum(["email", "sms", "whatsapp"]);
export const authRegistrationDeliveryStatusSchema = z.enum(["queued", "leased", "sent", "failed", "cancelled"]);

export const authRegistrationDeliverySchema = z.object({
  id: z.string().uuid(),
  purpose: authRegistrationDeliveryPurposeSchema,
  channel: authRegistrationDeliveryChannelSchema,
  status: authRegistrationDeliveryStatusSchema,
  destinationPreview: z.string().min(1).max(80),
});

export const authRegisterStartSchema = z.object({
  email: authEmailSchema,
  role: authRegistrationRoleSchema,
});

export const authRegisterVerifyEmailSchema = z.object({
  sessionId: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  code: z.string().trim().regex(/^\d{6}$/),
});

export const authRegisterDetailsSchema = z.object({
  sessionId: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  fullName: z.string().trim().min(2).max(160),
  company: z.string().trim().min(2).max(180),
  country: z.string().trim().min(2).max(80),
  vatTin: z.string().trim().min(3).max(80),
  password: authPasswordSchema,
});

export const authRegisterPhoneRequestSchema = z.object({
  sessionId: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  phone: z.string().trim().min(5).max(40),
  method: z.enum(["sms", "whatsapp"]),
});

export const authRegisterPhoneVerifySchema = z.object({
  sessionId: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  phone: z.string().trim().min(5).max(40),
  code: z.string().trim().regex(/^\d{4,6}$/),
});

export const authRegisterOnboardingSchema = z.object({
  sessionId: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  categories: z.array(z.string().trim().min(1).max(120)).max(30),
  volume: z.string().trim().max(80),
  certifications: z.array(z.string().trim().min(1).max(120)).max(30),
});

export const authRegisterMarketsSchema = z.object({
  sessionId: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  countries: z.array(z.string().trim().min(2).max(80)).max(80),
});

export const authSessionSchema = z.object({
  id: z.string().min(32).max(160).regex(/^[A-Za-z0-9._:-]+$/),
  userId: z.string().uuid(),
  email: authEmailSchema,
  displayName: z.string().min(1).max(180),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const authSessionResponseSchema = z.object({
  ok: z.literal(true),
  session: authSessionSchema,
  requestId: z.string().uuid(),
});

export const authSignOutResponseSchema = z.object({
  ok: z.literal(true),
  signedOut: z.boolean(),
  requestId: z.string().uuid(),
});

export const authPasswordResetRequestResponseSchema = z.object({
  ok: z.literal(true),
  sent: z.literal(true),
  expiresInSeconds: z.number().int().min(60),
  requestId: z.string().uuid(),
});

export const authPasswordResetCompleteResponseSchema = z.object({
  ok: z.literal(true),
  passwordUpdated: z.literal(true),
  requestId: z.string().uuid(),
});

export const authRegisterStartResponseSchema = z.object({
  ok: z.literal(true),
  sessionId: z.string().min(32).max(160),
  emailSent: z.boolean(),
  delivery: authRegistrationDeliverySchema,
  expiresInSeconds: z.number().int().min(60),
  requestId: z.string().uuid(),
});

export const authRegisterVerifyEmailResponseSchema = z.object({
  ok: z.literal(true),
  verified: z.literal(true),
  requestId: z.string().uuid(),
});

export const authRegisterDetailsResponseSchema = z.object({
  ok: z.literal(true),
  profileCreated: z.literal(true),
  requestId: z.string().uuid(),
});

export const authRegisterPhoneRequestResponseSchema = z.object({
  ok: z.literal(true),
  sent: z.literal(true),
  delivery: authRegistrationDeliverySchema,
  expiresInSeconds: z.number().int().min(60),
  requestId: z.string().uuid(),
});

export const authRegisterPhoneVerifyResponseSchema = z.object({
  ok: z.literal(true),
  verified: z.literal(true),
  requestId: z.string().uuid(),
});

export const authRegisterOnboardingResponseSchema = z.object({
  ok: z.literal(true),
  saved: z.literal(true),
  requestId: z.string().uuid(),
});

export const authRegisterMarketsResponseSchema = z.object({
  ok: z.literal(true),
  saved: z.literal(true),
  requestId: z.string().uuid(),
});

export const authRegisterCompleteResponseSchema = z.object({
  ok: z.literal(true),
  userId: z.string().uuid(),
  token: z.string().min(32).max(160),
  profile: z.object({
    fullName: z.string().min(1).max(180),
    company: z.string().min(2).max(180),
    role: authRegistrationRoleSchema,
    country: z.string().min(2).max(80),
  }),
  session: authSessionSchema,
  requestId: z.string().uuid(),
});

export const authSecurityEventTypeSchema = z.enum([
  "sign_in_succeeded",
  "sign_in_failed",
  "sign_in_rate_limited",
  "password_reset_requested",
  "password_reset_completed",
  "password_reset_invalid",
  "session_invalid",
  "sign_out_succeeded",
  "sign_out_invalid",
]);

export const authSecurityEventSchema = z.object({
  id: z.string().min(1).max(160),
  eventType: authSecurityEventTypeSchema,
  userId: z.string().uuid().nullable(),
  email: authEmailSchema.nullable(),
  sessionId: z.string().min(1).max(160).nullable(),
  requestId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type AuthSignIn = z.infer<typeof authSignInSchema>;
export type AuthPasswordResetRequest = z.infer<typeof authPasswordResetRequestSchema>;
export type AuthPasswordResetComplete = z.infer<typeof authPasswordResetCompleteSchema>;
export type AuthRegisterStart = z.infer<typeof authRegisterStartSchema>;
export type AuthRegistrationDeliveryPurpose = z.infer<typeof authRegistrationDeliveryPurposeSchema>;
export type AuthRegistrationDeliveryChannel = z.infer<typeof authRegistrationDeliveryChannelSchema>;
export type AuthRegistrationDeliveryStatus = z.infer<typeof authRegistrationDeliveryStatusSchema>;
export type AuthRegistrationDelivery = z.infer<typeof authRegistrationDeliverySchema>;
export type AuthRegisterVerifyEmail = z.infer<typeof authRegisterVerifyEmailSchema>;
export type AuthRegisterDetails = z.infer<typeof authRegisterDetailsSchema>;
export type AuthRegisterPhoneRequest = z.infer<typeof authRegisterPhoneRequestSchema>;
export type AuthRegisterPhoneVerify = z.infer<typeof authRegisterPhoneVerifySchema>;
export type AuthRegisterOnboarding = z.infer<typeof authRegisterOnboardingSchema>;
export type AuthRegisterMarkets = z.infer<typeof authRegisterMarketsSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuthSignOutResponse = z.infer<typeof authSignOutResponseSchema>;
export type AuthPasswordResetRequestResponse = z.infer<typeof authPasswordResetRequestResponseSchema>;
export type AuthPasswordResetCompleteResponse = z.infer<typeof authPasswordResetCompleteResponseSchema>;
export type AuthRegisterStartResponse = z.infer<typeof authRegisterStartResponseSchema>;
export type AuthRegisterVerifyEmailResponse = z.infer<typeof authRegisterVerifyEmailResponseSchema>;
export type AuthRegisterDetailsResponse = z.infer<typeof authRegisterDetailsResponseSchema>;
export type AuthRegisterPhoneRequestResponse = z.infer<typeof authRegisterPhoneRequestResponseSchema>;
export type AuthRegisterPhoneVerifyResponse = z.infer<typeof authRegisterPhoneVerifyResponseSchema>;
export type AuthRegisterOnboardingResponse = z.infer<typeof authRegisterOnboardingResponseSchema>;
export type AuthRegisterMarketsResponse = z.infer<typeof authRegisterMarketsResponseSchema>;
export type AuthRegisterCompleteResponse = z.infer<typeof authRegisterCompleteResponseSchema>;
export type AuthSecurityEventType = z.infer<typeof authSecurityEventTypeSchema>;
export type AuthSecurityEvent = z.infer<typeof authSecurityEventSchema>;
