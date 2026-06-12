"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
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
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="email" name="email" label="Email" type="email" placeholder="you@example.com" required />
            <Input id="password" name="password" label="Password" type="password" placeholder="Enter your password" required />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
