import Link from "next/link";

// Shared shell for /terms and /privacy so the two pages read as a set.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-slate-800">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Arthur Digital Works OS
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated {updated}</p>
      <div className="mt-8 flex flex-col gap-4 text-sm leading-6 text-slate-700 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </main>
  );
}
