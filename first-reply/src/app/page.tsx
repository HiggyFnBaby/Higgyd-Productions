import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold">FirstReply</h1>
      <p className="text-slate-600">
        Never lose another lead to slow response. Every new lead gets an instant,
        automatic first reply and follow-up — so it doesn&apos;t go cold before
        you can call back.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Log in
        </Link>
        <Link href="/signup" className="rounded border border-slate-300 px-4 py-2 text-sm">
          Create account
        </Link>
      </div>
    </div>
  );
}
