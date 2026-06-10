import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma-server";

export const { handlers, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const expected = user.password;
        const actual = await hashPassword(password);
        if (actual !== expected) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username ?? undefined,
          role: user.role,
          plan: user.plan,
          wallet: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token = {
          ...token,
          id: user.id,
          email: user.email,
          username: (user as any).username ?? null,
          role: (user as any).role ?? "USER",
          plan: (user as any).plan ?? "FREE",
          wallet: { balance: 0 },
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: session.user?.name ?? null,
        username: (token as any).username ?? null,
        role: (token as any).role ?? "USER",
        plan: (token as any).plan ?? "FREE",
        wallet: (token as any).wallet ?? { balance: 0 },
      };
      return session;
    },
  },
});

export const GET = handlers;
export const POST = handlers;

async function hashPassword(password: string): Promise<string> {
  const nodeCrypto = await import("node:crypto");
  return nodeCrypto.createHash("sha256").update(password).digest("hex");
}

