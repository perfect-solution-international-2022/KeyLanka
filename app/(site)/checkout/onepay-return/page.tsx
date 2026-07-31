"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatOrderNumber } from "@/lib/order-number";

interface OrderStatus {
  id: number;
  paid: boolean;
  status: string;
  paymentStatusMessage: string | null;
}

function OnePayReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setAttempts] = useState(0);

  useEffect(() => {
    if (!orderId) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOrder(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    // OnePay's server-to-server webhook can arrive slightly after the browser
    // redirect, so poll a few times before settling on "still pending".
    const interval = setInterval(() => {
      setAttempts((a) => {
        if (a >= 6) {
          clearInterval(interval);
          return a;
        }
        poll();
        return a + 1;
      });
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Missing order reference</h1>
        <Link href="/shop" className="text-brand hover:underline">
          Return to shop
        </Link>
      </div>
    );
  }

  if (loading && !order) {
    return <div className="container-page py-20 text-center text-gray-400">Checking payment status...</div>;
  }

  if (order?.paid) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment successful</h1>
        <p className="text-gray-500 mb-6">{formatOrderNumber(order.id)} has been confirmed.</p>
        <Link
          href={`/account/orders/${order.id}`}
          className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md inline-block"
        >
          View Order
        </Link>
      </div>
    );
  }

  if (order && order.status === "cancelled") {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✕
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment not completed</h1>
        <p className="text-gray-500 mb-6">{order.paymentStatusMessage ?? "The payment was not successful."}</p>
        <Link href="/checkout" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md inline-block">
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-20 text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Waiting for payment confirmation</h1>
      <p className="text-gray-500 mb-6">
        We&apos;re still waiting to hear back from OnePay for {formatOrderNumber(orderId)}. This can take a moment — you can
        also check your order status on your account page.
      </p>
      <Link href="/account" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md inline-block">
        Go to My Account
      </Link>
    </div>
  );
}

export default function OnePayReturnPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-gray-400">Loading...</div>}>
      <OnePayReturnContent />
    </Suspense>
  );
}
