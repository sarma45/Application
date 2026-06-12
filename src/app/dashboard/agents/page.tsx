"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  totalRuns: number;
  avgRating: number | null;
  createdAt: string;
}

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents?mine=true")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-950 text-gray-100 p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Agents</h1>
            <p className="text-gray-400">Manage your published AI agents</p>
          </div>
          <Link
            href="/agents/create"
            className="py-2 px-6 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors"
          >
            Create Agent
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">You haven&apos;t created any agents yet.</p>
            <Link href="/agents/create" className="text-cyan-400 hover:underline">
              Create your first agent
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{agent.category}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          agent.status === "APPROVED" ? "bg-emerald-900/50 text-emerald-400" :
                          agent.status === "PENDING" ? "bg-yellow-900/50 text-yellow-400" :
                          agent.status === "DRAFT" ? "bg-gray-800 text-gray-400" :
                          "bg-red-900/50 text-red-400"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p>{agent.totalRuns} runs</p>
                    {agent.avgRating && <p>★ {agent.avgRating.toFixed(1)}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
