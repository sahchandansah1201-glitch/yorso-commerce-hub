import { z } from "zod";

export const accountUserIdHeaderName = "x-yorso-user-id";
export const accountSessionIdHeaderName = "x-yorso-session-id";

export const accountSessionUserIdSchema = z.string().uuid();
export const accountSessionIdSchema = z.string().min(3).max(160).regex(/^[A-Za-z0-9._:-]+$/);

export const accountSessionHeadersSchema = z.object({
  userId: accountSessionUserIdSchema,
  sessionId: accountSessionIdSchema.optional(),
});

export type AccountSessionHeaders = z.infer<typeof accountSessionHeadersSchema>;
