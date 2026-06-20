export type AgentCategory = "CHAT" | "CODE" | "DATA" | "WORKFLOW";
export type ProviderName = "openrouter" | "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "cohere";
export type UserRole = "USER" | "ADMIN" | "CREATOR";
export type AgentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "FLAGGED";
export type PricingType = "FREE" | "CREDITS" | "SUBSCRIPTION";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "unpaid";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type TransactionType = "CREDIT" | "DEBIT" | "PURCHASE" | "EARNING" | "REFUND" | "WITHDRAWAL";
export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export interface ProviderRoute {
  provider: ProviderName;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionParams {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  text: string;
  usage: { promptTokens: number; completionTokens: number };
  provider: ProviderName;
  model: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface SafetyResult {
  safe: boolean;
  reason?: string;
  score?: number;
}

export interface ExecutionLogEvent {
  agentId: string;
  userId: string;
  sessionId?: string;
  inputTokens?: number;
  outputTokens?: number;
  creditsUsed: number;
  durationMs?: number;
  status: string;
  modelUsed?: string;
  provider?: string;
  errorLog?: string;
  output?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: SubscriptionStatus;
  provider: string;
  providerSubId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  provider: string;
  providerPaymentId?: string;
  amountUsd: number;
  creditsGranted?: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface CreatorPayout {
  id: string;
  creatorId: string;
  amountUsd: number;
  creditsRedeemed?: number;
  status: PayoutStatus;
  payoutMethod?: string;
  payoutReference?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: string;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  creatorId: string;
  name: string;
  slug: string;
  description?: string;
  category: AgentCategory;
  status: AgentStatus;
  pricingType: PricingType;
  creditsPerRun: number;
  modelProvider: ProviderName;
  modelId?: string;
  systemPrompt?: string;
  toolsConfig?: Record<string, unknown>;
  tags: string[];
  isFeatured: boolean;
  isFlagged: boolean;
  totalRuns: number;
  avgRating?: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  sessionId?: string;
  inputTokens?: number;
  outputTokens?: number;
  creditsUsed: number;
  durationMs?: number;
  status: string;
  modelUsed?: string;
  provider?: string;
  output?: string;
  errorLog?: string;
  createdAt: string;
}

export const PROVIDER_DEFAULTS: Record<ProviderName, { baseUrl: string; defaultModel: string }> = {
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-4-maverick:free" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta", defaultModel: "gemini-2.5-flash" },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-3-haiku-20240307" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  cohere: { baseUrl: "https://api.cohere.ai/v1", defaultModel: "command-r-plus" },
};
