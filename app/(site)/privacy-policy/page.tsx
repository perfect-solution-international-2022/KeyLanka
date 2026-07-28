import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Read how Key Lanka collects, uses, protects and retains personal information when you use our website and services.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <PrivacyPolicyContent />
    </div>
  );
}
