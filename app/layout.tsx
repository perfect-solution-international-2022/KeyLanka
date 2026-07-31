import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { DEFAULT_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/hero-mobile.webp" type="image/webp" media="(max-width: 767px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/hero-desktop.webp" type="image/webp" media="(min-width: 768px)" fetchPriority="high" />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
