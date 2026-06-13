"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tags: string[];
  isFeatured: boolean;
  usageCount: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");

  useEffect(() => { loadTemplates(); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTemplates() {
    try {
      const res = await fetch(`/api/templates${category !== "ALL" ? `?category=${category}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {} finally { setLoading(false); }
  }

  const categories = ["ALL", "CHAT", "CODE", "DATA", "WORKFLOW"];

  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agent Templates</h1>
        <p className="text-sm text-zinc-500 mt-1">Start with a pre-built template and customize it</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-zinc-800/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {cat === "ALL" ? "All Categories" : cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No templates available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <Link key={tpl.id} href={`/agents/create?template=${tpl.slug}`}>
              <Card className="p-6 hover:border-purple-500/50 transition-all duration-300 group h-full hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={tpl.category === "CHAT" ? "purple" : tpl.category === "CODE" ? "success" : tpl.category === "DATA" ? "warning" : "default"}>
                    {tpl.category}
                  </Badge>
                  {tpl.isFeatured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Featured</span>
                  )}
                </div>
                <h3 className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors mb-2">{tpl.name}</h3>
                {tpl.description && (
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{tpl.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>{tpl.usageCount} uses</span>
                  {tpl.tags.length > 0 && (
                    <span className="flex gap-1">
                      {tpl.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-zinc-800">{tag}</span>
                      ))}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}