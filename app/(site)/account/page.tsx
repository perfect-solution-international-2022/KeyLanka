"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useAuth } from "@/app/providers";
import { api, formatCurrency } from "@/lib/api";
import { confirmToast } from "@/lib/confirm-toast";
import { formatOrderNumber } from "@/lib/order-number";

interface OrderSummary {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  items: { id: number; name: string; quantity: number; price: string }[];
}

export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (auth.user) {
      api
        .getOrders()
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    } else {
      setOrdersLoading(false);
    }
  }, [auth.user]);

  if (auth.loading) {
    return <div className="container-page py-16 text-center text-gray-400">Loading...</div>;
  }

  if (!auth.user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">You&apos;re not signed in</h1>
        <div className="flex gap-3 justify-center">
          <Link href="/account/login" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
            Login
          </Link>
          <Link href="/account/register" className="border border-gray-300 font-medium px-6 py-3 rounded-md">
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500 text-sm">
            {auth.user.name} · {auth.user.email}
          </p>
        </div>
        <button
          onClick={async () => {
            if (await confirmToast("Log out of your account?", { confirmLabel: "Log out" })) {
              await auth.logout();
              router.push("/account/login");
            }
          }}
          className="text-sm text-gray-500 hover:text-brand"
        >
          Logout
        </button>
      </div>

      <h2 className="font-semibold text-gray-900 mb-4">Order History</h2>
      {ordersLoading ? (
        <p className="text-gray-400 text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-sm">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium text-gray-900">{formatOrderNumber(o.id)}</div>
                <div className="text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s) ·{" "}
                  <span className="capitalize">{o.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="font-semibold text-gray-900">{formatCurrency(o.total)}</div>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium border border-gray-300 rounded-md px-2.5 py-1.5 hover:bg-gray-50 shrink-0"
                >
                  <Eye size={13} /> View Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
