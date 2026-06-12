import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Please verify your email before signing in");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username ?? undefined,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }
      if (account?.provider === "google" || account?.provider === "github") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              username: user.name?.toLowerCase().replace(/\s+/g, "_") || user.email!.split("@")[0],
              role: "USER",
              plan: "FREE",
              isActive: true,
            },
          });
          await prisma.wallet.upsert({
            where: { userId: newUser.id },
            update: {},
            create: { userId: newUser.id, balance: 100, lifetimeEarned: 100, lifetimeSpent: 0 },
          });
        } else if (!existingUser.isActive) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { isActive: true },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string || user.email! },
          select: { id: true, email: true, username: true, role: true, plan: true },
        });
        if (dbUser) {
          token = {
            ...token,
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username ?? null,
            role: dbUser.role ?? "USER",
            plan: dbUser.plan ?? "FREE",
          };
        } else {
          token = {
            ...token,
            id: user.id,
            email: user.email,
            username: (user as any).username ?? null,
            role: (user as any).role ?? "USER",
            plan: (user as any).plan ?? "FREE",
          };
        }
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: (session.user as any)?.name ?? null,
        username: (token as any).username ?? null,
        role: (token as any).role ?? "USER",
        plan: (token as any).plan ?? "FREE",
      };
      return session;
    },
  },
};
