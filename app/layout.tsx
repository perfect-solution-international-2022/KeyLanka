import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: "Car Keys, Remotes & Locksmith Tools in Sri Lanka | Key Lanka",
    template: "%s | Key Lanka",
  },
  description: DEFAULT_DESCRIPTION,
  category: "Automotive",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: SITE_NAME,
    title: "Car Keys, Remotes & Locksmith Tools in Sri Lanka",
    description: DEFAULT_DESCRIPTION,
    url: siteUrl(),
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Key Lanka car keys, remotes and locksmith tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Keys, Remotes & Locksmith Tools in Sri Lanka",
    description: DEFAULT_DESCRIPTION,
    images: ["/og.png"],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
