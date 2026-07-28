import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getProductBySlug, isServerLocksmithAuthorized } from "@/lib/queries";
import ProductDetail from "@/components/ProductDetail";
import { absoluteUrl, pageMetadata, seoDescription } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return {};

  const title = product.seoTitle || product.name;
  const description = seoDescription(product.metaDescription || product.shortDescription || product.description);
  const keywords = product.focusKeywords
    ? product.focusKeywords.split(",").map((keyword) => keyword.trim()).filter(Boolean)
    : undefined;

  const base = pageMetadata({
    title,
    description,
    path: `/product/${product.slug}`,
    image: product.images?.[0] || null,
    noIndex: Boolean(product.category?.restricted || product.category?.parent?.restricted),
  });
  return {
    ...base,
    keywords,
    openGraph: {
      ...base.openGraph,
      type: "website",
      images: product.images?.[0]
        ? [{ url: absoluteUrl(product.images[0]), alt: product.imageAlt || product.name }]
        : base.openGraph?.images,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  if ((product.category?.restricted || product.category?.parent?.restricted) && !(await isServerLocksmithAuthorized())) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restricted to Locksmith Merchants</h1>
        <p className="text-gray-500 mb-6">
          This product is only available to approved KeyLanka Locksmith Merchants.
        </p>
        <Link
          href="/account/become-locksmith"
          className="inline-block bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md"
        >
          Become a Locksmith Merchant
        </Link>
      </div>
    );
  }

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: seoDescription(product.metaDescription || product.shortDescription || product.description),
          sku: product.sku,
          image: product.images.map(absoluteUrl),
          category: product.category?.name,
          brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
          url: absoluteUrl(`/product/${product.slug}`),
          offers: {
            "@type": "Offer",
            priceCurrency: "LKR",
            price: Number(product.price).toFixed(2),
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : product.allowBackorder
                  ? "https://schema.org/BackOrder"
                  : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/product/${product.slug}`),
            seller: { "@id": `${absoluteUrl("/")}#business` },
          },
          aggregateRating:
            product.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: Number(product.rating),
                  reviewCount: product.reviewCount,
                }
              : undefined,
        }}
      />
      <div className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="container-page text-sm text-gray-500">
          Home <span className="mx-1">›</span> Shop <span className="mx-1">›</span>{" "}
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>
      </div>
      <ProductDetail product={product} />
    </div>
  );
}
