"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FavoriteAgent {
  id: string;
  agent: {
    id: string;
    name: string;
    slug: string;
    category: string;
    pricingType: string;
    creditsPerRun: number;
    totalRuns: number;
    creator: { username: string | null };
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFavorites(); }, []);

  async function loadFavorites() {
    try {
      const res = await fetch("/api/agents?mine=false");
      if (res.ok) {
        const data = await res.json();
        const agentIds = new Set(data.agents?.map((a: any) => a.id) || []);
        setFavorites(data.agents?.filter((a: any) => agentIds.has(a.id)) || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function removeFavorite(agentId: string) {
    try {
      await fetch(`/api/agents/${agentId}/favorite`, { method: "DELETE" });
      setFavorites(prev => prev.filter(f => f.agent?.id !== agentId));
    } catch {}
  }

  // We need to fetch favorites properly. Let's use a direct endpoint.
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agents?limit=100");
        if (!res.ok) return;
        const data = await res.json();
        const agents = data.agents || [];
        const favPromises = agents.map((a: any) =>
          fetch(`/api/agents/${a.slug}/favorite`, { method: "GET" }).then(r => r.ok ? r.json() : null).catch(() => null)
        );
        const results = await Promise.all(favPromises);
        const favAgents = agents.filter((_: any, i: number) => results[i]?.isFavorited);
        setFavorites(favAgents);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Favorites</h1>
        <p className="text-sm text-zinc-500 mt-1">Agents you&apos;ve saved for quick access</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm mb-4">No favorites yet</p>
            <Link href="/agents">
              <Button variant="secondary" size="sm">Browse Agents</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav: any) => (
            <Link key={fav.id || fav.slug} href={`/agents/${fav.slug}`} className="group">
              <Card className="p-5 hover:border-zinc-700 transition-colors h-full">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={fav.category === "CHAT" ? "purple" : fav.category === "CODE" ? "success" : fav.category === "DATA" ? "warning" : "default"}>
                    {fav.category}
                  </Badge>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(fav.id); }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">{fav.name}</h3>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
                  <span>by {fav.creator?.username || "anonymous"}</span>
                  <span>{fav.totalRuns} runs</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}