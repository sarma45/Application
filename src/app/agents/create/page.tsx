"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AGENT_CREDITS_PER_RUN_MAX } from "@/lib/limits";

const categories = ["CHAT", "CODE", "DATA", "WORKFLOW"];

export default function CreateAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          category: form.get("category"),
          systemPrompt: form.get("systemPrompt"),
          pricingType: form.get("pricingType"),
          creditsPerRun: Number(form.get("creditsPerRun")) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create agent");
        setLoading(false);
        return;
      }

      router.push(`/agents/${data.slug}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="container-main py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-theme mb-8">Publish an Agent</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="name" name="name" label="Agent Name" placeholder="My Awesome Agent" required />

            <Input id="slug" name="slug" label="URL Slug" placeholder="my-awesome-agent" required />
            <div>
              <label htmlFor="category" className="text-sm font-medium text-theme block mb-1.5">Category</label>
              <select
                id="category"
                name="category"
                className="flex h-10 w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="systemPrompt" className="text-sm font-medium text-theme block mb-1.5">System Prompt</label>
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                rows={6}
                className="flex w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="You are an AI agent that..."
              />
            </div>

            <div>
              <label htmlFor="pricingType" className="text-sm font-medium text-theme block mb-1.5">Pricing</label>
              <select
                id="pricingType"
                name="pricingType"
                className="flex h-10 w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="FREE">Free</option>
                <option value="PAID">Paid (credits)</option>
              </select>
            </div>

            <Input
              id="creditsPerRun"
              name="creditsPerRun"
              label="Credits per Run"
              type="number"
              min="0"
              max={AGENT_CREDITS_PER_RUN_MAX}
              defaultValue="1"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Create Agent</Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
