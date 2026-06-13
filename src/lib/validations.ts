import { z } from "zod";
import {
  AGENT_CREDITS_PER_RUN_MAX,
  AGENT_EXECUTION_MESSAGE_MAX_LENGTH,
  AGENT_SYSTEM_PROMPT_MAX_LENGTH,
} from "@/lib/limits";

export {
  AGENT_CREDITS_PER_RUN_MAX,
  AGENT_EXECUTION_MESSAGE_MAX_LENGTH,
  AGENT_SYSTEM_PROMPT_MAX_LENGTH,
};

export const registerSchema = z.object({
  email: z.string().email().max(255).transform(v => v.trim().toLowerCase()),
  password: z.string().min(8).max(128).refine(v => /[A-Z]/.test(v), "Must contain uppercase letter")
    .refine(v => /[a-z]/.test(v), "Must contain lowercase letter")
    .refine(v => /[0-9]/.test(v), "Must contain digit"),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only alphanumeric and underscores").optional(),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  category: z.enum(["CHAT", "CODE", "DATA", "WORKFLOW"]),
  systemPrompt: z.string().max(AGENT_SYSTEM_PROMPT_MAX_LENGTH).optional().default(""),
  pricingType: z.enum(["FREE", "PAID"]).optional().default("FREE"),
  creditsPerRun: z.number().int().min(0).max(AGENT_CREDITS_PER_RUN_MAX).optional().default(0),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(["CHAT", "CODE", "DATA", "WORKFLOW"]).optional(),
  systemPrompt: z.string().max(AGENT_SYSTEM_PROMPT_MAX_LENGTH).optional(),
  pricingType: z.enum(["FREE", "PAID"]).optional(),
  creditsPerRun: z.number().int().min(0).max(AGENT_CREDITS_PER_RUN_MAX).optional(),
  status: z.string().optional(),
});

export const listAgentsSchema = z.object({
  category: z.string().optional(),
  q: z.string().max(200).optional(),
  mine: z.string().optional(),
});

export const executeSchema = z.object({
  message: z.string().min(1).max(AGENT_EXECUTION_MESSAGE_MAX_LENGTH),
  systemPrompt: z.string().max(AGENT_SYSTEM_PROMPT_MAX_LENGTH).optional(),
  category: z.enum(["CHAT", "CODE", "DATA", "WORKFLOW"]).optional(),
  sessionId: z.string().max(200).optional(),
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
