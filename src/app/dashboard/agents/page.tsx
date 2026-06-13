"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
        setAgents(d.agents || d.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container-main py-8"><p className="text-secondary">Loading...</p></div>;

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-theme">My Agents</h1>
          <p className="text-sm text-secondary">Manage your published AI agents</p>
        </div>
        <Link href="/agents/create">
          <Button size="sm">Create Agent</Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-secondary mb-4">No agents yet</p>
            <Link href="/agents/create">
              <Button variant="secondary" size="sm">Create your first agent</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.slug}`}>
              <Card className="p-5 hover:border-zinc-700 transition-colors flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-theme">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default">{agent.category}</Badge>
                    <Badge
                      variant={agent.status === "APPROVED" ? "success" : agent.status === "PENDING" ? "warning" : "default"}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-secondary">
                  <p>{agent.totalRuns} runs</p>
                  {agent.avgRating ? <p>★ {agent.avgRating.toFixed(1)}</p> : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
