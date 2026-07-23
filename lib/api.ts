const API_URL = "/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  parentId: number | null;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  wholesalePrice: string | null;
  stock: number;
  rating: string;
  reviewCount: number;
  badge: string | null;
  description: string | null;
  images: string[];
  attributes: Record<string, unknown> | null;
  productType: string | null;
  categoryId: number;
  category?: Category;
  brandId: number | null;
  brand?: Brand | null;
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
  quantity: number;
  product: Product;
}

export interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
}

export type Role = "BUYER" | "ADMIN";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
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
  sendContact: (data: { name: string; email: string; message: string }) =>
    request("/contact", { method: "POST", body: JSON.stringify(data) }),
  getSettings: () => request<{ wholesaleMinQty: number }>("/settings"),

  // cart
  getCart: (sessionId: string) =>
    request<CartItem[]>("/cart", { headers: { "x-session-id": sessionId } }),
  addToCart: (sessionId: string, productId: number, quantity = 1) =>
    request<CartItem>("/cart", {
      method: "POST",
      headers: { "x-session-id": sessionId },
      body: JSON.stringify({ productId, quantity }),
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
    request<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: sessionId ? { "x-session-id": sessionId } : undefined,
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request<AuthUser>("/auth/me"),
  forgotPassword: (email: string) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

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
