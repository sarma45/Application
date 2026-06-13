export interface MCPTool {
  name: string;
  description: string;
  provider: string;
  endpoint: string;
  parameters: Record<string, unknown>;
  authentication?: {
    type: "api_key" | "bearer" | "basic";
    headerName?: string;
  };
}

export interface MCPToolExecution {
  toolName: string;
  parameters: Record<string, unknown>;
  result: unknown;
  durationMs: number;
  success: boolean;
}

const tools = new Map<string, MCPTool>();

export function registerTool(tool: MCPTool): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): MCPTool | undefined {
  return tools.get(name);
}

export function listTools(): MCPTool[] {
  return Array.from(tools.values());
}

export function unregisterTool(name: string): void {
  tools.delete(name);
}

export const BUILT_IN_TOOLS: MCPTool[] = [
  {
    name: "web_search",
    description: "Search the web for current information",
    provider: "built-in",
    endpoint: "/api/mcp/web-search",
    parameters: {
      query: { type: "string", description: "Search query" },
      maxResults: { type: "number", default: 5 },
    },
  },
  {
    name: "web_fetch",
    description: "Fetch content from a URL",
    provider: "built-in",
    endpoint: "/api/mcp/web-fetch",
    parameters: {
      url: { type: "string", description: "URL to fetch" },
      format: { type: "string", enum: ["markdown", "text", "html"], default: "markdown" },
    },
  },
  {
    name: "code_runner",
    description: "Execute code in a sandboxed environment",
    provider: "built-in",
    endpoint: "/api/mcp/code-runner",
    parameters: {
      language: { type: "string", enum: ["javascript", "python", "typescript", "bash"] },
      code: { type: "string", description: "Code to execute" },
    },
  },
  {
    name: "data_analysis",
    description: "Analyze structured data and return insights",
    provider: "built-in",
    endpoint: "/api/mcp/data-analysis",
    parameters: {
      data: { type: "string", description: "CSV or JSON data" },
      operation: { type: "string", enum: ["summary", "chart", "filter", "group"] },
    },
  },
  {
    name: "send_email",
    description: "Send an email via the platform",
    provider: "built-in",
    endpoint: "/api/mcp/send-email",
    parameters: {
      to: { type: "string", description: "Recipient email" },
      subject: { type: "string", description: "Email subject" },
      body: { type: "string", description: "Email body" },
    },
  },
  {
    name: "http_request",
    description: "Make an HTTP request to any API",
    provider: "built-in",
    endpoint: "/api/mcp/http-request",
    parameters: {
      url: { type: "string" },
      method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
      headers: { type: "object" },
      body: { type: "string" },
    },
  },
];

export async function executeTool(toolName: string, params: Record<string, unknown>): Promise<MCPToolExecution> {
  const tool = tools.get(toolName) || BUILT_IN_TOOLS.find(t => t.name === toolName);
  if (!tool) {
    return {
      toolName,
      parameters: params,
      result: { error: `Tool "${toolName}" not found` },
      durationMs: 0,
      success: false,
    };
  }

  const startTime = Date.now();
  try {
    const response = await fetch(tool.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return {
      toolName,
      parameters: params,
      result,
      durationMs: Date.now() - startTime,
      success: response.ok,
    };
  } catch (error) {
    return {
      toolName,
      parameters: params,
      result: { error: String(error) },
      durationMs: Date.now() - startTime,
      success: false,
    };
  }
}

export function getToolsConfigForAgent(toolsConfig: Record<string, unknown> | null): MCPTool[] {
  if (!toolsConfig) return [];

  const enabledTools = toolsConfig.enabledTools as string[] | undefined;
  if (!enabledTools || !Array.isArray(enabledTools)) return BUILT_IN_TOOLS;

  return BUILT_IN_TOOLS.filter(t => enabledTools.includes(t.name));
}