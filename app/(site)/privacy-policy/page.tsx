import { ManagedPolicy } from "@/components/legal/ManagedPolicy";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Read how Key Lanka collects, uses, protects and retains personal information when you use our website and services.",
  path: "/privacy-policy",
});
export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <ManagedPolicy policyKey="privacy" />
    </div>
  );
}
