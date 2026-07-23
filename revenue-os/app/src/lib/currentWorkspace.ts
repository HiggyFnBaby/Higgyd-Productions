import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Every API route that touches Lead/Task/AgentRun data calls this first.
// It's the one place tenant isolation is enforced: if there's no session or
// no workspaceId, the caller gets null and must return 401 — nothing past
// this point ever trusts a workspaceId that didn't come from the session.
export async function requireWorkspaceId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.workspaceId ?? null;
}
