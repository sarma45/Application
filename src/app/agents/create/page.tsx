"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AGENT_CREDITS_PER_RUN_MAX, AVAILABLE_MODELS } from "@/lib/limits";

const categories = ["CHAT", "CODE", "DATA", "WORKFLOW"];
const STEPS = ["Basics", "System Prompt", "Tools", "Pricing", "Test & Submit"];

export default function CreateAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "CHAT",
    systemPrompt: "",
    pricingType: "FREE",
    creditsPerRun: 1,
    modelProvider: "gemini",
    modelId: "gemini-2.5-flash",
  });
  const [testResult, setTestResult] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  function updateField(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return formData.name.trim().length > 0;
      case 1: return formData.systemPrompt.length <= 8000;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          systemPrompt: formData.systemPrompt,
          pricingType: formData.pricingType,
          creditsPerRun: formData.creditsPerRun,
          modelProvider: formData.modelProvider,
          modelId: formData.modelId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to create agent");
        setLoading(false);
        return;
      }
      setCreatedSlug(data.slug);
      setStep(4);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleSandboxTest() {
    if (!createdSlug) return;
    setTestLoading(true);
    setTestResult("");
    try {
      const res = await fetch(`/api/agents/${createdSlug}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hello! Tell me what you can do.",
          _test: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTestResult(`Error: ${data.error || "Test failed"}`);
      } else if (res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.text) setTestResult((prev) => prev + parsed.text);
                  if (parsed.error) setTestResult(`Error: ${parsed.error}`);
                } catch {
                  // skip
                }
              }
            }
          }
        }
      }
    } catch {
      setTestResult("Error: Network failure");
    }
    setTestLoading(false);
  }

  const inputClasses = "flex w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500";

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <Input
              id="name"
              label="Agent Name"
              placeholder="My Awesome Agent"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            <div>
              <label htmlFor="description" className="text-sm font-medium text-theme block mb-1.5">Description</label>
              <textarea
                id="description"
                rows={3}
                className={inputClasses}
                placeholder="Briefly describe what your agent does..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="category" className="text-sm font-medium text-theme block mb-1.5">Category</label>
              <select
                id="category"
                className="flex h-10 w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <label htmlFor="systemPrompt" className="text-sm font-medium text-theme block mb-1.5">
              System Prompt
              <span className={`ml-2 text-xs ${formData.systemPrompt.length > 8000 ? "text-red-400" : "text-secondary"}`}>
                {formData.systemPrompt.length}/8000
              </span>
            </label>
            <textarea
              id="systemPrompt"
              rows={10}
              className={inputClasses}
              placeholder="You are an AI agent that..."
              value={formData.systemPrompt}
              onChange={(e) => updateField("systemPrompt", e.target.value)}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-theme mb-3">AI Model</h3>
              <select
                id="model"
                className="flex h-10 w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.modelId}
                onChange={(e) => {
                  const selected = AVAILABLE_MODELS.find(m => m.model === e.target.value);
                  if (selected) {
                    updateField("modelProvider", selected.provider);
                    updateField("modelId", selected.model);
                  }
                }}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h3 className="text-sm font-medium text-theme mb-3">Tools Configuration</h3>
              <p className="text-sm text-secondary">
                MCP (Model Context Protocol) tools will be available in a future update.
              </p>
              <div className="rounded-lg border border-theme/30 p-4 opacity-50">
                <label className="flex items-center gap-3">
                  <input type="checkbox" disabled className="rounded border-theme" />
                  <span className="text-sm text-secondary">Web Search Tool (Coming Soon)</span>
                </label>
                <label className="flex items-center gap-3 mt-2">
                  <input type="checkbox" disabled className="rounded border-theme" />
                  <span className="text-sm text-secondary">File Analysis Tool (Coming Soon)</span>
                </label>
                <label className="flex items-center gap-3 mt-2">
                  <input type="checkbox" disabled className="rounded border-theme" />
                  <span className="text-sm text-secondary">API Integration Tool (Coming Soon)</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="pricingType" className="text-sm font-medium text-theme block mb-1.5">Pricing</label>
              <select
                id="pricingType"
                className="flex h-10 w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.pricingType}
                onChange={(e) => updateField("pricingType", e.target.value)}
              >
                <option value="FREE">Free</option>
                <option value="PAID">Paid (credits)</option>
              </select>
            </div>
            {formData.pricingType === "PAID" && (
              <Input
                id="creditsPerRun"
                label="Credits per Run"
                type="number"
                min={1}
                max={AGENT_CREDITS_PER_RUN_MAX}
                value={formData.creditsPerRun}
                onChange={(e) => updateField("creditsPerRun", Math.min(AGENT_CREDITS_PER_RUN_MAX, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <p className="text-sm text-secondary">
              Test your agent in sandbox mode (max 5 test runs) before submitting for review.
            </p>
            {createdSlug ? (
              <>
                <Button onClick={handleSandboxTest} loading={testLoading} variant="secondary">
                  Run Sandbox Test
                </Button>
                {testResult && (
                  <div className="rounded-lg border border-theme/30 bg-theme/30 p-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-red-400">Agent not yet created. Go back to step 3 and submit.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="container-main py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-theme mb-8">Publish an Agent</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                i === step
                  ? "bg-purple-600 text-white"
                  : i < step
                    ? "bg-purple-600/20 text-purple-400 cursor-pointer hover:bg-purple-600/30"
                    : "bg-theme/30 text-secondary"
              }`}
            >
              <span>{i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${i < step ? "bg-purple-600" : "bg-theme/30"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-5">
            {renderStep()}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-4 border-t border-theme/10">
              {step > 0 && step < 4 && (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {step === 0 && (
                <Button type="button" onClick={() => setStep(1)} disabled={!canProceed()}>
                  Next
                </Button>
              )}
              {step === 1 && (
                <Button type="button" onClick={() => setStep(2)} disabled={!canProceed()}>
                  Next
                </Button>
              )}
              {step === 2 && (
                <Button type="button" onClick={() => setStep(3)} disabled={!canProceed()}>
                  Next
                </Button>
              )}
              {step === 3 && (
                <Button type="button" onClick={handleSubmit} loading={loading} disabled={!canProceed()}>
                  Create Agent
                </Button>
              )}
              {step === 4 && createdSlug && (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push(`/agents/${createdSlug}/edit`)}
                  >
                    Edit Agent
                  </Button>
                  <Button type="button" onClick={() => router.push(`/agents/${createdSlug}`)}>
                    View Agent
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}