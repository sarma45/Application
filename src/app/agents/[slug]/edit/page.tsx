"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const categories = ["CHAT", "CODE", "DATA", "WORKFLOW"];

interface Agent {
  id: string;
  name: string;
  slug: string;
  category: string;
  systemPrompt: string | null;
  pricingType: string;
  creditsPerRun: number;
  status: string;
}

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetch(`/api/agents/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setAgent(d.agent);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load agent");
        setLoading(false);
      });
  }, [slug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: form.get("name"),
      category: form.get("category"),
      systemPrompt: form.get("systemPrompt"),
      pricingType: form.get("pricingType"),
      creditsPerRun: Number(form.get("creditsPerRun")) || 0,
    };

    try {
      const res = await fetch(`/api/agents/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update agent");
        setSaving(false);
        return;
      }

      router.push(`/agents/${slug}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!confirm("Are you sure you want to archive this agent? Users will no longer be able to run it.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (res.ok) {
        router.push("/dashboard/agents");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to archive");
      }
    } catch {
      setError("Failed to archive agent");
    }
    setSaving(false);
  }

  if (loading) return <div className="container-main py-8"><p className="text-zinc-500">Loading...</p></div>;
  if (!agent) return <div className="container-main py-8"><p className="text-red-400">Agent not found</p></div>;

  return (
    <div className="container-main py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Edit Agent</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              name="name"
              label="Agent Name"
              defaultValue={agent.name}
              required
            />

            <div>
              <label htmlFor="category" className="text-sm font-medium text-zinc-300 block mb-1.5">Category</label>
              <select
                id="category"
                name="category"
                defaultValue={agent.category}
                className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="systemPrompt" className="text-sm font-medium text-zinc-300 block mb-1.5">System Prompt</label>
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                rows={6}
                defaultValue={agent.systemPrompt || ""}
                className="flex w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="You are an AI agent that..."
              />
            </div>

            <div>
              <label htmlFor="pricingType" className="text-sm font-medium text-zinc-300 block mb-1.5">Pricing</label>
              <select
                id="pricingType"
                name="pricingType"
                defaultValue={agent.pricingType}
                className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              defaultValue={agent.creditsPerRun}
            />

            <div className="text-xs text-zinc-600">
              Status: <span className="text-zinc-400">{agent.status}</span>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>Save Changes</Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-red-400">Danger Zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 mb-4">
            Archiving will prevent users from running this agent. You can unarchive it later.
          </p>
          <Button variant="destructive" onClick={handleArchive} loading={saving}>
            Archive Agent
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
