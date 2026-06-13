"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  agentId: string;
  slug: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ agentId: _agentId, slug, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/agents/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title || undefined, body: body || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }
      setRating(0);
      setTitle("");
      setBody("");
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`text-lg transition-colors ${
              star <= (hover || rating) ? "text-yellow-400" : "text-muted"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        maxLength={200}
        className="w-full rounded-lg border border-theme bg-card px-3 py-2 text-sm text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience (optional)"
        maxLength={5000}
        rows={3}
        className="w-full rounded-lg border border-theme bg-card px-3 py-2 text-sm text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="submit" size="sm" loading={submitting} disabled={rating === 0}>
        Submit Review
      </Button>
    </form>
  );
}
