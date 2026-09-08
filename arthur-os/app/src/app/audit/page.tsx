import { AuditForm } from "@/components/AuditForm";

export default function AuditPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Free AI Business Audit</h1>
        <p className="mt-2 text-slate-600">
          Answer a few questions and we&apos;ll tell you honestly whether an
          AI Business Growth-in-a-Box package is a fit for you — no pressure,
          no fabricated results.
        </p>
      </div>
      <AuditForm />
    </main>
  );
}
