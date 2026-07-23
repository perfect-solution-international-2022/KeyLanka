import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategories } from "@/lib/queries";
import type { Category } from "@/lib/api";

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
    <div className="light flex min-h-screen flex-col bg-background text-foreground">
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
