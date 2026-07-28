import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") ?? undefined;

  const products = await prisma.product.findMany({
    where: search ? { name: { contains: search } } : undefined,
    include: { category: true, brand: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(products);
}

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  sku: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  wholesalePrice: z.number().positive().nullable().optional(),
  wholesaleMinQty: z.number().int().min(1).optional(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowBackorder: z.boolean().optional(),
  soldIndividually: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  badge: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  focusKeywords: z.string().optional(),
  imageAlt: z.string().optional(),
  images: z.array(z.string()).min(1),
  productType: z.string().nullable().optional(),
  categoryId: z.number(),
  brandId: z.number().nullable().optional(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) return NextResponse.json({ error: "SKU already in use" }, { status: 409 });

  const requestedSlug = slugify(data.slug || data.name);
  let slug = requestedSlug;
  let suffix = 0;
  while (await prisma.product.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${requestedSlug}-${suffix}`;
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      sku: data.sku,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      wholesalePrice: data.wholesalePrice ?? null,
      wholesaleMinQty: data.wholesaleMinQty ?? 10,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold ?? 10,
      allowBackorder: data.allowBackorder ?? false,
      soldIndividually: data.soldIndividually ?? false,
      rating: data.rating ?? 0,
      reviewCount: data.reviewCount ?? 0,
      badge: data.badge || null,
      featured: data.featured ?? false,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      seoTitle: data.seoTitle || null,
      metaDescription: data.metaDescription || null,
      focusKeywords: data.focusKeywords || null,
      imageAlt: data.imageAlt || null,
      images: data.images,
      productType: data.productType || null,
      categoryId: data.categoryId,
      brandId: data.brandId ?? null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
