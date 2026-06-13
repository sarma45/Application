"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FeaturedToggleProps {
  agentId: string;
  isFeatured: boolean;
}

export function FeaturedToggle({ agentId, isFeatured }: FeaturedToggleProps) {
  const [featured, setFeatured] = useState(isFeatured);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/feature`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFeatured(data.isFeatured);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  return (
    <Button
      onClick={handleToggle}
      variant={featured ? "primary" : "secondary"}
      size="sm"
      loading={loading}
    >
      {featured ? "Featured" : "Feature"}
    </Button>
  );
}
