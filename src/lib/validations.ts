import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(255).transform(v => v.trim().toLowerCase()),
  password: z.string().min(6).max(128),
  username: z.string().trim().min(2).max(50).optional(),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  category: z.enum(["CHAT", "CODE", "DATA", "WORKFLOW"]),
  systemPrompt: z.string().max(10000).optional().default(""),
  pricingType: z.enum(["FREE", "PAID"]).optional().default("FREE"),
  creditsPerRun: z.number().int().min(0).max(10000).optional().default(0),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(["CHAT", "CODE", "DATA", "WORKFLOW"]).optional(),
  systemPrompt: z.string().max(10000).optional(),
  pricingType: z.enum(["FREE", "PAID"]).optional(),
  creditsPerRun: z.number().int().min(0).max(10000).optional(),
  status: z.string().optional(),
});

export const listAgentsSchema = z.object({
  category: z.string().optional(),
  q: z.string().max(200).optional(),
});

export const executeSchema = z.object({
  message: z.string().min(1).max(50000),
  systemPrompt: z.string().max(10000).optional(),
  category: z.enum(["CHAT", "CODE", "DATA", "WORKFLOW"]).optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(50000),
  model: z.string().max(100).optional(),
});

export const checkoutSchema = z.object({
  credits: z.number().int().positive(),
});

export const walletCreditSchema = z.object({
  amount: z.number().int().positive().max(1000000),
  description: z.string().max(500).optional(),
});

export const adminActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type ExecuteInput = z.infer<typeof executeSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
