import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revenue OS",
  description: "The multi-agent revenue system, made usable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
