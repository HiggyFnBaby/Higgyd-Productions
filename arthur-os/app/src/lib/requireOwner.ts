import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Every admin-only API route calls this first — the one place auth is
// enforced, mirrored on the pattern
// ../../../revenue-os/app/src/lib/currentWorkspace.ts uses for tenant
// isolation there.
export async function requireOwner(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
