"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/providers";
import { api, formatCurrency } from "@/lib/api";
import { formatOrderNumber } from "@/lib/order-number";

interface OrderDetail {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingPostalCode: string;
  shippingPhone: string;
  paymentMethod: string;
  policyAgreement?: { accepted: boolean; acceptedAt: string; policies: { title: string; version: number }[] } | null;
  items: { id: number; name: string; quantity: number; price: string; warrantyName?: string | null; warrantyDays?: number | null; warrantyPrice?: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AccountOrderDetailPage() {
  const auth = useAuth();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.user) return;
    api
      .getOrder(params.id)
      .then(setOrder)
      .catch(() => setError("We couldn't find that order."))
      .finally(() => setLoading(false));
  }, [auth.user, params.id]);

  if (auth.loading || loading) {
    return <div className="container-page py-16 text-center text-gray-400">Loading...</div>;
  }

  if (!auth.user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">You&apos;re not signed in</h1>
        <Link href="/account/login" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
        <Link href="/account" className="text-brand hover:underline text-sm">
          Back to My Account
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 max-w-3xl">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand mb-6">
        <ArrowLeft size={15} /> Back to My Account
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{formatOrderNumber(order.id)}</h1>
          <p className="text-sm text-gray-500">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className="capitalize text-xs font-semibold bg-brand-light text-brand rounded-full px-3 py-1.5">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4 text-sm">
          <div className="font-semibold text-gray-900 mb-2">Shipping Address</div>
          <div className="text-gray-600 space-y-0.5">
            <div>{order.shippingName}</div>
            <div>{order.shippingLine1}</div>
            <div>
              {order.shippingCity}
              {order.shippingDistrict ? `, ${order.shippingDistrict}` : ""}
              {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
            </div>
            <div>{order.shippingPhone}</div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-sm">
          <div className="font-semibold text-gray-900 mb-2">Payment</div>
          <div className="text-gray-600 capitalize">{order.paymentMethod.replace("_", " ")}</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Items</div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500">Qty {item.quantity}</div>
                <div className="text-xs text-gray-500">Warranty: {item.warrantyName ?? "No Warranty"}{item.warrantyDays ? ` (${item.warrantyDays} days)` : ""}</div>
              </div>
              <div className="text-gray-900">{formatCurrency((Number(item.price) + Number(item.warrantyPrice ?? 0)) * item.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
      {order.policyAgreement?.accepted && <div className="mt-5 rounded-lg border border-gray-200 p-4 text-sm"><div className="font-semibold text-gray-900">Policy Agreement</div><p className="mt-1 text-gray-600">You accepted the selected warranty choice, Warranty Conditions, Terms & Conditions and Refund Policy on {new Date(order.policyAgreement.acceptedAt).toLocaleString()}.</p><p className="mt-2 text-xs text-gray-400">{order.policyAgreement.policies.map((p)=>`${p.title} v${p.version}`).join(" · ")}</p></div>}
    </div>
  );
}
