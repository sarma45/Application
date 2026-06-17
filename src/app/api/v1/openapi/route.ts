import { NextResponse } from "next/server";
import { createOpenAPISpec } from "@/lib/openapi";
import {
  registerSchema,
  createAgentSchema,
  updateAgentSchema,
  chatSchema,
  executeSchema,
  createReviewSchema,
  checkoutSchema,
} from "@/lib/validations";

const spec = createOpenAPISpec({
  paths: {
    "/api/v1/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        },
        responses: {
          "201": { description: "User registered successfully" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/v1/chat": {
      post: {
        summary: "Send a chat message to the AI",
        tags: ["Chat"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChatInput" } } },
        },
        responses: {
          "200": { description: "AI response" },
          "400": { description: "Validation or safety error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/agents": {
      get: {
        summary: "List agents with search and pagination",
        tags: ["Agents"],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category" },
          { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["popular", "trending", "newest"] }, description: "Sort order" },
          { name: "cursor", in: "query", schema: { type: "string" }, description: "Pagination cursor" },
          { name: "limit", in: "query", schema: { type: "number", default: 50 }, description: "Results per page" },
        ],
        responses: {
          "200": { description: "List of agents" },
        },
      },
      post: {
        summary: "Create a new agent",
        tags: ["Agents"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAgentInput" } } },
        },
        responses: {
          "201": { description: "Agent created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/agents/{id}/reviews": {
      post: {
        summary: "Create a review for an agent",
        tags: ["Agents"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateReviewInput" } } },
        },
        responses: {
          "201": { description: "Review created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/v1/checkout": {
      post: {
        summary: "Purchase credits",
        tags: ["Billing"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutInput" } } },
        },
        responses: {
          "200": { description: "Checkout URL or session" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/execute": {
      post: {
        summary: "Execute an AI agent",
        tags: ["Agents"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ExecuteInput" } } },
        },
        responses: {
          "200": { description: "Agent execution result" },
          "400": { description: "Validation or safety error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/wallet": {
      get: {
        summary: "Get wallet balance and transactions",
        tags: ["Billing"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Wallet details" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/users/me": {
      get: {
        summary: "Get current user profile",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "User profile" },
          "401": { description: "Unauthorized" },
        },
      },
      put: {
        summary: "Update user profile",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Profile updated" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/health": {
      get: {
        summary: "Health check endpoint",
        tags: ["System"],
        responses: {
          "200": { description: "Service is healthy" },
        },
      },
    },
  },
  schemas: {
    RegisterInput: registerSchema,
    CreateAgentInput: createAgentSchema,
    UpdateAgentInput: updateAgentSchema,
    ChatInput: chatSchema,
    ExecuteInput: executeSchema,
    CreateReviewInput: createReviewSchema,
    CheckoutInput: checkoutSchema,
  },
});

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
