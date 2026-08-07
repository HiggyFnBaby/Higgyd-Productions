import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">Checkout cancelled</h1>
      <p className="text-slate-600">No charge was made. Reach out any time if you have questions.</p>
      <Link href="/" className="text-sm underline">
        Back to home
      </Link>
    </main>
  );
}
