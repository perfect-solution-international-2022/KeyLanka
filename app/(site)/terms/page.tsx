import { ManagedPolicy } from "@/components/legal/ManagedPolicy";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Review the terms and conditions governing purchases, payments, delivery and use of the Key Lanka website and services.",
  path: "/terms",
});

export const dynamic = "force-dynamic";
export default function TermsPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <ManagedPolicy policyKey="terms" />
    </div>
  );
}
