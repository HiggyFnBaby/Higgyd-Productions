import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a FirstReply account and get a personal lead-capture link that replies to every new real estate lead instantly. $129/month per agent.",
  alternates: { canonical: "/signup" },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
