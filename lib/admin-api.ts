export interface AdminProduct {
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
  featured: boolean;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  focusKeywords: string | null;
  imageAlt: string | null;
  images: string[];
  productType: string | null;
  categoryId: number;
  brandId: number | null;
  category?: { id: number; name: string };
  brand?: { id: number; name: string } | null;
}

export interface AdminProductInput {
  name: string;
  slug?: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number;
  stock: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  soldIndividually?: boolean;
  rating?: number;
  reviewCount?: number;
  badge?: string | null;
  featured?: boolean;
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  metaDescription?: string;
  focusKeywords?: string;
  imageAlt?: string;
  images: string[];
  productType?: string | null;
  categoryId: number;
  brandId?: number | null;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  restricted: boolean;
  parentId: number | null;
  children?: AdminCategory[];
  _count?: { products: number };
}

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  _count?: { products: number };
}

export interface AdminService {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string | null;
}

export interface AdminOrder {
  id: number;
  status: string;
  total: string;
  shippingCost: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingPostalCode: string;
  shippingPhone: string;
  paymentMethod: string;
  paid: boolean;
  createdAt: string;
  user: { id: number; name: string; email: string };
  items: { id: number; name: string; price: string; quantity: number; productId: number }[];
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "BUYER" | "ADMIN";
  createdAt: string;
  orderCount: number;
  totalSpent: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "BUYER" | "ADMIN";
  createdAt: string;
}

export interface AdminUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "BUYER" | "ADMIN";
}

export interface AdminLocksmithApplication {
  id: number;
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
  user: { id: number; name: string; email: string };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  getShippingSettings: () => request<{ id: number; shippingCost: string }>("/shipping"),
  updateShippingSettings: (data: { shippingCost: number }) =>
    request<{ id: number; shippingCost: string }>("/shipping", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // products
  getProducts: (search?: string) => request<AdminProduct[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getProduct: (id: number) => request<AdminProduct>(`/products/${id}`),
  createProduct: (data: AdminProductInput) => request<AdminProduct>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: AdminProductInput) =>
    request<AdminProduct>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: "DELETE" }),
  updateProductStock: (id: number, stock: number) =>
    request<AdminProduct>(`/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),

  // categories
  getCategories: () => request<AdminCategory[]>("/categories"),
  createCategory: (data: { name: string; parentId?: number | null; image?: string | null; restricted?: boolean }) =>
    request<AdminCategory>("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: { name: string; parentId?: number | null; image?: string | null; restricted?: boolean }) =>
    request<AdminCategory>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request(`/categories/${id}`, { method: "DELETE" }),

  // brands
  getBrands: () => request<AdminBrand[]>("/brands"),
  createBrand: (data: { name: string; logo?: string | null }) =>
    request<AdminBrand>("/brands", { method: "POST", body: JSON.stringify(data) }),
  updateBrand: (id: number, data: { name: string; logo?: string | null }) =>
    request<AdminBrand>(`/brands/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBrand: (id: number) => request(`/brands/${id}`, { method: "DELETE" }),

  // services
  getServices: () => request<AdminService[]>("/services"),
  createService: (data: { title: string; description: string; icon?: string | null }) =>
    request<AdminService>("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: { title: string; description: string; icon?: string | null }) =>
    request<AdminService>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteService: (id: number) => request(`/services/${id}`, { method: "DELETE" }),

  // orders
  getOrders: () => request<AdminOrder[]>("/orders"),
  getOrder: (id: number) => request<AdminOrder>(`/orders/${id}`),
  updateOrderStatus: (id: number, status: string) =>
    request<AdminOrder>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // customers
  getCustomers: () => request<AdminCustomer[]>("/customers"),

  // accounts (all users, admin can create buyers or admins)
  getUsers: () => request<AdminUser[]>("/users"),
  createUser: (data: AdminUserInput) => request<AdminUser>("/users", { method: "POST", body: JSON.stringify(data) }),

  // locksmith merchant applications
  getLocksmithApplications: () => request<AdminLocksmithApplication[]>("/locksmith-applications"),
  updateLocksmithApplicationStatus: (id: number, status: "approved" | "rejected" | "disabled", rejectionReason?: string) =>
    request<AdminLocksmithApplication>(`/locksmith-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason }),
    }),
};
