import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getCategories } from "@/lib/queries";
import type { Category } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import { Providers } from "@/app/providers";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Category[] = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  return (
    <Providers>
    <div className="light flex min-h-screen flex-col bg-background text-foreground pb-16 md:pb-0">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": ["AutoPartsStore", "LocalBusiness"],
            "@id": `${absoluteUrl("/")}#business`,
            name: "Key Lanka",
            url: absoluteUrl("/"),
            logo: absoluteUrl("/logo.png"),
            image: absoluteUrl("/og.png"),
            telephone: "+94 77 777 7678",
            email: "dkranga@yahoo.com",
            priceRange: "Rs.",
            address: {
              "@type": "PostalAddress",
              streetAddress: "No 620 High Level Road, Wijerama",
              addressLocality: "Nugegoda",
              addressCountry: "LK",
            },
            areaServed: { "@type": "Country", name: "Sri Lanka" },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${absoluteUrl("/")}#website`,
            name: "Key Lanka",
            url: absoluteUrl("/"),
            inLanguage: "en-LK",
          },
        ]}
      />
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
    </Providers>
  );
}
