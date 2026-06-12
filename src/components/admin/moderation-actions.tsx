"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ModerationActionsProps {
  agentId: string;
}

export function ModerationActions({ agentId }: ModerationActionsProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "reject" ? JSON.stringify({ reason: rejectReason }) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Action failed");
      } else {
        window.location.reload();
      }
    } catch {
      alert("Action failed");
    } finally {
      setLoading(null);
      setShowRejectInput(false);
      setRejectReason("");
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleAction("approve")}
        variant="primary"
        size="sm"
        loading={loading === "approve"}
      >
        Approve
      </Button>
      {showRejectInput ? (
        <div className="flex gap-2 items-center">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-48 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoFocus
          />
          <Button
            onClick={() => handleAction("reject")}
            variant="destructive"
            size="sm"
            loading={loading === "reject"}
            disabled={!rejectReason.trim()}
          >
            Confirm Reject
          </Button>
          <button
            onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
            className="text-xs text-zinc-500 hover:text-zinc-400"
          >
            Cancel
          </button>
        </div>
      ) : (
        <Button
          onClick={() => setShowRejectInput(true)}
          variant="destructive"
          size="sm"
        >
          Reject
        </Button>
      )}
    </div>
  );
}
