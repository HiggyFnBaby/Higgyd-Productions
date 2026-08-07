import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Every admin-only API route calls this first — the one place auth is
// enforced. Returns the authenticated User's id, not a workspace-scoped
// check — v1 has exactly one Workspace (see owner-decisions-needed.md #8),
// so there's nothing to scope yet. Once a real second operator exists,
// route handlers that need per-workspace data isolation should add a
// workspace-aware check the way
// ../../../revenue-os/app/src/lib/currentWorkspace.ts does — this function
// alone won't be enough at that point.
export async function requireOwner(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
