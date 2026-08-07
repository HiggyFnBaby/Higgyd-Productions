import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Single-Owner, credentials-based, JWT-session auth — there is no signup
// route in v1, the Owner row is created by `npm run db:seed`
// (prisma/seed.ts) from OWNER_EMAIL/OWNER_PASSWORD. See
// ../../docs/architecture.md for why this app is single-tenant in v1.
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const owner = await prisma.owner.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!owner) return null;

        const valid = await bcrypt.compare(credentials.password, owner.passwordHash);
        if (!valid) return null;

        return { id: owner.id, email: owner.email, name: owner.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.ownerId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.ownerId as string;
      return session;
    },
  },
};
