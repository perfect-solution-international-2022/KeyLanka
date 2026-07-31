import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<Toaster position="top-center" richColors /></>;
}
