import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

export const metadata = { title: "Privacy Policy | Key Lanka" };

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <PrivacyPolicyContent />
    </div>
  );
}
