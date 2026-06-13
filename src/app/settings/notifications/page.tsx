"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const res = await fetch(`/api/notifications?limit=50${filter === "unread" ? "&unread=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id }) });
    load();
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ readAll: true }) });
    load();
  }

  const typeIcons: Record<string, string> = {
    agent_approved: "✅",
    agent_rejected: "❌",
    agent_featured: "⭐",
    payout_completed: "💰",
    review_received: "💬",
    execution_milestone: "🚀",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="text-sm text-zinc-500">Stay updated on your agents and earnings</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>All</Button>
          <Button size="sm" variant={filter === "unread" ? "primary" : "ghost"} onClick={() => setFilter("unread")}>Unread</Button>
          <Button size="sm" variant="ghost" onClick={markAllRead}>Mark All Read</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.read
                  ? "border-zinc-800/50 bg-zinc-900/20"
                  : "border-purple-500/20 bg-purple-500/5"
              }`}
              onClick={() => { if (!n.read) markRead(n.id); if (n.link) window.location.href = n.link; }}
            >
              <span className="text-xl shrink-0">{typeIcons[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${n.read ? "text-zinc-400" : "text-zinc-200"}`}>
                    {n.title}
                  </p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                </div>
                {n.body && <p className="text-xs text-zinc-500 mt-1">{n.body}</p>}
                <p className="text-[11px] text-zinc-600 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}