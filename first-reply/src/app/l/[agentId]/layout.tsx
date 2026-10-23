import type { Metadata } from "next";

// Each agent's lead form is a private landing page, not something to index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
