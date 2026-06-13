"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface UsageStats {
  executionsToday: number;
  dailyLimit: number;
  creditsUsedThisMonth: number;
  creditsRemaining: number;
  totalExecutions: number;
  freeTierActive: boolean;
}

export default function UsageMeter() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wallet");
        if (res.ok) {
          const data = await res.json();
          const wallet = data.wallet;
          setStats({
            executionsToday: 0,
            dailyLimit: 10,
            creditsUsedThisMonth: wallet?.lifetimeSpent || 0,
            creditsRemaining: wallet?.balance || 0,
            totalExecutions: 0,
            freeTierActive: true,
          });
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-800/50 animate-pulse" />
        <div className="h-2 rounded-full bg-zinc-800/50 animate-pulse" />
      </div>
    );
  }

  if (!stats) return null;

  const usagePercent = Math.min(100, (stats.creditsUsedThisMonth / Math.max(stats.creditsRemaining + stats.creditsUsedThisMonth, 1)) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Credits Used</span>
        <span className="text-zinc-200 font-medium">
          {stats.creditsRemaining} remaining
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usagePercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-500"
        />
      </div>
      {stats.freeTierActive && (
        <p className="text-[11px] text-zinc-600">
          {stats.executionsToday}/{stats.dailyLimit} free runs today
        </p>
      )}
    </div>
  );
}