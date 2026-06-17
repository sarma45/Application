import { z } from "zod";

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description: string }[];
  paths: Record<string, Record<string, OperationObject>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

interface OperationObject {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
  security?: Record<string, string[]>[];
}

interface ParameterObject {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema: { type: string; [key: string]: unknown };
  description?: string;
}

interface RequestBodyObject {
  required?: boolean;
  content: Record<string, { schema: unknown }>;
}

interface ResponseObject {
  description: string;
  content?: Record<string, { schema: unknown }>;
}

function zodToOpenAPIType(zodType: z.ZodTypeAny): Record<string, unknown> {
  if (zodType instanceof z.ZodString) {
    const schema: Record<string, unknown> = { type: "string" };
    const checks = (zodType._def as any).checks ?? [];
    for (const check of checks) {
      if (check.kind === "min") schema.minLength = check.value;
      if (check.kind === "max") schema.maxLength = check.value;
    }
    return schema;
  }
  if (zodType instanceof z.ZodNumber) {
    const schema: Record<string, unknown> = { type: "number" };
    const checks = (zodType._def as any).checks ?? [];
    for (const check of checks) {
      if (check.kind === "min") schema.minimum = check.value;
      if (check.kind === "max") schema.maximum = check.value;
    }
    return schema;
  }
  if (zodType instanceof z.ZodBoolean) return { type: "boolean" };
  if (zodType instanceof z.ZodEnum) {
    return { type: "string", enum: zodType._def.values };
  }
  if (zodType instanceof z.ZodArray) {
    return { type: "array", items: zodToOpenAPIType(zodType._def.type) };
  }
  if (zodType instanceof z.ZodObject) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(zodType._def.shape())) {
      properties[key] = zodToOpenAPIType(value as z.ZodTypeAny);
      if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
        required.push(key);
      }
    }
    return { type: "object", properties, ...(required.length ? { required } : {}) };
  }
  if (zodType instanceof z.ZodOptional) {
    return zodToOpenAPIType(zodType._def.innerType);
  }
  if (zodType instanceof z.ZodDefault) {
    const schema = zodToOpenAPIType(zodType._def.innerType);
    if (zodType._def.defaultValue !== undefined) {
      schema.default = typeof zodType._def.defaultValue === "function"
        ? zodType._def.defaultValue()
        : zodType._def.defaultValue;
    }
    return schema;
  }
  return { type: "string" };
}

export function zodToOpenAPIResponse(zodType: z.ZodTypeAny): { schema: Record<string, unknown> } {
  return { schema: zodToOpenAPIType(zodType) as Record<string, unknown> };
}

export function createOpenAPISpec(schemas: {
  paths?: Record<string, Record<string, OperationObject>>;
  schemas?: Record<string, z.ZodTypeAny>;
}): OpenAPISchema {
  const schema: OpenAPISchema = {
    openapi: "3.1.0",
    info: {
      title: "AIVerse API",
      version: "2.0.0",
      description: "Enterprise AI Agent Marketplace API — manage agents, execute AI completions, handle billing, and more.",
    },
    servers: [
      { url: "https://api.aiverse.ai/v1", description: "Production" },
      { url: "https://staging.api.aiverse.ai/v1", description: "Staging" },
    ],
    paths: schemas.paths || {},
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
  };

  if (schemas.schemas) {
    for (const [name, zodSchema] of Object.entries(schemas.schemas)) {
      if (schema.components?.schemas) {
        schema.components.schemas[name] = zodToOpenAPIType(zodSchema);
      }
    }
  }

  return schema;
}

export function apiPath(path: string): string {
  return `/api/v1${path}`;
}
