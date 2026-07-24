import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getServerAuth } from "./auth-server";
import type { Category, Brand, Product, Service, ProductListResponse } from "./api";

// Server Component equivalent of isLocksmithAuthorized() in lib/locksmith.ts —
// reads the auth cookie via next/headers instead of an AuthUser object.
export async function isServerLocksmithAuthorized(): Promise<boolean> {
  const auth = await getServerAuth();
  return isAuthLocksmithAuthorized(auth);
}

// Same check, but for Route Handlers that already have a decoded auth payload
// (from getAuth(req)) instead of reading cookies via next/headers.
export async function isAuthLocksmithAuthorized(auth: { userId: number; role: string } | null): Promise<boolean> {
  if (!auth) return false;
  if (auth.role === "ADMIN") return true;
  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { locksmithStatus: true } });
  return user?.locksmithStatus === "approved";
}

// Server Components can only pass plain serializable data to Client Components.
// Prisma returns Decimal/Date instances for price/rating/timestamp fields, so we
// round-trip through JSON (same shape the old HTTP JSON API produced) before
// handing results to components. The JSON round-trip also matches the string/number
// shapes of the Category/Brand/Product/Service types used across the app.
function serialize<Out>(data: unknown): Out {
  return JSON.parse(JSON.stringify(data));
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { id: "asc" },
  });
  return serialize<Category[]>(categories);
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
  return category ? serialize<Category>(category) : null;
}

export async function getBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return serialize<Brand[]>(brands);
}

export async function getBrandBySlug(slug: string) {
  const brand = await prisma.brand.findUnique({ where: { slug } });
  return brand ? serialize<Brand>(brand) : null;
}

export interface ProductQueryParams {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  productType?: string;
  search?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export async function getProducts(params: ProductQueryParams, options?: { locksmithAuthorized?: boolean }) {
  const { category, brand, minPrice, maxPrice, productType, search, sort = "popularity", page = "1", limit = "12" } = params;

  const where: Prisma.ProductWhereInput = {};

  const categoryFilter: Prisma.CategoryWhereInput = {};
  if (category) categoryFilter.slug = { in: category.split(",") };
  if (!options?.locksmithAuthorized) categoryFilter.restricted = false;
  if (Object.keys(categoryFilter).length) where.category = categoryFilter;

  if (brand) where.brand = { slug: { in: brand.split(",") } };
  if (productType) where.productType = { in: productType.split(",") };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = new Prisma.Decimal(minPrice);
    if (maxPrice) where.price.lte = new Prisma.Decimal(maxPrice);
  }
  if (search) where.name = { contains: search };

  let orderBy: Prisma.ProductOrderByWithRelationInput = { reviewCount: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "newest") orderBy = { createdAt: "desc" };
  else if (sort === "rating") orderBy = { rating: "desc" };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: { category: true, brand: true },
    }),
    prisma.product.count({ where }),
  ]);

  return serialize<ProductListResponse>({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, brand: true },
  });
  return product ? serialize<Product>(product) : null;
}

export async function getServices() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } });
  return serialize<Service[]>(services);
}

export async function getServiceBySlug(slug: string) {
  const service = await prisma.service.findUnique({ where: { slug } });
  return service ? serialize<Service>(service) : null;
}

export async function mergeGuestData(sessionId: string | undefined | null, userId: number) {
  if (!sessionId) return;

  const guestCartItems = await prisma.cartItem.findMany({ where: { sessionId } });
  for (const item of guestCartItems) {
    const existing = await prisma.cartItem.findFirst({ where: { userId, productId: item.productId } });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({ where: { id: item.id }, data: { userId, sessionId: null } });
    }
  }

  const guestWishlistItems = await prisma.wishlistItem.findMany({ where: { sessionId } });
  for (const item of guestWishlistItems) {
    const existing = await prisma.wishlistItem.findFirst({ where: { userId, productId: item.productId } });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: item.id } });
    } else {
      await prisma.wishlistItem.update({ where: { id: item.id }, data: { userId, sessionId: null } });
    }
  }
}

// --- Admin dashboard ---

export async function getDashboardStats() {
  const [revenueAgg, totalOrders, totalProducts, totalCustomers] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  return {
    totalRevenue: Number(revenueAgg._sum.total ?? 0),
    totalOrders,
    totalProducts,
    totalCustomers,
  };
}

export async function getDailyOrderStats(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }

  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += Number(o.total);
    }
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
}

export async function getRecentOrders(limit = 8) {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, items: true },
  });

  return serialize<
    {
      id: number;
      customerName: string;
      customerEmail: string;
      itemCount: number;
      total: string;
      status: string;
      createdAt: string;
    }[]
  >(
    orders.map((o) => ({
      id: o.id,
      customerName: o.user.name,
      customerEmail: o.user.email,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    }))
  );
}

export async function getRecentCustomers(limit = 8) {
  const customers = await prisma.user.findMany({
    where: { role: "BUYER" },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return serialize<
    {
      id: number;
      name: string;
      email: string;
      orderCount: number;
      createdAt: string;
    }[]
  >(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      orderCount: c._count.orders,
      createdAt: c.createdAt,
    }))
  );
}

// --- Reports ---

export async function getSalesReport(days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, total: true, paymentMethod: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }

  const completed = orders.filter((o) => o.status !== "cancelled");
  for (const o of completed) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += Number(o.total);
    }
  }

  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = completed.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const statusCounts = new Map<string, number>();
  for (const o of orders) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);

  const paymentCounts = new Map<string, number>();
  for (const o of completed) paymentCounts.set(o.paymentMethod, (paymentCounts.get(o.paymentMethod) ?? 0) + 1);

  return serialize<{
    daily: { date: string; orders: number; revenue: number }[];
    totalRevenue: number;
    totalOrders: number;
    cancelledCount: number;
    avgOrderValue: number;
    byStatus: { status: string; count: number }[];
    byPaymentMethod: { method: string; count: number }[];
  }>({
    daily: Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v })),
    totalRevenue,
    totalOrders,
    cancelledCount: statusCounts.get("cancelled") ?? 0,
    avgOrderValue,
    byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
    byPaymentMethod: Array.from(paymentCounts.entries()).map(([method, count]) => ({ method, count })),
  });
}

export async function getItemReport() {
  const [products, orderItems] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: { not: "cancelled" } } },
      select: { productId: true, quantity: true, price: true },
    }),
  ]);

  const salesMap = new Map<number, { unitsSold: number; revenue: number }>();
  for (const oi of orderItems) {
    const cur = salesMap.get(oi.productId) ?? { unitsSold: 0, revenue: 0 };
    cur.unitsSold += oi.quantity;
    cur.revenue += Number(oi.price) * oi.quantity;
    salesMap.set(oi.productId, cur);
  }

  const list = products
    .map((p) => {
      const sales = salesMap.get(p.id) ?? { unitsSold: 0, revenue: 0 };
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name ?? "",
        brand: p.brand?.name ?? "",
        stock: p.stock,
        price: Number(p.price),
        unitsSold: sales.unitsSold,
        revenue: sales.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return serialize<typeof list>(list);
}

// --- Store settings (singleton row, id always 1) ---

export async function getStoreSettings() {
  return prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export async function getWholesaleMinQty(): Promise<number> {
  const settings = await getStoreSettings();
  return settings.wholesaleMinQty;
}
