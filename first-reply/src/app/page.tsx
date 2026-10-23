import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { FloatingBackground } from "@/components/FloatingBackground";
import { VideoSection } from "@/components/VideoSection";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <FloatingBackground />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <LogoMark size={72} />
        <h1 className="text-4xl font-bold text-white">FirstReply</h1>
        <p className="max-w-lg text-slate-200">
          Never lose another lead to slow response. Every new lead gets an instant,
          automatic first reply and follow-up — so it doesn&apos;t go cold before
          you can call back.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded border border-amber-400/60 bg-black/40 px-5 py-2 text-sm font-medium text-amber-200 backdrop-blur hover:bg-amber-400/10"
          >
            Create account
          </Link>
        </div>
        <VideoSection />
        <div className="flex gap-4 text-xs text-slate-300">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
