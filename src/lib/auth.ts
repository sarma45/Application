import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth();
  const role = (session.user as any).role;
  if (!roles.includes(role)) redirect("/");
  return session;
}

/* eslint-disable no-unused-vars */
declare module "next-auth" {
  interface Session {
  /* eslint-enable no-unused-vars */
    user: {
      id: string;
      email: string;
      name?: string | null;
      username?: string | null;
      role: string;
      plan: string;
    };
  }
  /* eslint-disable no-unused-vars */
  interface User {
  /* eslint-enable no-unused-vars */
    username?: string;
    role: string;
    plan: string;
  }
}

/* eslint-disable no-unused-vars */
declare module "next-auth/jwt" {
  interface JWT {
  /* eslint-enable no-unused-vars */
    id: string;
    username?: string | null;
    role: string;
    plan: string;
  }
}
