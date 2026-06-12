import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export async function getSession(): Promise<Session | null> {
  return getServerSession();
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

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      username?: string | null;
      role: string;
      plan: string;
    };
  }
  interface User {
    username?: string;
    role: string;
    plan: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
    role: string;
    plan: string;
  }
}
