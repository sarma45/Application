"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["agents:read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.key);
        setShowNew(false);
        setNewKeyName("");
        loadKeys();
      }
    } catch {}
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    try {
      await fetch("/api/keys", { method: "DELETE", body: JSON.stringify({ id }) });
      loadKeys();
    } catch {}
  }

  async function toggleKey(id: string, isActive: boolean) {
    try {
      await fetch("/api/keys", { method: "PATCH", body: JSON.stringify({ id, isActive: !isActive }) });
      loadKeys();
    } catch {}
  }

  const allScopes = [
    { value: "agents:read", label: "Read agents" },
    { value: "agents:write", label: "Create & update agents" },
    { value: "agents:execute", label: "Execute agents" },
    { value: "wallet:read", label: "Read wallet balance" },
    { value: "chat", label: "Chat with AI" },
  ];

  function toggleScope(scope: string) {
    setNewKeyScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">API Keys</h2>
          <p className="text-sm text-zinc-500">Manage keys for programmatic access</p>
        </div>
        <Button onClick={() => { setShowNew(!showNew); setCreatedKey(null); }} size="sm">
          {showNew ? "Cancel" : "Create Key"}
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Key Name</label>
              <input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {allScopes.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleScope(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      newKeyScopes.includes(s.value)
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={createKey} disabled={!newKeyName.trim()}>Generate Key</Button>
          </CardContent>
        </Card>
      )}

      {createdKey && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-emerald-400 mb-2">Key created! Copy it now — you won&apos;t see it again.</p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-mono break-all">
                {createdKey}
              </code>
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(createdKey)}>
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />)}
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-zinc-500 text-sm">No API keys yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${key.isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <span className="font-medium text-zinc-200">{key.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {key.scopes.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{s}</span>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button size="sm" variant="ghost" onClick={() => toggleKey(key.id, key.isActive)}>
                  {key.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteKey(key.id)}>
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