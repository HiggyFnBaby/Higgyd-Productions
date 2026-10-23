import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { FloatingBackground } from "@/components/FloatingBackground";
import { VideoSection } from "@/components/VideoSection";
import { HomeContent } from "@/components/HomeContent";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, PRICE_USD, FAQ } from "@/lib/site";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      audience: { "@type": "Audience", audienceType: "Real estate agents" },
      offers: {
        "@type": "Offer",
        price: PRICE_USD,
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: PRICE_USD,
          priceCurrency: "USD",
          billingDuration: 1,
          unitCode: "MON",
        },
        url: `${SITE_URL}/signup`,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <JsonLd data={STRUCTURED_DATA} />
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
        <HomeContent />
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
