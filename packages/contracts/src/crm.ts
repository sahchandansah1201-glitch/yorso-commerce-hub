import { z } from "zod";

export const crmFullUiResponseSchema = z.object({
  ok: z.literal(true),
  crmUrl: z.string().url(),
  requestId: z.string().min(1),
});

export type CrmFullUiResponse = z.infer<typeof crmFullUiResponseSchema>;
