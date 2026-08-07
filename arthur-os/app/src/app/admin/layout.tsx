import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LogoutButton } from "@/components/LogoutButton";
import { ModeSelector } from "@/components/ModeSelector";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const settings = await getSettings();

  return (
    <div className="min-h-screen">
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold">
            Arthur — Command Center
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/leads" className="hover:underline">
              Leads
            </Link>
            <Link href="/admin/projects" className="hover:underline">
              Projects
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ModeSelector currentMode={settings.operatingMode} />
          <LogoutButton />
        </div>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
