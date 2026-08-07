import Link from "next/link";

export default function AuditThankYouPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">Thanks — we got it</h1>
      <p className="text-slate-600">
        A real person (Derrick) reviews every audit submission personally
        before anything is offered or charged — we don&apos;t auto-send
        checkout links. If it looks like a fit, you&apos;ll hear back with a
        specific, priced recommendation.
      </p>
      <Link href="/" className="text-sm underline">
        Back to home
      </Link>
    </main>
  );
}
