import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Credentials-based, JWT-session auth — same pattern as revenue-os/app.
// One Agent is one login; there's no team/workspace layer here (v1 targets
// solo agents, not brokerages).
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

        const agent = await prisma.agent.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!agent) return null;

        const valid = await bcrypt.compare(credentials.password, agent.passwordHash);
        if (!valid) return null;

        return { id: agent.id, email: agent.email, name: agent.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.agentId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.agentId as string;
      return session;
    },
  },
};
