import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands, services] = await Promise.all([
    prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
        images: true,
        category: { select: { restricted: true, parent: { select: { restricted: true } } } },
      },
    }),
    prisma.category.findMany({
      select: {
        slug: true,
        createdAt: true,
        image: true,
        restricted: true,
        parent: { select: { restricted: true } },
      },
    }),
    prisma.brand.findMany({ select: { slug: true, createdAt: true, logo: true } }),
    prisma.service.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/brands"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/why-choose-us"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/support"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/privacy-policy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/refund-policy"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products
    .filter((product) => !product.category.restricted && !product.category.parent?.restricted)
    .map((product) => {
      const images = Array.isArray(product.images)
        ? product.images.filter((image): image is string => typeof image === "string").map(absoluteUrl)
        : [];
      return {
        url: absoluteUrl(`/product/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images,
      };
    });

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((category) => !category.restricted && !category.parent?.restricted)
    .map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: category.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: category.image ? [absoluteUrl(category.image)] : undefined,
    }));

  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: absoluteUrl(`/brand/${brand.slug}`),
    lastModified: brand.createdAt,
    changeFrequency: "weekly",
    priority: 0.7,
    images: brand.logo ? [absoluteUrl(brand.logo)] : undefined,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: absoluteUrl(`/services/${service.slug}`),
    lastModified: service.createdAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...brandPages, ...servicePages, ...productPages];
}

