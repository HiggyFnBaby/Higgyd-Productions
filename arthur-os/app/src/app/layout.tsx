import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arthur Digital Works OS",
  description: "A one-person, AI-operated white-label product studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
