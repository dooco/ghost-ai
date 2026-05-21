import { z } from "zod";

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  sender: z.string().min(1).max(120),
  role: z.enum(["user", "ai"]),
  content: z.string().min(1).max(2000),
  timestamp: z.number().int().nonnegative(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
