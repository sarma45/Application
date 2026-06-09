import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async () => {
        // Placeholder: replace with user lookup + password verify in Phase 1
        return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }
});

export const GET = handlers.GET;
export const POST = handlers.POST;
