import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { FloatingBackground } from "@/components/FloatingBackground";
import { DemoGate } from "@/components/DemoGate";

export const metadata: Metadata = {
  title: "Watch the FirstReply preview",
  description:
    "See how FirstReply answers every new real estate lead instantly and follows up at 3 and 10 days. Watch the quick preview video.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <main className="relative min-h-screen">
      <FloatingBackground />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <Link href="/" aria-label="FirstReply home">
          <LogoMark size={56} />
        </Link>
        <h1 className="text-3xl font-bold text-white">See FirstReply in action</h1>
        <p className="max-w-md text-slate-200">
          Every new lead gets an instant, automatic reply, and follow-up emails go out at 3 and 10
          days, so a lead never goes cold while you&apos;re busy.
        </p>
        <DemoGate />
      </div>
    </main>
  );
}
