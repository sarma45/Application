"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setDevUrl(data.devResetUrl || "");
      setSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-6 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full glass">
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-theme mb-2">Check your email</h1>
              <p className="text-sm text-secondary">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
            </div>
            {devUrl && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-left">
                <p className="text-amber-400 font-medium mb-1">Development mode</p>
                <p className="text-secondary mb-2">Email not configured. Use this link instead:</p>
                <a
                  href={devUrl}
                  className="text-purple-400 hover:text-purple-300 break-all underline"
                >
                  {devUrl}
                </a>
              </div>
            )}
            <Link href="/login">
              <Button variant="secondary" className="w-full">Back to login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-stream-500 neural-glow">
              <span className="text-lg font-bold text-theme">A</span>
            </div>
            <h1 className="text-xl font-semibold text-theme">Reset your password</h1>
            <p className="mt-1 text-sm text-secondary">Enter your email and we&apos;ll send you a reset link</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-secondary">
            Remember your password?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
