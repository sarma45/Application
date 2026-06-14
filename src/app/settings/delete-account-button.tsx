"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
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
    } finally {
      setDeleting(false);
      setShowFinalConfirm(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        Delete Account
      </Button>
      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); setShowFinalConfirm(true); }}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This cannot be undone."
        confirmLabel="Yes, delete"
        variant="danger"
      />
      <ConfirmModal
        open={showFinalConfirm}
        onClose={() => setShowFinalConfirm(false)}
        onConfirm={handleDelete}
        title="Final Confirmation"
        message="This will permanently delete all your agents, reviews, and data. Continue?"
        confirmLabel="Permanently Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
