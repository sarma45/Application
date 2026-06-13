"use client";

import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    if (!confirm("This will permanently delete all your agents, reviews, and data. Continue?")) return;
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account");
      }
    } catch {
      alert("Failed to delete account");
    }
  }

  return <Button variant="destructive" onClick={handleDelete}>Delete Account</Button>;
}
