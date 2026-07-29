const API_URL = "/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  restricted: boolean;
  parentId: number | null;
  parent?: Category | null;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  _count?: { products: number };
}

export interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  attribute?: { id: number; name: string; slug: string };
}

export interface ProductVariant {
  id: number;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  wholesalePrice: string | null;
  stockStatus: string;
  stock: number;
  lowStockThreshold: number;
  image: string | null;
  isDefault: boolean;
  values: { attributeValueId: number; attributeValue?: AttributeValue }[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  wholesalePrice: string | null;
  wholesaleMinQty: number;
  stock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  soldIndividually: boolean;
  rating: string;
  reviewCount: number;
  badge: string | null;
  featured?: boolean;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  focusKeywords: string | null;
  imageAlt: string | null;
  images: string[];
  attributes: Record<string, unknown> | null;
  productType: string | null;
  categoryId: number;
  category?: Category;
  brandId: number | null;
  brand?: Brand | null;
  variants?: ProductVariant[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string | null;
}

export interface CartItem {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  product: Product;
  variant?: ProductVariant | null;
}

export interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
}

export type Role = "BUYER" | "ADMIN";
export type LocksmithStatus = "pending" | "approved" | "rejected" | "disabled" | null;

export interface LocksmithApplication {
  id: number;
  userId: number;
  fullName: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  businessRegDocs: string[];
  nationalIdFront: string;
  nationalIdBack: string;
  address: string;
  utilityBillDoc: string;
  status: "pending" | "approved" | "rejected" | "disabled";
  rejectionReason: string | null;
  createdAt: string;
}

export type LocksmithApplicationInput = Omit<
  LocksmithApplication,
  "id" | "userId" | "status" | "rejectionReason" | "createdAt"
>;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  locksmithStatus?: LocksmithStatus;
}

export interface AdminMfaRequired {
  mfaRequired: true;
  challengeId: string;
  developmentCode?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getCategories: () => request<Category[]>("/categories"),
  getCategory: (slug: string) => request<Category>(`/categories/${slug}`),
  getBrands: () => request<Brand[]>("/brands"),
  getBrand: (slug: string) => request<Brand>(`/brands/${slug}`),
  getProducts: (params: Record<string, string | number | undefined> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") search.set(k, String(v));
    });
    const qs = search.toString();
    return request<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),
  getServices: () => request<Service[]>("/services"),
  getService: (slug: string) => request<Service>(`/services/${slug}`),
  getShipping: () => request<{ shippingCost: number }>("/shipping"),
  sendContact: (data: { name: string; email: string; message: string }) =>
    request("/contact", { method: "POST", body: JSON.stringify(data) }),
  // cart
  getCart: (sessionId: string) =>
    request<CartItem[]>("/cart", { headers: { "x-session-id": sessionId } }),
  addToCart: (sessionId: string, productId: number, quantity = 1, variantId?: number) =>
    request<CartItem>("/cart", {
      method: "POST",
      headers: { "x-session-id": sessionId },
      body: JSON.stringify({ productId, quantity, ...(variantId ? { variantId } : {}) }),
    }),
  updateCartItem: (sessionId: string, id: number, quantity: number) =>
    request<CartItem>(`/cart/${id}`, {
      method: "PATCH",
      headers: { "x-session-id": sessionId },
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (sessionId: string, id: number) =>
    request(`/cart/${id}`, { method: "DELETE", headers: { "x-session-id": sessionId } }),

  // wishlist
  getWishlist: (sessionId: string) =>
    request<WishlistItem[]>("/wishlist", { headers: { "x-session-id": sessionId } }),
  addToWishlist: (sessionId: string, productId: number) =>
    request<WishlistItem>("/wishlist", {
      method: "POST",
      headers: { "x-session-id": sessionId },
      body: JSON.stringify({ productId }),
    }),
  removeWishlistItem: (sessionId: string, id: number) =>
    request(`/wishlist/${id}`, { method: "DELETE", headers: { "x-session-id": sessionId } }),

  // auth
  register: (data: { name: string; email: string; password: string; phone?: string }, sessionId?: string) =>
    request<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      headers: sessionId ? { "x-session-id": sessionId } : undefined,
    }),
  login: (data: { email: string; password: string }, sessionId?: string) =>
    request<AuthUser | AdminMfaRequired>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: sessionId ? { "x-session-id": sessionId } : undefined,
    }),
  completeAdminMfa: (challengeId: string, code: string) =>
    request<AuthUser>("/auth/admin-mfa", {
      method: "POST",
      body: JSON.stringify({ challengeId, code }),
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request<AuthUser>("/auth/me"),
  forgotPassword: (email: string) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  // locksmith merchant application
  getMyLocksmithApplication: () => request<LocksmithApplication | null>("/locksmith/apply"),
  applyLocksmith: (data: LocksmithApplicationInput) =>
    request<LocksmithApplication>("/locksmith/apply", { method: "POST", body: JSON.stringify(data) }),

  // orders
  getOrders: () => request<any[]>("/orders"),
  getOrder: (id: number | string) => request<any>(`/orders/${id}`),
  createOrder: (data: {
    shippingName: string;
    shippingLine1: string;
    shippingCity: string;
    shippingDistrict: string;
    shippingPostalCode: string;
    shippingPhone: string;
    paymentMethod: "cod" | "bank_transfer";
  }) => request<any>("/orders", { method: "POST", body: JSON.stringify(data) }),
};

export function formatCurrency(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  return `Rs. ${n.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}
