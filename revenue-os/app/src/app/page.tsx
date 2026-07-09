import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">Revenue OS</h1>
      <p className="text-slate-600">
        Money is not a tool. Money is in systems. Every lead here moves
        through the chain: Signal &rarr; Offer &rarr; Angle &rarr;
        Conversation &rarr; Won.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-slate-900 px-4 py-2 text-white">
          Log in
        </Link>
        <Link href="/signup" className="rounded border border-slate-900 px-4 py-2">
          Create workspace
        </Link>
      </div>
    </main>
  );
}
