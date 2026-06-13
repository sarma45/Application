"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}

const eventLabels: Record<string, string> = {
  "agent.created": "Agent Created",
  "agent.updated": "Agent Updated",
  "agent.deleted": "Agent Deleted",
  "execution.completed": "Execution Completed",
  "execution.failed": "Execution Failed",
  "review.created": "Review Created",
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["execution.completed"]);
  const [showSecret, setShowSecret] = useState<string | null>(null);

  useEffect(() => { loadWebhooks(); }, []);

  async function loadWebhooks() {
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function createWebhook() {
    if (!newUrl.trim()) return;
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST", body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowSecret(data.webhook.secret);
        setShowNew(false);
        setNewUrl("");
        loadWebhooks();
      }
    } catch {}
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook?")) return;
    try { await fetch("/api/webhooks", { method: "DELETE", body: JSON.stringify({ id }) }); loadWebhooks(); } catch {}
  }

  async function toggleWebhook(id: string, isActive: boolean) {
    try { await fetch("/api/webhooks", { method: "PATCH", body: JSON.stringify({ id, isActive: !isActive }) }); loadWebhooks(); } catch {}
  }

  function toggleEvent(event: string) {
    setNewEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  }

  const allEvents = Object.keys(eventLabels);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Webhooks</h2>
          <p className="text-sm text-zinc-500">Receive real-time events via HTTP callbacks</p>
        </div>
        <Button onClick={() => { setShowNew(!showNew); setShowSecret(null); }} size="sm">
          {showNew ? "Cancel" : "Create Webhook"}
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Endpoint URL</label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-app.com/webhook"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Events</label>
              <div className="flex flex-wrap gap-2">
                {allEvents.map((ev) => (
                  <button
                    key={ev}
                    onClick={() => toggleEvent(ev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      newEvents.includes(ev)
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {eventLabels[ev]}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={createWebhook} disabled={!newUrl.trim()}>Create Webhook</Button>
          </CardContent>
        </Card>
      )}

      {showSecret && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-emerald-400 mb-2">Webhook created! Signing secret:</p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-mono break-all">
                {showSecret}
              </code>
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(showSecret)}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Use this secret to verify webhook payloads are from AIVerse.</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />)}</div>
      ) : webhooks.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-zinc-500 text-sm">No webhooks yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${wh.isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <code className="text-sm text-zinc-200 font-mono truncate block">{wh.url}</code>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {wh.events.map((ev) => (
                    <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                      {eventLabels[ev] || ev}
                    </span>
                  ))}
                </div>
                {wh.lastTriggeredAt && (
                  <p className="text-[11px] text-zinc-600 mt-1">Last triggered {new Date(wh.lastTriggeredAt).toLocaleString()}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button size="sm" variant="ghost" onClick={() => toggleWebhook(wh.id, wh.isActive)}>
                  {wh.isActive ? "Pause" : "Resume"}
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteWebhook(wh.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}