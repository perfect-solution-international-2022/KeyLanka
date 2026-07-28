import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Access",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="light min-h-screen bg-white">{children}</div>;
}
