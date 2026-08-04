import { ManagedPolicy } from "@/components/legal/ManagedPolicy";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "No Return & No Refund Policy",
  description:
    "Read Key Lanka's no-return and no-refund policy, including customer responsibilities for confirming product compatibility before ordering.",
  path: "/refund-policy",
});
export const dynamic = "force-dynamic";

export default function RefundPolicyPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <ManagedPolicy policyKey="refund" />
    </div>
  );
}
