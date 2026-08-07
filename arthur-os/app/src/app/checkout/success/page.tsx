export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">Payment received</h1>
      <p className="text-slate-600">
        Thanks — your payment is confirmed. We verify every payment
        server-side via Stripe&apos;s webhook before starting production, so
        this page is informational only; your order confirmation and
        delivery will follow by email once independent QA and red-team
        review pass.
      </p>
    </main>
  );
}
