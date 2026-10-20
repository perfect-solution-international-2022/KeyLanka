"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/app/providers";
import { api, LocksmithApplication } from "@/lib/api";
import { DocumentUploader } from "@/components/DocumentUploader";

const EMPTY_FORM = {
  fullName: "",
  mobileNumber: "",
  email: "",
  businessName: "",
  businessRegDocs: [] as string[],
  nationalIdFront: "",
  nationalIdBack: "",
  address: "",
  utilityBillDoc: "",
};

export default function BecomeLocksmithPage() {
  const auth = useAuth();
  const [application, setApplication] = useState<LocksmithApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      if (!auth.user) {
        setLoading(false);
        return;
      }
      setForm((f) => ({ ...f, fullName: auth.user!.name, email: auth.user!.email }));
      api.getMyLocksmithApplication().then(setApplication).catch(() => setApplication(null)).finally(() => setLoading(false));
    });
  }, [auth.user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      form.businessRegDocs.length === 0 ||
      !form.nationalIdFront ||
      !form.nationalIdBack ||
      !form.utilityBillDoc
    ) {
      toast.error("Please upload all required documents before submitting");
      return;
    }

    setSaving(true);
    try {
      const app = await api.applyLocksmith(form);
      setApplication(app);
      await auth.refresh();
      toast.success("Application submitted — we'll review it shortly");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (auth.loading || loading) {
    return <div className="container-page py-16 text-center text-gray-400">Loading...</div>;
  }

  if (!auth.user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login to apply</h1>
        <Link href="/account/login" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  if (application?.status === "approved") {
    return (
      <div className="container-page py-20 max-w-lg mx-auto text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re an approved Locksmith Merchant</h1>
        <p className="text-gray-500">
          You now have access to Locksmith Tools and other restricted categories and products.
        </p>
        <Link href="/category/locksmith-tools" className="inline-block mt-6 bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
          Browse Locksmith Tools
        </Link>
      </div>
    );
  }

  if (application?.status === "pending") {
    return (
      <div className="container-page py-20 max-w-lg mx-auto text-center">
        <div className="h-14 w-14 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-4">
          <Clock size={26} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
        <p className="text-gray-500">
          Thanks for applying, {application.fullName}. Our team is reviewing your Locksmith Merchant application
          and will notify you once it&apos;s approved.
        </p>
      </div>
    );
  }

  if (application?.status === "disabled") {
    return (
      <div className="container-page py-20 max-w-lg mx-auto text-center">
        <div className="h-14 w-14 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
          <XCircle size={26} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Locksmith Access Disabled</h1>
        <p className="text-gray-500">
          Your Locksmith Merchant access has been disabled by our team. Please{" "}
          <Link href="/contact" className="text-brand hover:underline">
            contact us
          </Link>{" "}
          if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-14 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Become a Locksmith Merchant</h1>
      <p className="text-gray-500 text-sm mb-8">
        Locksmith tools, key programmers and other restricted products are only available to approved Locksmith
        Merchants. Fill out the form below to apply.
      </p>

      {application?.status === "rejected" && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          <XCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Your previous application was not approved</div>
            {application.rejectionReason && <p className="mt-0.5 text-red-600">{application.rejectionReason}</p>}
            <p className="mt-1 text-red-600">You can review your details below and submit again.</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 border border-gray-200 rounded-xl p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
            <input
              required
              value={form.mobileNumber}
              onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
              placeholder="07X XXX XXXX"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business or Residential Address</label>
          <textarea
            required
            rows={3}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business Registration Certificate &amp; related documents
          </label>
          <DocumentUploader
            multiple
            urls={form.businessRegDocs}
            onChange={(urls) => setForm((f) => ({ ...f, businessRegDocs: urls }))}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">National ID Card — Front</label>
            <DocumentUploader
              urls={form.nationalIdFront ? [form.nationalIdFront] : []}
              onChange={(urls) => setForm((f) => ({ ...f, nationalIdFront: urls[0] ?? "" }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">National ID Card — Back</label>
            <DocumentUploader
              urls={form.nationalIdBack ? [form.nationalIdBack] : []}
              onChange={(urls) => setForm((f) => ({ ...f, nationalIdBack: urls[0] ?? "" }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Recent Utility Bill or Bank Statement (for address verification)
          </label>
          <DocumentUploader
            urls={form.utilityBillDoc ? [form.utilityBillDoc] : []}
            onChange={(urls) => setForm((f) => ({ ...f, utilityBillDoc: urls[0] ?? "" }))}
          />
        </div>

        <button
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
