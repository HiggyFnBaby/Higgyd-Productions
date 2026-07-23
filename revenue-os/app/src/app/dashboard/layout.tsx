import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getWorkspaceAccess } from "@/lib/access";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) redirect("/login");

  const { workspace, active, trialDaysRemaining, subscription } = await getWorkspaceAccess(
    session.user.workspaceId
  );
  const isPaid = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-bold">{workspace.name}</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Pipeline
            </Link>
            <Link href="/dashboard/billing" className="hover:underline">
              Billing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!isPaid && (
            <span className={`text-xs ${active ? "text-slate-500" : "font-semibold text-amber-600"}`}>
              {active ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left in trial` : "Trial ended"}
            </span>
          )}
          <LogoutButton />
        </div>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
