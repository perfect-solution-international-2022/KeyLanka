import { redirect } from "next/navigation";
import { getVerifiedServerAuth } from "@/lib/auth-server";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getVerifiedServerAuth();
  if (!auth) redirect("/account/login?redirect=/admin/dashboard");
  if (auth.role !== "ADMIN" && auth.role !== "PRODUCT_MANAGER") redirect("/");
  return (
    <Providers>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </Providers>
  );
}
