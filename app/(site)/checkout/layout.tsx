import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false, noarchive: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<Toaster position="top-center" richColors /></>;
}
