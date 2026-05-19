import { z } from "zod";

export const authEmailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const authPasswordSchema = z.string().min(8).max(200);

export const authSignInSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
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

export const authSecurityEventTypeSchema = z.enum([
  "sign_in_succeeded",
  "sign_in_failed",
  "sign_in_rate_limited",
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
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuthSignOutResponse = z.infer<typeof authSignOutResponseSchema>;
export type AuthSecurityEventType = z.infer<typeof authSecurityEventTypeSchema>;
export type AuthSecurityEvent = z.infer<typeof authSecurityEventSchema>;
