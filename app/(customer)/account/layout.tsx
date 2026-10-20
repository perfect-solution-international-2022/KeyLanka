import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { CustomerShell } from "@/components/account/CustomerShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="light min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <CustomerShell>{children}</CustomerShell>
        </TooltipProvider>
        <Toaster position="top-center" richColors />
      </div>
    </Providers>
  );
}
