import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// The one place tenant isolation is enforced: every API route touching
// Lead data must call this first and return 401 on null — never trust an
// agentId from anywhere else (a request body, a query param).
export async function requireAgentId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
