export interface AdminAttributeValue {
  id: number;
  attributeId: number;
  value: string;
}

export interface AdminAttribute {
  id: number;
  name: string;
  slug: string;
  values: AdminAttributeValue[];
}

export interface AdminCondition { id: number; name: string; slug: string; _count?: { products: number; variants: number } }

export interface AdminProductVariant {
  id?: number;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  wholesalePrice: string | null;
  productCost: string | null;
  stockStatus: string;
  stock: number;
  lowStockThreshold: number;
  weightKg: string | null;
  lengthCm: string | null;
  widthCm: string | null;
  heightCm: string | null;
  image: string | null;
  isDefault: boolean;
  conditionIds: number[];
  attributeValueIds: number[];
}

export interface AdminProductVariantInput {
  id?: number;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  wholesalePrice?: number | null;
  productCost?: number | null;
  stockStatus: string;
  stock: number;
  lowStockThreshold: number;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  image?: string | null;
  isDefault: boolean;
  conditionIds: number[];
  attributeValueIds: number[];
}

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
  allowNoWarranty: boolean;
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
  deletedAt: string | null;
  categoryId: number;
  brandId: number | null;
  conditions?: AdminCondition[];
  category?: { id: number; name: string };
  categories?: { id: number; name: string }[];
  brand?: { id: number; name: string } | null;
  variants?: AdminProductVariant[];
  warranties?: AdminWarranty[];
}
export interface AdminWarranty { id: number; name: string; days: number; price: string; active: boolean }

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
  allowNoWarranty?: boolean;
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
  categoryIds: number[];
  brandId?: number | null;
  conditionIds: number[];
  variants?: AdminProductVariantInput[];
  warrantyIds: number[];
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
  paymentSlipAssetId: string | null;
  createdAt: string;
  deletedAt: string | null;
  user: { id: number; name: string; email: string };
  policyAgreement?: { accepted: boolean; acceptedAt: string; policies: { key: string; title: string; content: string; version: number }[] } | null;
  items: { id: number; name: string; sku: string | null; variantDetails: string | null; price: string; quantity: number; productId: number; variantId: number | null; warrantyName: string | null; warrantyDays: number | null; warrantyPrice: string }[];
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "BUYER" | "ADMIN" | "PRODUCT_MANAGER";
  createdAt: string;
  orderCount: number;
  totalSpent: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "BUYER" | "ADMIN" | "PRODUCT_MANAGER";
  createdAt: string;
}

export interface AdminUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "BUYER" | "ADMIN" | "PRODUCT_MANAGER";
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
  getBankTransferSettings: () => request<{
    id: number; enabled: boolean; bankName: string; branchName: string; accountName: string; accountNumber: string;
  }>("/bank-transfer"),
  updateBankTransferSettings: (data: {
    enabled: boolean; bankName: string; branchName: string; accountName: string; accountNumber: string;
  }) => request<{ id: number; enabled: boolean; bankName: string; branchName: string; accountName: string; accountNumber: string }>(
    "/bank-transfer", { method: "PATCH", body: JSON.stringify(data) }
  ),
  getShippingSettings: () => request<{ id: number; shippingCost: string }>("/shipping"),
  updateShippingSettings: (data: { shippingCost: number }) =>
    request<{ id: number; shippingCost: string }>("/shipping", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // maintenance mode
  getMaintenanceSettings: () =>
    request<{ id: number; enabled: boolean; message: string | null }>("/maintenance"),
  updateMaintenanceSettings: (data: { enabled: boolean; message?: string | null }) =>
    request<{ id: number; enabled: boolean; message: string | null }>("/maintenance", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  clearSiteCache: () =>
    request<{ ok: true; clearedAt: string }>("/maintenance", { method: "POST" }),

  // attributes
  getAttributes: () => request<AdminAttribute[]>("/attributes"),
  getConditions: () => request<AdminCondition[]>("/conditions"),
  createCondition: (data: { name: string }) => request<AdminCondition>("/conditions", { method: "POST", body: JSON.stringify(data) }),
  updateCondition: (id: number, data: { name: string }) => request<AdminCondition>(`/conditions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCondition: (id: number) => request(`/conditions/${id}`, { method: "DELETE" }),
  getWarranties: () => request<AdminWarranty[]>("/warranties"),
  createAttribute: (data: { name: string; values: string[] }) =>
    request<AdminAttribute>("/attributes", { method: "POST", body: JSON.stringify(data) }),
  updateAttribute: (id: number, data: { name?: string; addValues?: string[] }) =>
    request<AdminAttribute>(`/attributes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAttribute: (id: number) => request(`/attributes/${id}`, { method: "DELETE" }),
  deleteAttributeValue: (id: number) => request(`/attributes/values/${id}`, { method: "DELETE" }),

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
  moveOrderToTrash: (id: number) => request<AdminOrder>(`/orders/${id}`, { method: "DELETE" }),
  restoreTrashItem: (type: "order" | "product" | "category" | "brand" | "service" | "attribute" | "attributeValue", id: number) =>
    request<{ ok: true }>(`/trash/${type}/${id}`, { method: "PATCH" }),

  // customers
  getCustomers: () => request<AdminCustomer[]>("/customers"),
  setCustomerSuspension: (id: number, suspended: boolean, reason?: string) =>
    request<{ suspendedAt: string | null; suspensionReason: string | null }>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ suspended, reason }),
    }),

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
