import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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

        const user = await prisma.user.findUnique({
          where: { email },
          include: { wallets: true },
        });

        if (!user) return null;

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

        return {
          id: user.id,
          email: user.email,
          username: user.username ?? undefined,
          role: user.role,
          plan: user.plan,
          wallet: wallet ? { balance: wallet.balance } : { balance: 0 },
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token = {
          id: user.id,
          email: user.email,
          username: (user as any).username ?? null,
          role: (user as any).role ?? "USER",
          plan: (user as any).plan ?? "FREE",
          wallet: (user as any).wallet ?? { balance: 0 },
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        username: token.username as string | null,
        role: token.role as string,
        plan: token.plan as string,
        wallet: token.wallet as { balance: number },
      };
      return session;
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
