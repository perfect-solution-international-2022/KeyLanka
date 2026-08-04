"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, ChevronRight, Loader2, Landmark, Upload } from "lucide-react";
import { useAuth, useCart } from "@/app/providers";
import { formatCurrency } from "@/lib/api";
import { getUnitPrice, getLineTotal, resolvePriceSource } from "@/lib/pricing";
import { LegalPolicyLink } from "@/components/legal/LegalPolicyLink";
import { LegalPolicyDialog, type LegalPolicy } from "@/components/legal/LegalPolicyDialog";

const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
  "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>;
}

function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
    />
  );
}

export default function CheckoutPage() {
  const auth = useAuth();
  const cart = useCart();

  const [shippingName, setShippingName] = useState("");

  useEffect(() => {
    if (auth.user?.name) queueMicrotask(() => setShippingName((prev) => prev || auth.user!.name));
  }, [auth.user]);
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [openPolicy, setOpenPolicy] = useState<LegalPolicy>(null);
  const [paymentMethod, setPaymentMethod] = useState<"onepay" | "bank_transfer">("onepay");
  const [bankSettings, setBankSettings] = useState<{ available: boolean; bankName?: string; branchName?: string; accountName?: string; accountNumber?: string }>({ available: false });
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);

  useEffect(() => {
    if (auth.user?.locksmithStatus !== "approved") return;
    fetch("/api/bank-transfer", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setBankSettings(data))
      .catch(() => setBankSettings({ available: false }));
  }, [auth.user?.locksmithStatus]);

  if (auth.loading || cart.loading) {
    return <div className="container-page py-16 text-center text-gray-400">Loading...</div>;
  }

  if (!auth.user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login to checkout</h1>
        <Link href="/account/login" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <Link href="/shop" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Continue Shopping
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms & Conditions to continue", {
        description: "Check the box confirming you've read our policies and your vehicle details are accurate.",
      });
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (paymentMethod === "bank_transfer") {
        if (!paymentSlip) throw new Error("Please upload your bank payment slip");
        const uploadBody = new FormData();
        uploadBody.append("file", paymentSlip);
        const uploadRes = await fetch("/api/bank-transfer/upload", { method: "POST", body: uploadBody });
        const upload = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(upload.error ?? "Could not upload payment slip");
        const orderRes = await fetch("/api/orders", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingName, shippingLine1, shippingCity, shippingDistrict, shippingPostalCode, shippingPhone, paymentMethod, paymentSlipAssetId: upload.assetId, policyAgreementAccepted: true }),
        });
        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(order.error ?? "Could not place order");
        await cart.refresh();
        window.location.href = `/account/orders/${order.id}`;
        return;
      }
      const res = await fetch("/api/checkout/onepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingName,
          shippingLine1,
          shippingCity,
          shippingDistrict,
          shippingPostalCode,
          shippingPhone,
          policyAgreementAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start OnePay checkout");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="border-b border-gray-100 bg-white py-4">
        <div className="container-page flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/cart" className="hover:text-brand">
            Cart
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Checkout</span>
        </div>
      </div>

      <div className="container-page py-8 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}

          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              Shipping Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel>Full Name</FieldLabel>
                <TextField required value={shippingName} onChange={(e) => setShippingName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Address</FieldLabel>
                <TextField
                  required
                  value={shippingLine1}
                  onChange={(e) => setShippingLine1(e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <TextField required value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <FieldLabel>District</FieldLabel>
                <select
                  required
                  value={shippingDistrict}
                  onChange={(e) => setShippingDistrict(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15 bg-white"
                >
                  <option value="" disabled>
                    Select district
                  </option>
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Postal Code</FieldLabel>
                <TextField
                  required
                  value={shippingPostalCode}
                  onChange={(e) => setShippingPostalCode(e.target.value)}
                  placeholder="e.g. 10250"
                  inputMode="numeric"
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextField
                  required
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="07X XXX XXXX"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              Payment Method
            </h2>
            <button type="button" onClick={() => setPaymentMethod("onepay")} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${paymentMethod === "onepay" ? "border-brand bg-brand-light" : "border-gray-200"}`}>
              <div className="h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                <CreditCard size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-brand">Card / Mobile Wallet</div>
                <div className="text-xs text-gray-500 mt-0.5">Pay securely via OnePay</div>
              </div>
            </button>
            {bankSettings.available && <div className="mt-3 space-y-4">
              <button type="button" onClick={() => setPaymentMethod("bank_transfer")} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${paymentMethod === "bank_transfer" ? "border-brand bg-brand-light" : "border-gray-200"}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Landmark size={17} /></div>
                <div><div className="text-sm font-semibold text-brand">Bank Transfer</div><div className="mt-0.5 text-xs text-gray-500">Approved locksmith members only</div></div>
              </button>
              {paymentMethod === "bank_transfer" && <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-gray-500">Bank</dt><dd className="font-semibold text-gray-900">{bankSettings.bankName}</dd></div>
                  <div><dt className="text-gray-500">Branch</dt><dd className="font-semibold text-gray-900">{bankSettings.branchName}</dd></div>
                  <div><dt className="text-gray-500">Account Name</dt><dd className="font-semibold text-gray-900">{bankSettings.accountName}</dd></div>
                  <div><dt className="text-gray-500">Account Number</dt><dd className="font-semibold text-gray-900">{bankSettings.accountNumber}</dd></div>
                </dl>
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                  <Upload size={18} className="text-brand" /><span className="min-w-0 flex-1 text-sm"><span className="font-medium text-gray-900">Upload payment slip</span><span className="block truncate text-xs text-gray-500">{paymentSlip?.name ?? "JPG, PNG, WebP or PDF (max 8MB)"}</span></span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required={paymentMethod === "bank_transfer"} className="sr-only" onChange={(e) => setPaymentSlip(e.target.files?.[0] ?? null)} />
                </label>
              </div>}
            </div>}
          </section>

          <label className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span>
              I have read and agree to the{" "}
              <LegalPolicyLink onOpen={() => setOpenPolicy("terms")}>Terms &amp; Conditions</LegalPolicyLink>,{" "}
              <LegalPolicyLink onOpen={() => setOpenPolicy("privacy")}>Privacy Policy</LegalPolicyLink>,{" "}
              <LegalPolicyLink onOpen={() => setOpenPolicy("refund")}>No Return &amp; No Refund Policy</LegalPolicyLink>,
              and confirm that the vehicle information I have provided is accurate.
              I also accept the selected warranty choice (including No Warranty where selected) and the applicable Warranty Conditions.
              {" "}<LegalPolicyLink onOpen={() => setOpenPolicy("warranty")}>View Warranty Conditions</LegalPolicyLink>.
            </span>
          </label>

          <LegalPolicyDialog policy={openPolicy} onClose={() => setOpenPolicy(null)} />

          <button
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Processing..." : paymentMethod === "bank_transfer" ? "Submit Bank Transfer Order" : "Continue to Payment"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck size={13} /> Secure checkout — your information is protected
          </p>
        </form>

        <aside className="bg-white border border-gray-200 rounded-xl p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
            {cart.items.map((item) => {
              const priceSource = resolvePriceSource(item.product, item.variant);
              const variantLabel = item.variant?.values
                .map((v) => v.attributeValue?.value)
                .filter(Boolean)
                .join(" / ");
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                    <Image
                      src={item.variant?.image || item.product.images?.[0] || "/products/placeholder-1.svg"}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1.5"
                    />
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</div>
                    {variantLabel && <div className="text-xs text-gray-400">{variantLabel}</div>}
                    <div className="text-xs text-gray-400">{item.warranty ? `${item.warranty.name} (+${formatCurrency(item.warranty.price)})` : "No Warranty"}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(getUnitPrice(priceSource, item.quantity) + Number(item.warranty?.price ?? 0))} each
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatCurrency(getLineTotal(priceSource, item.quantity) + Number(item.warranty?.price ?? 0) * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Shipping</span>
              <span className={cart.shippingCost === 0 ? "text-green-600 font-medium" : "font-medium text-gray-700"}>
                {cart.shippingCost === 0 ? "Free" : formatCurrency(cart.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-3">
              <span>Total</span>
              <span>{formatCurrency(cart.subtotal + cart.shippingCost)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
