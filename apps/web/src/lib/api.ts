const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("accessToken");
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options?.headers as any };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: "include",
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Public
  getProducts: (params?: Record<string, string>) =>
    fetchJson<{ data: any[]; meta: any }>("/products?" + new URLSearchParams(params)),
  getProduct: (slug: string) => fetchJson<{ data: any }>(`/products/${slug}`),
  getCategories: () => fetchJson<{ data: any[] }>("/categories"),
  validateCart: (items: { productId: string; quantity: number }[]) =>
    fetchJson<{ data: any }>("/cart/validate", { method: "POST", body: JSON.stringify({ items }) }),

  // Orders
  createOrder: (payload: any) =>
    fetchJson<{ data: any }>("/orders", { method: "POST", body: JSON.stringify(payload) }),
  getOrder: (orderNumber: string, lookup?: { phone?: string; email?: string }) =>
    fetchJson<{ data: any }>(`/orders/${orderNumber}?` + new URLSearchParams(lookup as any)),

  // Payments
  createPayment: (orderNumber: string) =>
    fetchJson<{ data: any }>("/payments/create", { method: "POST", body: JSON.stringify({ orderNumber }) }),
  mockPay: (paymentId: string) =>
    fetchJson<{ data: any }>("/payments/mock-pay", { method: "POST", body: JSON.stringify({ paymentId }) }),

  // Timeline
  getOrderTimeline: (orderNumber: string, lookup?: { phone?: string; email?: string }) =>
    fetchJson<{ data: any[] }>(`/orders/${orderNumber}/timeline?` + new URLSearchParams(lookup as any)),

  // Coupons
  getCoupon: (code: string) => fetchJson<{ data: any }>(`/coupons/${code}`),
  validateCoupon: (code: string, subtotal: number) =>
    fetchJson<{ data: any }>("/coupons/validate", { method: "POST", body: JSON.stringify({ code, subtotal }) }),

  // Customer Auth
  register: (payload: { email: string; password: string; name: string; phone: string }) =>
    fetchJson<{ data: any }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (email: string, password: string) =>
    fetchJson<{ data: any }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => fetchJson<{ data: any }>("/auth/logout", { method: "POST", body: JSON.stringify({}) }),
  me: () => fetchJson<{ data: any }>("/auth/me"),

  // Admin Auth
  adminLogin: (email: string, password: string) =>
    fetchJson<{ data: any }>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  adminLogout: () => fetchJson<{ data: any }>("/admin/auth/logout", { method: "POST" }),
  adminMe: () => fetchJson<{ data: any }>("/admin/auth/me"),

  // Admin Products
  getAdminProducts: (params?: Record<string, string>) =>
    fetchJson<{ data: any[]; meta: any }>("/admin/products?" + new URLSearchParams(params)),
  createProduct: (payload: any) =>
    fetchJson<{ data: any }>("/admin/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: any) =>
    fetchJson<{ data: any }>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  archiveProduct: (id: string) =>
    fetchJson<{ data: any }>(`/admin/products/${id}`, { method: "DELETE" }),

  // Admin Orders
  getAdminOrders: (params?: Record<string, string>) =>
    fetchJson<{ data: any[]; meta: any }>("/admin/orders?" + new URLSearchParams(params)),
  getAdminOrder: (id: string) => fetchJson<{ data: any }>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    fetchJson<{ data: any }>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  createShipment: (orderId: string, payload: any) =>
    fetchJson<{ data: any }>(`/admin/orders/${orderId}/shipments`, { method: "POST", body: JSON.stringify(payload) }),

  // Admin Stats
  getAdminStats: () => fetchJson<{ data: any }>("/admin/stats"),
};
