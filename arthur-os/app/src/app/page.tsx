import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">Arthur Digital Works OS</h1>
      <p className="text-slate-600">
        A one-person, AI-operated white-label product studio. Start with a
        free AI business audit — we&apos;ll tell you what a Growth-in-a-Box
        package could do for you.
      </p>
      <div className="flex gap-4">
        <Link href="/audit" className="rounded bg-slate-900 px-4 py-2 text-white">
          Get your free audit
        </Link>
        <Link href="/login" className="rounded border border-slate-900 px-4 py-2">
          Owner login
        </Link>
      </div>
    </main>
  );
}
