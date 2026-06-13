"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";

/* eslint-disable no-unused-vars */
declare global {
  interface Window {
  /* eslint-enable no-unused-vars */
    turnstile?: {
      render: (_container: string | HTMLElement, _options: Record<string, unknown>) => string;
      getResponse: (_widgetId: string) => string;
      reset: (_widgetId: string) => void;
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        turnstileRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
          theme: "dark",
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let turnstileToken = "";
    if (window.turnstile && turnstileRef.current) {
      turnstileToken = window.turnstile.getResponse(turnstileRef.current);
    }

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      turnstileToken,
      redirect: false,
    });

    setLoading(false);

    if (window.turnstile && turnstileRef.current) {
      window.turnstile.reset(turnstileRef.current);
    }

    if (result?.error) {
      setError(result.error === "CaptchaFailed" ? "Captcha validation failed. Please try again." : "Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-stream-500 neural-glow">
              <span className="text-lg font-bold text-theme">A</span>
            </div>
            <h1 className="text-xl font-semibold text-theme">Welcome back</h1>
            <p className="mt-1 text-sm text-secondary">Sign in to your account</p>
          </div>
        </CardHeader>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="email" name="email" label="Email" type="email" placeholder="you@example.com" required />
            <Input id="password" name="password" label="Password" type="password" placeholder="Enter your password" required />
            <div ref={turnstileContainerRef} className="flex justify-center" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-secondary hover:text-purple-400 transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>
          <div className="mt-4 space-y-2">
            <p className="text-center text-sm text-secondary">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
