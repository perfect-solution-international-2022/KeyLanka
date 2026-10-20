"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Heart,
  Headphones,
  KeyRound,
  Mail,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth, useWishlist } from "@/app/providers";
import { api, formatCurrency, type Order } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { formatOrderNumber } from "@/lib/order-number";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const statuses: Record<string, { label: string; style: string }> = {
  pending: {
    label: "Pending",
    style: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  processing: {
    label: "Processing",
    style: "bg-blue-50 text-blue-800 ring-blue-200",
  },
  shipped: {
    label: "Shipped",
    style: "bg-violet-50 text-violet-800 ring-violet-200",
  },
  delivered: {
    label: "Delivered",
    style: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    style: "bg-muted text-muted-foreground ring-gray-200",
  },
};
const steps = ["pending", "processing", "shipped", "delivered"];
const stepLabels = ["Received", "Processing", "Shipped", "Delivered"];
const pageSize = 5;

function StatusBadge({ status }: { status: string }) {
  const info = statuses[status] ?? {
    label: status,
    style: "bg-muted text-muted-foreground ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${info.style}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  description,
  loading,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  description: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="@container/card h-full min-w-0 bg-linear-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{label}</span>
          <Icon
            aria-hidden="true"
            size={17}
            className={accent ? "text-brand" : "text-muted-foreground"}
          />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {loading ? (
            <span
              aria-label="Loading"
              className="block h-9 w-12 animate-pulse rounded bg-muted motion-reduce:animate-none"
            />
          ) : (
            (value ?? "—")
          )}
        </CardTitle>
      </CardHeader>
      <CardFooter className="text-xs text-muted-foreground">
        {description}
      </CardFooter>
    </Card>
  );
}

export default function AccountPage() {
  const auth = useAuth();
  const wishlist = useWishlist();

  const userId = auth.user?.id;
  const [result, setResult] = useState<{
    userId: number;
    orders: Order[];
    error: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (userId === undefined) return;
    let active = true;
    api
      .getOrders()
      .then((orders) => {
        if (active) setResult({ userId, orders, error: false });
      })
      .catch(() => {
        if (active) setResult({ userId, orders: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [userId, retry]);

  if (auth.loading) {
    return (
      <div className="bg-muted/40">
        <div className="container-page max-w-[1440px] py-12" role="status">
          <span className="sr-only">Loading your account dashboard</span>
          <div
            aria-hidden="true"
            className="space-y-6 animate-pulse motion-reduce:animate-none"
          >
            <div className="h-10 w-48 rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl border border-border bg-card shadow-xs"
                />
              ))}
            </div>
            <div className="h-72 rounded-xl border border-border bg-card shadow-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="bg-muted/40 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card shadow-xs p-7 text-center sm:p-10">
          <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <UserRound aria-hidden="true" size={26} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Your account, all in one place.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to view your orders, check their progress and find your
            saved products.
          </p>
          <Link
            href="/account/login"
            className={`mt-7 flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark ${focus}`}
          >
            Sign in to your account{" "}
            <ArrowRight aria-hidden="true" size={16} className="ml-2" />
          </Link>
          <p className="mt-5 text-sm text-muted-foreground">
            New to Key Lanka?{" "}
            <Link
              href="/account/register"
              className={`rounded font-semibold text-brand hover:underline ${focus}`}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const user = auth.user;
  const ownResult = result?.userId === user.id ? result : null;
  const ordersLoading = !ownResult;
  const ordersError = ownResult?.error ?? false;
  const orders = ownResult?.orders ?? [];
  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const activeOrders = orders.filter((o) =>
    ["pending", "processing", "shipped"].includes(o.status),
  );
  const latestOrder = sorted[0];
  const currentStep = latestOrder ? steps.indexOf(latestOrder.status) : -1;
  const query = search.trim().toLowerCase();
  const filtered = sorted.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (!query ||
        formatOrderNumber(o.id).toLowerCase().includes(query) ||
        o.items.some((item) => item.name.toLowerCase().includes(query))),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleOrders = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  const merchantOptions: Record<
    string,
    { title: string; text: string; action: string; href: string }
  > = {
    approved: {
      title: "Merchant access approved",
      text: "Explore locksmith tools and products available to your account.",
      action: "Browse locksmith tools",
      href: "/category/locksmith-tools",
    },
    pending: {
      title: "Application under review",
      text: "Your Locksmith Merchant application is with our team.",
      action: "View application",
      href: "/account/become-locksmith",
    },
    rejected: {
      title: "Merchant application update",
      text: "Review the feedback on your application and your next steps.",
      action: "View application",
      href: "/account/become-locksmith",
    },
    disabled: {
      title: "Merchant access disabled",
      text: "Contact our team if you have questions about your merchant access.",
      action: "Contact support",
      href: "/contact",
    },
  };
  const merchant = merchantOptions[user.locksmithStatus ?? ""] ?? {
    title: "Are you a locksmith?",
    text: "Apply for a Locksmith Merchant account to access specialist tools and products.",
    action: "Explore merchant access",
    href: "/account/become-locksmith",
  };

  return (
    <div className="min-w-0 space-y-6" id="overview">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            My account
          </p>
          <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your orders, saved favourites and account details. All in one place.
          </p>
        </div>
        <Link
          href="/shop"
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark ${focus}`}
        >
          <ShoppingBag aria-hidden="true" size={16} />
          Continue shopping
          <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </header>

      <section
        aria-label="Account overview"
        className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        <Metric
          icon={Package}
          label="Total orders"
          value={ordersError ? null : orders.length}
          description="All your orders"
          loading={ordersLoading}
          accent
        />
        <Metric
          icon={Truck}
          label="Active orders"
          value={ordersError ? null : activeOrders.length}
          description="Pending or on the way"
          loading={ordersLoading}
        />
        <Metric
          icon={CircleCheck}
          label="Delivered"
          value={
            ordersError
              ? null
              : orders.filter((o) => o.status === "delivered").length
          }
          description="Completed deliveries"
          loading={ordersLoading}
        />
        <Link
          href="/wishlist"
          aria-label="View your wishlist"
          className={`rounded-2xl transition-shadow hover:shadow-sm ${focus}`}
        >
          <Metric
            icon={Heart}
            label="Wishlist"
            value={wishlist.count}
            description="Saved for your next visit"
            loading={wishlist.loading}
          />
        </Link>
      </section>

      {!ordersLoading && !ordersError && latestOrder && (
        <section
          aria-labelledby="latest-order-heading"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <h2
              id="latest-order-heading"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <span
                className="size-2 rounded-full bg-brand"
                aria-hidden="true"
              />
              Latest order
            </h2>
            <StatusBadge status={latestOrder.status} />
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold tracking-tight text-foreground">
                  {formatOrderNumber(latestOrder.id)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placed{" "}
                  {new Date(latestOrder.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Link
                href={`/account/orders/${latestOrder.id}`}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted/40 ${focus}`}
              >
                View order
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>
            {currentStep >= 0 ? (
              <ol aria-label="Order progress" className="mt-7 grid grid-cols-4">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    aria-current={index === currentStep ? "step" : undefined}
                    className="relative min-w-0 text-center"
                  >
                    {index < steps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-1/2 top-3.5 h-0.5 w-full ${index < currentStep ? "bg-brand" : "bg-muted"}`}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative mx-auto flex size-7 items-center justify-center rounded-full border-4 border-white text-[10px] font-bold ring-1 ${index <= currentStep ? "bg-brand text-white ring-brand" : "bg-muted text-muted-foreground ring-gray-200"}`}
                    >
                      {index < currentStep ? <Check size={12} /> : index + 1}
                    </span>
                    <span
                      className={`mt-3 block text-[10px] font-medium sm:text-xs ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {stepLabels[index]}
                      <span className="sr-only">
                        {index < currentStep
                          ? ", complete"
                          : index === currentStep
                            ? ", current status"
                            : ", upcoming"}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 rounded-lg bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                {latestOrder.status === "cancelled"
                  ? "This order was cancelled. You can view its details or continue shopping."
                  : "Open this order to see the latest details."}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section
          id="orders"
          aria-labelledby="orders-heading"
          className="min-w-0 scroll-mt-6 rounded-xl border border-border bg-card shadow-xs"
        >
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="orders-heading"
                className="text-base font-bold text-foreground"
              >
                Order history
              </h2>
              <span className="text-xs text-muted-foreground">
                {ordersLoading
                  ? "Loading orders…"
                  : ordersError
                    ? "Unavailable"
                    : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Keep track of every Key Lanka order.
            </p>
            {!ordersLoading && !ordersError && orders.length > 0 && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden="true"
                    size={16}
                    className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground"
                  />
                  <label htmlFor="order-search" className="sr-only">
                    Search orders by number or product
                  </label>
                  <input
                    id="order-search"
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search order or product…"
                    className={`h-11 w-full min-w-0 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground ${focus}`}
                  />
                </div>
                <label htmlFor="order-status" className="sr-only">
                  Filter orders by status
                </label>
                <select
                  id="order-status"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`h-11 min-w-0 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground sm:max-w-40 ${focus}`}
                >
                  <option value="all">All statuses</option>
                  {Object.entries(statuses).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {ordersLoading ? (
            <div role="status" className="space-y-4 p-6">
              <span className="sr-only">Loading orders</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="h-24 animate-pulse rounded-xl bg-muted/40 motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : ordersError ? (
            <div className="px-6 py-12 text-center" role="alert">
              <CircleAlert
                aria-hidden="true"
                size={28}
                className="mx-auto mb-3 text-amber-600"
              />
              <h3 className="text-sm font-semibold text-foreground">
                We couldn&apos;t load your orders
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Please try again in a moment.
              </p>
              <button
                onClick={() => {
                  setResult(null);
                  setRetry((value) => value + 1);
                }}
                className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted/40 ${focus}`}
              >
                <RefreshCw aria-hidden="true" size={15} />
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
                <ShoppingBag aria-hidden="true" size={25} />
              </span>
              <h3 className="text-base font-semibold text-foreground">
                Your first order starts here
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Explore car keys, remotes and locksmith tools. Your orders will
                appear here.
              </p>
              <Link
                href="/shop"
                className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark ${focus}`}
              >
                Explore the shop
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center" role="status">
              <Search
                aria-hidden="true"
                size={26}
                className="mx-auto mb-3 text-muted-foreground"
              />
              <h3 className="text-sm font-semibold text-foreground">
                No matching orders
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different search or status.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                  setPage(1);
                }}
                className={`mt-4 min-h-11 rounded-lg px-4 text-sm font-semibold text-brand hover:bg-brand-light ${focus}`}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {visibleOrders.map((order) => (
                  <li key={order.id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className={`rounded text-sm font-bold text-foreground hover:text-brand ${focus}`}
                      >
                        {formatOrderNumber(order.id)}
                      </Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <span className="mx-2" aria-hidden="true">
                        ·
                      </span>
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}{" "}
                      items
                    </p>
                    <p
                      className="mt-3 truncate text-sm text-muted-foreground"
                      title={order.items.map((item) => item.name).join(", ")}
                    >
                      {order.items[0]?.name ?? "Order details"}
                      {order.items.length > 1
                        ? ` + ${order.items.length - 1} more`
                        : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(order.total)}
                      </span>
                      <Link
                        href={`/account/orders/${order.id}`}
                        aria-label={`View order ${formatOrderNumber(order.id)}`}
                        className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:border-gray-300 hover:bg-muted/40 ${focus}`}
                      >
                        View order
                        <ArrowUpRight aria-hidden="true" size={14} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
                <p className="text-xs text-muted-foreground" role="status">
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                {pageCount > 1 && (
                  <nav
                    aria-label="Order history pages"
                    className="flex items-center gap-2"
                  >
                    <button
                      aria-label="Previous page"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                      className={`flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}
                    >
                      <ChevronLeft aria-hidden="true" size={16} />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {currentPage} / {pageCount}
                    </span>
                    <button
                      aria-label="Next page"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                      className={`flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}
                    >
                      <ChevronRight aria-hidden="true" size={16} />
                    </button>
                  </nav>
                )}
              </div>
            </>
          )}
        </section>

        <div className="min-w-0 space-y-5">
          <section
            id="account-details"
            aria-labelledby="account-details-heading"
            className="scroll-mt-6 rounded-xl border border-border bg-card shadow-xs p-5 sm:p-6"
          >
            <h2
              id="account-details-heading"
              className="text-sm font-bold text-foreground"
            >
              Account details
            </h2>
            <div className="mt-5 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                <UserRound aria-hidden="true" size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Full name</p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {user.name}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                <Mail aria-hidden="true" size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">
                  Email address
                </p>
                <p className="mt-1 break-all text-sm font-medium text-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                <Phone aria-hidden="true" size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">
                  Phone number
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {user.phone || "Not provided"}
                </p>
              </div>
            </div>
          </section>
          <section
            aria-labelledby="merchant-heading"
            className="rounded-2xl border border-red-100 bg-[#fff4f3] p-5 sm:p-6"
          >
            <KeyRound
              aria-hidden="true"
              size={22}
              className="mb-4 text-brand"
            />
            <h2
              id="merchant-heading"
              className="text-sm font-bold text-foreground"
            >
              {merchant.title}
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {merchant.text}
            </p>
            <Link
              href={merchant.href}
              className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded text-xs font-semibold text-brand hover:underline ${focus}`}
            >
              {merchant.action}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </section>
          <section
            aria-labelledby="help-heading"
            className="rounded-xl border border-border bg-card shadow-xs p-5 sm:p-6"
          >
            <Headphones
              aria-hidden="true"
              size={22}
              className="mb-4 text-muted-foreground"
            />
            <h2 id="help-heading" className="text-sm font-bold text-foreground">
              A little help?
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Questions about an order or choosing the right product? Our team
              is here.
            </p>
            <Link
              href="/support"
              className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded text-xs font-semibold text-foreground hover:text-brand ${focus}`}
            >
              Contact support
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
