import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("boccone-api"),
  version: z.string(),
  /** Request id, echoed for traceability. */
  requestId: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
